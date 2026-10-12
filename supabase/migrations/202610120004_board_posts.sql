create table public.board_posts (
 id uuid primary key default gen_random_uuid(),
 category text not null check (category in ('공지','제품소식','이용가이드')),
 title text not null check (char_length(btrim(title)) between 1 and 150),
 content text not null check (char_length(btrim(content)) between 1 and 20000),
 author_id uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now()
);
create index board_posts_created_at_idx on public.board_posts(created_at desc,id);
alter table public.board_posts enable row level security;
revoke all on public.board_posts from anon, authenticated;
grant select on public.board_posts to anon, authenticated;
grant insert(category,title,content) on public.board_posts to authenticated;
create policy board_posts_read on public.board_posts for select to anon,authenticated using (true);
create policy board_posts_admin_insert on public.board_posts for insert to authenticated with check (
 author_id=(select auth.uid()) and exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin')
);
