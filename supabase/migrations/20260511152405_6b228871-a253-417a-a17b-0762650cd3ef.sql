ALTER TABLE public.products ADD COLUMN IF NOT EXISTS internal_code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS international_code TEXT;