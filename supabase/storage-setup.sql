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
