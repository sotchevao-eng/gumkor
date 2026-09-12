CREATE POLICY "Testers read demo requests"
ON public.help_requests
FOR SELECT
TO authenticated
USING (is_demo AND public.has_role(auth.uid(), 'tester'::app_role));