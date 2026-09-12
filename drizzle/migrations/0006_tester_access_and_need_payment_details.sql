ALTER TABLE public.needs
  ADD COLUMN IF NOT EXISTS pay_phone text,
  ADD COLUMN IF NOT EXISTS pay_bank text,
  ADD COLUMN IF NOT EXISTS pay_recipient text,
  ADD COLUMN IF NOT EXISTS pay_purpose text;

CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::public.app_role, 'tester'::public.app_role)
  )
$$;

CREATE OR REPLACE FUNCTION public.my_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN 'admin'
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'tester'::public.app_role
    ) THEN 'tester'
    ELSE 'none'
  END
$$;

DROP POLICY IF EXISTS "Admins manage needs" ON public.needs;
CREATE POLICY "Staff manage needs" ON public.needs FOR ALL TO authenticated
  USING (public.has_admin_access(auth.uid()))
  WITH CHECK (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins manage categories" ON public.need_categories;
CREATE POLICY "Staff manage categories" ON public.need_categories FOR ALL TO authenticated
  USING (public.has_admin_access(auth.uid()))
  WITH CHECK (public.has_admin_access(auth.uid()));
