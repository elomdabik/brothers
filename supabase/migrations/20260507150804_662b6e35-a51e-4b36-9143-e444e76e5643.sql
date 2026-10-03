-- Add approval column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any profile (for approval)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-approve existing admins
UPDATE public.profiles p
SET approved = true
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.user_id AND ur.role = 'admin'
);