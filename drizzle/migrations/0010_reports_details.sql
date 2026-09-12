ALTER TABLE public.reports
  ADD COLUMN need_title text NOT NULL DEFAULT '',
  ADD COLUMN need_goal_type text NOT NULL DEFAULT 'descriptive',
  ADD COLUMN unit text,
  ADD COLUMN target_amount numeric,
  ADD COLUMN collected_amount numeric,
  ADD COLUMN spent_amount numeric,
  ADD COLUMN delivered_amount numeric,
  ADD COLUMN purchased_items text NOT NULL DEFAULT '',
  ADD COLUMN coordinator_note text NOT NULL DEFAULT '',
  ADD COLUMN document_names text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN public_document_paths text[] NOT NULL DEFAULT '{}'::text[];