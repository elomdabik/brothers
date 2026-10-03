ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_phone_format;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_phone_format
CHECK (phone IS NULL OR phone ~ '^01[0125][0-9]{8}$');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (
    NEW.id,
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'phone'), '')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$;