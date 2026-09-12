-- roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can read own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create policy "Admins manage roles"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- categories
create table public.need_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.need_categories to anon;
grant select, insert, update, delete on public.need_categories to authenticated;
grant all on public.need_categories to service_role;

alter table public.need_categories enable row level security;

create policy "Categories are public"
on public.need_categories for select to anon, authenticated using (true);

create policy "Admins manage categories"
on public.need_categories for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- needs
create type public.need_status as enum ('active', 'partial', 'closed');
create type public.need_priority as enum ('normal', 'important', 'urgent');
create type public.need_goal_type as enum ('quantity', 'money', 'descriptive');

create table public.needs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references public.need_categories(id) on delete set null,
  description text not null default '',
  published_at date not null default current_date,
  priority public.need_priority not null default 'normal',
  status public.need_status not null default 'active',
  goal_type public.need_goal_type not null default 'descriptive',
  required_amount numeric,
  collected_amount numeric not null default 0,
  unit text,
  photo_url text,
  report_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index needs_status_idx on public.needs (status, published_at desc);

grant select on public.needs to anon;
grant select, insert, update, delete on public.needs to authenticated;
grant all on public.needs to service_role;

alter table public.needs enable row level security;

create policy "Needs are public"
on public.needs for select to anon, authenticated using (true);

create policy "Admins manage needs"
on public.needs for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger needs_touch_updated_at
before update on public.needs
for each row execute function public.touch_updated_at();

-- categories seed
insert into public.need_categories (name, sort_order) values
  ('Материалы', 10),
  ('Средства гигиены', 20),
  ('Одежда', 30),
  ('Инструменты', 40),
  ('Транспорт', 50),
  ('Услуги', 60),
  ('Прочее', 70);

-- demo needs (помечены как demo, удаляются одной кнопкой в админке)
insert into public.needs (title, category_id, description, priority, status, goal_type, required_amount, collected_amount, unit, is_demo, published_at)
values
  ('DEMO: Тепловые носки', (select id from public.need_categories where name = 'Одежда'), 'Пример потребности для демонстрации раздела.', 'urgent', 'active', 'quantity', 60, 12, 'пар', true, current_date),
  ('DEMO: Сбор на ремонт транспорта', (select id from public.need_categories where name = 'Транспорт'), 'Пример денежной потребности для демонстрации раздела.', 'important', 'partial', 'money', 50000, 32000, '₽', true, current_date - 5),
  ('DEMO: Инструменты для мастерской', (select id from public.need_categories where name = 'Инструменты'), 'Пример закрытой потребности для демонстрации раздела.', 'normal', 'closed', 'quantity', 20, 20, 'шт.', true, current_date - 20);
