-- Категории: возможность скрыть
ALTER TABLE public.need_categories ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Статусы заявок и отчётов
DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('new','in_progress','contacted','agreed','done','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Заявки «Могу помочь» (персональные данные: доступ только администратору)
CREATE TABLE public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL,
  help_way text NOT NULL DEFAULT '',
  need_id uuid REFERENCES public.needs(id) ON DELETE SET NULL,
  comment text NOT NULL DEFAULT '',
  status public.request_status NOT NULL DEFAULT 'new',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.help_requests TO authenticated;
GRANT ALL ON public.help_requests TO service_role;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage help requests" ON public.help_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER help_requests_touch_updated_at BEFORE UPDATE ON public.help_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Отчёты
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  need_id uuid REFERENCES public.needs(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.need_categories(id) ON DELETE SET NULL,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  photo_paths text[] NOT NULL DEFAULT '{}',
  document_paths text[] NOT NULL DEFAULT '{}',
  status public.report_status NOT NULL DEFAULT 'draft',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT SELECT ON public.reports TO anon;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published reports are public" ON public.reports
  FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "Admins manage reports" ON public.reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER reports_touch_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Настройки сайта (одна запись)
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  coordinator_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  vk_url text NOT NULL DEFAULT '',
  max_contact text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  donation_details text NOT NULL DEFAULT '',
  footer_text text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are public" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_touch_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id, coordinator_name, phone, vk_url, max_contact, email, donation_details, footer_text)
VALUES (true, 'Водолажская Татьяна', '+7 953 733-10-20', 'https://vk.ru/ryazanzavdv', '', '', '', 'Своих не бросаем.');

-- Demo-заявки для интерфейса (без реальных ФИО и телефонов)
INSERT INTO public.help_requests (name, contact, help_way, comment, status, is_demo) VALUES
  ('Demo: Пример А.', 'demo-contact-1', 'Вещами и материалами', 'Demo-заявка для проверки интерфейса.', 'new', true),
  ('Demo: Пример Б.', 'demo-contact-2', 'Транспортом', 'Demo-заявка: готов помочь с доставкой.', 'in_progress', true),
  ('Demo: Пример В.', 'demo-contact-3', 'Услугами', 'Demo-заявка: ремонт инструмента.', 'done', true);
