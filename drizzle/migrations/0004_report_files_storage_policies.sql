create policy "Admins upload report files"
on storage.objects for insert to authenticated
with check (bucket_id = 'report-files' and public.has_role(auth.uid(), 'admin'));

create policy "Admins update report files"
on storage.objects for update to authenticated
using (bucket_id = 'report-files' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete report files"
on storage.objects for delete to authenticated
using (bucket_id = 'report-files' and public.has_role(auth.uid(), 'admin'));

create policy "Anyone can read report files"
on storage.objects for select to anon, authenticated
using (bucket_id = 'report-files');
