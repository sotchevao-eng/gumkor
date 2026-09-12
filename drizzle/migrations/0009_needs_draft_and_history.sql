-- 1. Черновик как новый статус потребности
ALTER TYPE public.need_status ADD VALUE IF NOT EXISTS 'draft';

-- 2. История изменений потребностей
CREATE TABLE public.need_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
  changed_by uuid,
  changed_by_email text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.need_history TO authenticated;
GRANT ALL ON public.need_history TO service_role;

ALTER TABLE public.need_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read need history"
  ON public.need_history FOR SELECT TO authenticated
  USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Staff write need history"
  ON public.need_history FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_access(auth.uid()));

CREATE INDEX need_history_need_id_created_at_idx
  ON public.need_history (need_id, created_at DESC);

-- 3. Черновики не видны на публичном сайте
DROP POLICY IF EXISTS "Needs are public" ON public.needs;
CREATE POLICY "Needs are public"
  ON public.needs FOR SELECT TO anon, authenticated
  USING (status::text <> 'draft');