-- Legal Lex schema. Run ONCE in the Supabase SQL Editor.
-- Creates EMPTY tables. Does not import Base44 data.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  preferred_name text,
  date_of_birth date,
  country_of_birth text,
  nationalities text,
  passport_number text,
  passport_expiry date,
  nie_number text,
  tie_number text,
  permit_type text,
  permit_expiry date,
  phone text,
  email text,
  address text,
  preferred_channel text check (preferred_channel is null or preferred_channel in ('phone', 'email', 'whatsapp', 'portal')),
  interface_language text,
  written_language text,
  spoken_language text,
  interpreter_required boolean not null default false,
  interpreter_language text,
  reads_spanish boolean,
  reads_english boolean,
  language_notes text,
  portal_user_id uuid references public.profiles (id) on delete set null,
  portal_email text,
  portal_access_enabled boolean not null default true,
  engagement_status text check (engagement_status is null or engagement_status in ('prospect', 'consulted', 'engaged', 'inactive', 'archived')),
  assigned_lawyer text,
  assigned_caseworker text,
  service_package text,
  referral_source text,
  legacy_dropbox_path text,
  legacy_reference text,
  legacy_notes text,
  dropbox_export_date date,
  retention_review_date date,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_portal_user_id_idx on public.clients (portal_user_id);
drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at before update on public.clients for each row execute function public.set_updated_at();

create table if not exists public.matters (
  id uuid primary key default gen_random_uuid(),
  matter_number text,
  client_id uuid not null references public.clients (id) on delete restrict,
  client_name text,
  portal_user_id uuid references public.profiles (id) on delete set null,
  procedure_family text,
  procedure_type text not null,
  authority text,
  province text,
  stage text not null default 'open_documents_requested',
  status_reason text,
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high', 'urgent')),
  assigned_lawyer text,
  assigned_caseworker text,
  next_action text,
  next_action_owner text,
  next_deadline date,
  target_submission_date date,
  submission_date date,
  government_ref text,
  outcome text,
  renewal_due_date date,
  legacy_dropbox_path text,
  opened_date date,
  closed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists matters_client_id_idx on public.matters (client_id);
drop trigger if exists matters_set_updated_at on public.matters;
create trigger matters_set_updated_at before update on public.matters for each row execute function public.set_updated_at();

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters (id) on delete cascade,
  matter_number text,
  client_id uuid references public.clients (id) on delete set null,
  client_name text,
  portal_user_id uuid references public.profiles (id) on delete set null,
  category text,
  title text not null,
  title_client text,
  why_required text,
  client_note text,
  who_provides text not null default 'client',
  original_required boolean not null default false,
  translation_required boolean not null default false,
  apostille_required boolean not null default false,
  deadline date,
  status text not null default 'needed',
  staff_notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists checklist_items_set_updated_at on public.checklist_items;
create trigger checklist_items_set_updated_at before update on public.checklist_items for each row execute function public.set_updated_at();

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients (id) on delete restrict,
  client_name text,
  matter_id uuid references public.matters (id) on delete set null,
  matter_number text,
  portal_user_id uuid references public.profiles (id) on delete set null,
  checklist_item_id uuid references public.checklist_items (id) on delete set null,
  category text,
  source text not null default 'client',
  original_language text,
  file_url text,
  file_name text,
  issue_date date,
  expiry_date date,
  translation_status text not null default 'not_required',
  review_status text not null default 'uploaded',
  reviewer text,
  review_notes text,
  version integer not null default 1,
  visibility text not null default 'client',
  legacy_source_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at before update on public.documents for each row execute function public.set_updated_at();

create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  client_name text,
  matter_id uuid references public.matters (id) on delete set null,
  matter_number text,
  portal_user_id uuid references public.profiles (id) on delete set null,
  direction text not null default 'inbound',
  channel text not null default 'portal',
  sender text,
  recipient text,
  subject text,
  original_language text,
  original_content text not null,
  audio_url text,
  transcription_status text not null default 'not_applicable',
  staff_translation text,
  translation_method text,
  translation_confidence text,
  reply_original text,
  reply_translation text,
  sensitivity text not null default 'routine',
  status text not null default 'received',
  owner text,
  approved_by text,
  action_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists communications_set_updated_at on public.communications;
create trigger communications_set_updated_at before update on public.communications for each row execute function public.set_updated_at();

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  client_name text,
  matter_id uuid references public.matters (id) on delete set null,
  type text not null,
  date_time timestamptz not null,
  location text,
  video_link text,
  assigned_staff text,
  required_documents text,
  interpreter_required boolean not null default false,
  status text not null default 'scheduled',
  result text,
  client_language text,
  portal_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  matter_id uuid references public.matters (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  matter_number text,
  owner text,
  due_date date,
  priority text not null default 'medium',
  task_type text not null default 'general',
  status text not null default 'todo',
  instructions text,
  completion_note text,
  requires_lawyer_approval boolean not null default false,
  source text not null default 'manual',
  source_ref text,
  payload text,
  title_translations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  client_id uuid not null references public.clients (id) on delete restrict,
  client_name text,
  matter_id uuid references public.matters (id) on delete set null,
  portal_user_id uuid references public.profiles (id) on delete set null,
  service_description text,
  amount numeric,
  government_fees numeric,
  expenses numeric,
  total numeric,
  status text not null default 'draft',
  issue_date date,
  due_date date,
  paid_date date,
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  preferred_name text,
  phone text,
  email text,
  preferred_language text,
  nationality text,
  country_of_residence text,
  enquiry_category text,
  message text,
  urgency text not null default 'normal',
  preferred_channel text,
  referral_source text,
  appointment_preference text,
  consent_status text not null default 'pending',
  status text not null default 'new',
  assigned_to text,
  follow_up_date date,
  converted_client_id uuid references public.clients (id) on delete set null,
  source text default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor text,
  actor_name text,
  summary text,
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists audit_logs_set_updated_at on public.audit_logs;
create trigger audit_logs_set_updated_at before update on public.audit_logs for each row execute function public.set_updated_at();

create table if not exists public.ui_dict_cache (
  id uuid primary key default gen_random_uuid(),
  language text not null unique,
  dict jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists ui_dict_cache_set_updated_at on public.ui_dict_cache;
create trigger ui_dict_cache_set_updated_at before update on public.ui_dict_cache for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.matters enable row level security;
alter table public.checklist_items enable row level security;
alter table public.documents enable row level security;
alter table public.communications enable row level security;
alter table public.appointments enable row level security;
alter table public.tasks enable row level security;
alter table public.leads enable row level security;
alter table public.invoices enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ui_dict_cache enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())));
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists clients_admin_all on public.clients;
create policy clients_admin_all on public.clients for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists clients_portal_select on public.clients;
create policy clients_portal_select on public.clients for select to authenticated using (portal_user_id = (select auth.uid()));
drop policy if exists clients_portal_update on public.clients;
create policy clients_portal_update on public.clients for update to authenticated using (portal_user_id = (select auth.uid()) and coalesce(portal_access_enabled, true)) with check (portal_user_id = (select auth.uid()));

drop policy if exists matters_admin_all on public.matters;
create policy matters_admin_all on public.matters for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists matters_portal_select on public.matters;
create policy matters_portal_select on public.matters for select to authenticated using (portal_user_id = (select auth.uid()));

drop policy if exists checklist_items_admin_all on public.checklist_items;
create policy checklist_items_admin_all on public.checklist_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists checklist_items_portal_select on public.checklist_items;
create policy checklist_items_portal_select on public.checklist_items for select to authenticated using (portal_user_id = (select auth.uid()));
drop policy if exists checklist_items_portal_update on public.checklist_items;
create policy checklist_items_portal_update on public.checklist_items for update to authenticated using (portal_user_id = (select auth.uid())) with check (portal_user_id = (select auth.uid()));

drop policy if exists documents_admin_all on public.documents;
create policy documents_admin_all on public.documents for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists documents_portal_select on public.documents;
create policy documents_portal_select on public.documents for select to authenticated using (portal_user_id = (select auth.uid()) and visibility = 'client');
drop policy if exists documents_portal_insert on public.documents;
create policy documents_portal_insert on public.documents for insert to authenticated with check (portal_user_id = (select auth.uid()));

drop policy if exists communications_admin_all on public.communications;
create policy communications_admin_all on public.communications for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists communications_portal_select on public.communications;
create policy communications_portal_select on public.communications for select to authenticated using (portal_user_id = (select auth.uid()));
drop policy if exists communications_portal_insert on public.communications;
create policy communications_portal_insert on public.communications for insert to authenticated with check (portal_user_id = (select auth.uid()));

drop policy if exists appointments_admin_all on public.appointments;
create policy appointments_admin_all on public.appointments for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists appointments_portal_select on public.appointments;
create policy appointments_portal_select on public.appointments for select to authenticated using (portal_user_id = (select auth.uid()));

drop policy if exists tasks_admin_all on public.tasks;
create policy tasks_admin_all on public.tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists invoices_admin_all on public.invoices;
create policy invoices_admin_all on public.invoices for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists invoices_portal_select on public.invoices;
create policy invoices_portal_select on public.invoices for select to authenticated using (portal_user_id = (select auth.uid()));

drop policy if exists leads_anon_insert on public.leads;
create policy leads_anon_insert on public.leads for insert to anon with check (true);
drop policy if exists leads_authenticated_insert on public.leads;
create policy leads_authenticated_insert on public.leads for insert to authenticated with check (true);
drop policy if exists leads_admin_all on public.leads;
create policy leads_admin_all on public.leads for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists audit_logs_admin_all on public.audit_logs;
create policy audit_logs_admin_all on public.audit_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists ui_dict_cache_select on public.ui_dict_cache;
create policy ui_dict_cache_select on public.ui_dict_cache for select to authenticated using (true);
drop policy if exists ui_dict_cache_admin_write on public.ui_dict_cache;
create policy ui_dict_cache_admin_write on public.ui_dict_cache for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert on table public.leads to anon;
grant select, update on table public.profiles to authenticated;
grant all on table public.clients to authenticated;
grant all on table public.matters to authenticated;
grant all on table public.checklist_items to authenticated;
grant all on table public.documents to authenticated;
grant all on table public.communications to authenticated;
grant all on table public.appointments to authenticated;
grant all on table public.tasks to authenticated;
grant all on table public.invoices to authenticated;
grant all on table public.leads to authenticated;
grant all on table public.audit_logs to authenticated;
grant all on table public.ui_dict_cache to authenticated;
