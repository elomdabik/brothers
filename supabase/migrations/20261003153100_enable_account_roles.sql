ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE u.id = p.user_id
  AND p.email IS DISTINCT FROM u.email;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone, email)
  VALUES (
    NEW.id,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'phone'), ''),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.sync_profile_email();

DROP TRIGGER IF EXISTS protect_profile_email ON public.profiles;
CREATE TRIGGER protect_profile_email
BEFORE INSERT OR UPDATE OF user_id, email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_email();

DROP POLICY IF EXISTS "Public can insert products" ON public.products;
DROP POLICY IF EXISTS "Public can update products" ON public.products;
DROP POLICY IF EXISTS "Public can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Product managers can insert products" ON public.products;
DROP POLICY IF EXISTS "Product managers can update products" ON public.products;
DROP POLICY IF EXISTS "Product managers can delete products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;

CREATE POLICY "Public can view products"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Product managers can insert products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'product_manager'::public.app_role));

CREATE POLICY "Product managers can update products"
ON public.products FOR UPDATE
USING (public.has_role(auth.uid(), 'product_manager'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'product_manager'::public.app_role));

CREATE POLICY "Product managers can delete products"
ON public.products FOR DELETE
USING (public.has_role(auth.uid(), 'product_manager'::public.app_role));

DROP POLICY IF EXISTS "Public can insert offers" ON public.offers;
DROP POLICY IF EXISTS "Public can update offers" ON public.offers;
DROP POLICY IF EXISTS "Public can delete offers" ON public.offers;
DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;
DROP POLICY IF EXISTS "Product managers can insert offers" ON public.offers;
DROP POLICY IF EXISTS "Product managers can update offers" ON public.offers;
DROP POLICY IF EXISTS "Product managers can delete offers" ON public.offers;
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;
DROP POLICY IF EXISTS "Public can view offers" ON public.offers;

CREATE POLICY "Public can view offers"
ON public.offers FOR SELECT
USING (true);

CREATE POLICY "Admins can manage offers"
ON public.offers FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Product managers can insert offers"
ON public.offers FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'product_manager'::public.app_role));

CREATE POLICY "Product managers can update offers"
ON public.offers FOR UPDATE
USING (public.has_role(auth.uid(), 'product_manager'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'product_manager'::public.app_role));

CREATE POLICY "Product managers can delete offers"
ON public.offers FOR DELETE
USING (public.has_role(auth.uid(), 'product_manager'::public.app_role));

DROP POLICY IF EXISTS "Public can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Product managers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Product managers can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Product managers can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Product managers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'product_manager'::public.app_role)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Product managers can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'product_manager'::public.app_role)
)
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'product_manager'::public.app_role)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Product managers can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'product_manager'::public.app_role)
);

DO $$
DECLARE
  initial_admin_id UUID;
BEGIN
  SELECT id INTO initial_admin_id
  FROM auth.users
  WHERE LOWER(email) = LOWER('elomdabik@gmail.com')
  LIMIT 1;

  IF initial_admin_id IS NULL THEN
    RAISE EXCEPTION 'Initial admin account elomdabik@gmail.com was not found in auth.users';
  END IF;

  INSERT INTO public.profiles (user_id, email, approved)
  VALUES (initial_admin_id, 'elomdabik@gmail.com', true)
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      approved = true;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (initial_admin_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
