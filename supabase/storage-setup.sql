-- ============================================================
-- SETUP STORAGE BUCKET untuk file dokumen (PDF/gambar)
-- ============================================================
-- Cara termudah: buat lewat UI Supabase Dashboard
--   Storage > New bucket > nama: "dokumen" > centang "Public bucket" > Save
--
-- Atau jalankan SQL berikut di SQL Editor (jika Anda lebih suka lewat SQL):

insert into storage.buckets (id, name, public)
values ('dokumen', 'dokumen', true)
on conflict (id) do nothing;

-- Policy: publik boleh membaca file (karena bucket public = true, ini opsional
-- tapi ditambahkan agar eksplisit)
drop policy if exists "Publik baca file dokumen" on storage.objects;
create policy "Publik baca file dokumen" on storage.objects
  for select using (bucket_id = 'dokumen');

-- Catatan: proses UPLOAD (insert) file dilakukan oleh server memakai
-- SUPABASE_SERVICE_ROLE_KEY (lihat lib/supabase/admin.ts), yang otomatis
-- melewati RLS Storage. Jadi tidak perlu policy insert untuk publik/anon.

-- ------------------------------------------------------------
-- PENTING (update): admin yang sudah login (Supabase Auth) juga perlu izin
-- untuk mengunggah & menghapus file LANGSUNG DARI BROWSER. Ini dibutuhkan
-- agar upload file besar tidak melewati batas ukuran request 4.5MB milik
-- Vercel Serverless Function — file dikirim langsung dari browser ke
-- Supabase Storage, bukan lewat API route Next.js.
-- Catatan: karena aplikasi ini tidak memiliki pendaftaran akun publik (admin
-- hanya dibuat manual lewat Supabase Dashboard), "authenticated" di sini
-- secara de facto berarti admin.
-- ------------------------------------------------------------
drop policy if exists "Admin unggah file dokumen" on storage.objects;
create policy "Admin unggah file dokumen" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dokumen');

drop policy if exists "Admin hapus file dokumen" on storage.objects;
create policy "Admin hapus file dokumen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dokumen');
