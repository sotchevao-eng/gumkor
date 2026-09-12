DROP POLICY IF EXISTS "Admins manage reports" ON public.reports;
CREATE POLICY "Staff manage reports" ON public.reports FOR ALL TO authenticated
  USING (public.has_admin_access(auth.uid()))
  WITH CHECK (public.has_admin_access(auth.uid()));
