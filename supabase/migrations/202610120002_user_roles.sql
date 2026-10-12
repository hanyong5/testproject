create table public.user_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'member' check (role in ('member','admin'))
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;
create policy user_roles_read_own on public.user_roles for select to authenticated using (user_id=(select auth.uid()));
create function public.admin_overview() returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
 if not exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin') then
   raise exception 'Administrator access required' using errcode='42501';
 end if;
 return jsonb_build_object(
   'members',(select count(*) from auth.users),
   'profiles',(select count(*) from public.profiles),
   'admins',(select count(*) from public.user_roles where role='admin')
 );
end;
$$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;
