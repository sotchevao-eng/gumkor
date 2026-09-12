create policy "Admins upload need photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'need-photos' and public.has_role(auth.uid(), 'admin'));

create policy "Admins update need photos"
on storage.objects for update to authenticated
using (bucket_id = 'need-photos' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete need photos"
on storage.objects for delete to authenticated
using (bucket_id = 'need-photos' and public.has_role(auth.uid(), 'admin'));

create policy "Anyone can read need photos"
on storage.objects for select to anon, authenticated
using (bucket_id = 'need-photos');
