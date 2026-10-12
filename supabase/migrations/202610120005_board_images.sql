alter table public.board_posts add column image_path text;
alter table public.board_posts add constraint board_image_owned_path check (image_path is null or image_path ~ ('^' || author_id::text || '/[0-9a-f-]+\.(jpg|png|webp)$'));
grant insert(image_path) on public.board_posts to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('board-images','board-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy board_images_admin_insert on storage.objects for insert to authenticated with check (
 bucket_id='board-images' and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin')
);
create policy board_images_admin_read on storage.objects for select to authenticated using (
 bucket_id='board-images' and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin')
);
create policy board_images_cleanup on storage.objects for delete to authenticated using (
 bucket_id='board-images' and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin')
 and not exists(select 1 from public.board_posts where image_path=name)
);
