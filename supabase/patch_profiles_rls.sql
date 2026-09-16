-- Run this once in the Supabase SQL Editor.
-- Fixes: infinite recursion detected in policy for relation "profiles"
-- when staff change a user's role (Usuarios → Rol).
--
-- Cause: is_admin() SELECTs public.profiles, and profiles policies call
-- is_admin(), so an UPDATE on profiles loops forever.
-- Fix: is_admin() / current_profile_role() run as SECURITY DEFINER
-- (bypass RLS). Own-update policy no longer subselects profiles.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.current_profile_role() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_profile_role() to authenticated;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = public.current_profile_role());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
