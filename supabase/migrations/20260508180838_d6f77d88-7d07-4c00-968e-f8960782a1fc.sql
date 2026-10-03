-- Remove auth-based RLS since the app no longer uses Supabase authentication.
-- Admin access is now gated client-side by a password (localStorage flag).
-- Allow public (anon) full CRUD on products and offers, and storage uploads to product-images.

-- PRODUCTS
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Product managers can insert products" ON public.products;
DROP POLICY IF EXISTS "Product managers can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public can delete products" ON public.products FOR DELETE USING (true);

-- Make created_by nullable so inserts without a user work
ALTER TABLE public.products ALTER COLUMN created_by DROP NOT NULL;

-- OFFERS
DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;
DROP POLICY IF EXISTS "Product managers can insert offers" ON public.offers;
DROP POLICY IF EXISTS "Product managers can update offers" ON public.offers;
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;

CREATE POLICY "Public can view offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Public can insert offers" ON public.offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update offers" ON public.offers FOR UPDATE USING (true);
CREATE POLICY "Public can delete offers" ON public.offers FOR DELETE USING (true);

-- STORAGE: product-images bucket — allow public uploads & deletes
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can update product images" ON storage.objects;

CREATE POLICY "Public can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Public can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "Public can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');