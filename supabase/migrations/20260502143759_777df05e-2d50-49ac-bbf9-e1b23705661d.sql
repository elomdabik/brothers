-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_rep';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- Allow product_manager to also manage offers (insert/update)
CREATE POLICY "Product managers can insert offers"
ON public.offers
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'product_manager'));

CREATE POLICY "Product managers can update offers"
ON public.offers
FOR UPDATE
USING (public.has_role(auth.uid(), 'product_manager'));