-- Run once in the Supabase SQL Editor (existing projects).
-- Staff/admin already have delete via communications_admin_all.

drop policy if exists communications_portal_delete on public.communications;
create policy communications_portal_delete
  on public.communications
  for delete
  to authenticated
  using (portal_user_id = (select auth.uid()));
