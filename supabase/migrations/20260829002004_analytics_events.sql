-- جدول أحداث تحسين التجربة داخل التطبيق (استبيان، تفاعلات)
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  path text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;

alter table public.analytics_events enable row level security;

-- أي زائر يقدر يرسل حدث (بدون قراءة)
create policy "anyone can insert analytics events"
on public.analytics_events for insert
to anon, authenticated
with check (true);

-- القراءة للطاقم فقط
create policy "staff can read analytics events"
on public.analytics_events for select
to authenticated
using (public.is_staff(auth.uid()));
