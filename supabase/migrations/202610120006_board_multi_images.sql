alter table public.board_posts add column image_paths text[] not null default '{}';
update public.board_posts set image_paths=array[image_path] where image_path is not null;
create function public.valid_board_images(paths text[]) returns boolean language sql immutable set search_path='' as $$
 select cardinality(paths)<=3 and (cardinality(paths)=0 or array_ndims(paths)=1) and not exists (
 select 1 from unnest(paths) p where p is null or p !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
 );
$$;
alter table public.board_posts add constraint board_images_max_three check(public.valid_board_images(image_paths));
revoke insert(image_path) on public.board_posts from authenticated;
grant insert(image_paths),update(category,title,content,image_paths) on public.board_posts to authenticated;
create policy board_posts_admin_update on public.board_posts for update to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin'))
with check (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin'));
drop policy board_images_cleanup on storage.objects;
create policy board_images_cleanup on storage.objects for delete to authenticated using (
 bucket_id='board-images' and exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin')
 and not exists(select 1 from public.board_posts where objects.name=any(image_paths))
);
drop policy board_images_admin_read on storage.objects;
create policy board_images_admin_read on storage.objects for select to authenticated using (
 bucket_id='board-images' and exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin')
);
