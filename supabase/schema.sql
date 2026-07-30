-- ============================================================
-- SKEMA DATABASE: Platform Dasar Hukum Tugas LPJK
-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Ekstensi yang dibutuhkan
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- Tabel 7 (atau N) kategori TUGAS LPJK sesuai PP No 14/2021
-- ---------------------------------------------------------
create table if not exists tugas (
  id uuid primary key default uuid_generate_v4(),
  urutan integer not null default 0,
  slug text unique not null,
  judul text not null,
  deskripsi text default '',
  dasar_hukum text default '',
  kata_kunci text[] default '{}',           -- kata kunci untuk klasifikasi otomatis
  langkah_rekomendasi text[] default '{}',  -- langkah pemenuhan default untuk tugas ini
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Tabel dokumen hukum (PDF / gambar)
-- ---------------------------------------------------------
create table if not exists dokumen (
  id uuid primary key default uuid_generate_v4(),
  tugas_id uuid references tugas(id) on delete set null,
  judul text not null,
  nomor_dokumen text default '',
  jenis_peraturan text default '',          -- UU, PP, Permen, SE, dll
  tanggal_dokumen date,
  sumber text default '',                   -- instansi penerbit / sumber
  jenis_file text not null default 'pdf',   -- 'pdf' | 'image'
  file_path text not null,                  -- path di Supabase Storage
  file_url text not null,                   -- public URL
  ukuran_file bigint default 0,
  konten_teks text default '',              -- hasil ekstraksi teks / OCR untuk pencarian
  langkah_rekomendasi text[] default '{}',  -- override langkah rekomendasi khusus dokumen ini
  status_publikasi text not null default 'terbit', -- 'terbit' | 'draft'
  dilihat integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dokumen_tugas on dokumen(tugas_id);
create index if not exists idx_dokumen_judul on dokumen using gin (to_tsvector('simple', judul));
create index if not exists idx_dokumen_konten on dokumen using gin (to_tsvector('simple', coalesce(konten_teks, '')));

-- ---------------------------------------------------------
-- Trigger updated_at otomatis
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tugas_updated on tugas;
create trigger trg_tugas_updated before update on tugas
  for each row execute procedure set_updated_at();

drop trigger if exists trg_dokumen_updated on dokumen;
create trigger trg_dokumen_updated before update on dokumen
  for each row execute procedure set_updated_at();

-- ---------------------------------------------------------
-- Row Level Security
-- Publik hanya boleh MEMBACA dokumen berstatus "terbit".
-- Tulis (insert/update/delete) hanya lewat service role (dipakai server admin).
-- ---------------------------------------------------------
alter table tugas enable row level security;
alter table dokumen enable row level security;

drop policy if exists "Publik baca tugas" on tugas;
create policy "Publik baca tugas" on tugas
  for select using (true);

drop policy if exists "Publik baca dokumen terbit" on dokumen;
create policy "Publik baca dokumen terbit" on dokumen
  for select using (status_publikasi = 'terbit');

-- Catatan: operasi insert/update/delete dari admin dilakukan lewat
-- Supabase Service Role Key di server (API routes), yang otomatis
-- melewati RLS. Jadi tidak perlu policy insert/update/delete untuk publik.

-- ---------------------------------------------------------
-- Seed 7 Tugas LPJK berdasarkan PP No 14/2021 jo. PP No 22/2020
-- (silakan sesuaikan redaksi/urutan melalui panel admin bila diperlukan)
-- ---------------------------------------------------------
insert into tugas (urutan, slug, judul, deskripsi, dasar_hukum, kata_kunci, langkah_rekomendasi)
values
(1, 'registrasi',
 'Registrasi Usaha dan Tenaga Kerja Konstruksi',
 'Pelaksanaan registrasi badan usaha dan tenaga kerja jasa konstruksi, termasuk penerbitan Sertifikat Badan Usaha (SBU) dan Sertifikat Kompetensi Kerja (SKK).',
 'PP No. 14 Tahun 2021 jo. PP No. 22 Tahun 2020 tentang Peraturan Pelaksanaan UU No. 2 Tahun 2017 tentang Jasa Konstruksi',
 array['registrasi','sbu','sertifikat badan usaha','skk','sertifikat kompetensi kerja','nib','oss','kualifikasi','klasifikasi usaha'],
 array[
   'Siapkan Nomor Induk Berusaha (NIB) melalui sistem OSS.',
   'Lengkapi data kualifikasi dan klasifikasi usaha jasa konstruksi.',
   'Ajukan permohonan Sertifikat Badan Usaha (SBU) melalui LSBU terakreditasi LPJK.',
   'Pastikan tenaga kerja bersertifikat kompetensi (SKK) terdaftar dalam struktur badan usaha.',
   'Pantau status verifikasi dan validasi permohonan pada sistem informasi jasa konstruksi terintegrasi.'
 ]
),
(2, 'akreditasi',
 'Akreditasi Asosiasi dan Lembaga',
 'Pelaksanaan akreditasi terhadap asosiasi badan usaha, asosiasi profesi, dan lembaga terkait rantai pasok jasa konstruksi.',
 'PP No. 14 Tahun 2021 jo. PP No. 22 Tahun 2020',
 array['akreditasi','asosiasi badan usaha','asosiasi profesi','rantai pasok','lsp','lsbu'],
 array[
   'Ajukan permohonan akreditasi asosiasi/lembaga kepada LPJK secara daring.',
   'Lengkapi dokumen legalitas organisasi dan bukti keanggotaan.',
   'Ikuti proses verifikasi persyaratan administratif dan teknis oleh LPJK.',
   'Terima Sertifikat Akreditasi setelah dinyatakan memenuhi syarat.',
   'Lakukan perpanjangan akreditasi sebelum masa berlaku berakhir.'
 ]
),
(3, 'penilai-ahli',
 'Penetapan Penilai Ahli',
 'Penetapan, pelatihan, uji kompetensi, dan penugasan Penilai Ahli untuk penanganan kegagalan bangunan.',
 'PP No. 14 Tahun 2021 jo. PP No. 22 Tahun 2020; Permen PUPR No. 8 Tahun 2021',
 array['penilai ahli','kegagalan bangunan','tim penilai','sertifikat penilai ahli','spa'],
 array[
   'Daftarkan diri sebagai calon Penilai Ahli melalui sistem informasi LPJK.',
   'Penuhi persyaratan pengalaman kerja konstruksi minimal sesuai ketentuan.',
   'Ikuti pelatihan dan uji kompetensi Penilai Ahli.',
   'Ajukan penerbitan Sertifikat Penilai Ahli (SPA) kepada LPJK.',
   'Bersedia ditugaskan dalam tim penilai ahli untuk kasus kegagalan bangunan.'
 ]
),
(4, 'kelembagaan-lsp',
 'Pembentukan Lembaga Sertifikasi Profesi (LSP)',
 'Fasilitasi dan pembentukan LSP untuk pelaksanaan sertifikasi kompetensi kerja konstruksi yang belum terlayani asosiasi profesi.',
 'PP No. 14 Tahun 2021 jo. PP No. 22 Tahun 2020; Permen PUPR No. 9 Tahun 2020',
 array['lsp','lembaga sertifikasi profesi','sertifikasi kompetensi kerja','bnsp','tuk','asesor'],
 array[
   'Susun kelengkapan organisasi calon LSP (skema sertifikasi, TUK, asesor).',
   'Ajukan permohonan lisensi ke Badan Nasional Sertifikasi Profesi (BNSP).',
   'Mintakan rekomendasi/pencatatan lisensi LSP kepada LPJK.',
   'Lengkapi daftar Tempat Uji Kompetensi (TUK) dan asesor bersertifikat.',
   'Laksanakan sertifikasi kompetensi kerja sesuai skema yang telah dilisensi.'
 ]
),
(5, 'lisensi',
 'Pemberian Lisensi',
 'Pemberian lisensi kepada Lembaga Sertifikasi Badan Usaha (LSBU) dan lembaga sertifikasi lain di bidang jasa konstruksi.',
 'PP No. 14 Tahun 2021 jo. PP No. 22 Tahun 2020',
 array['lisensi','lsbu','lembaga sertifikasi badan usaha','pemberian lisensi'],
 array[
   'Bentuk LSBU oleh asosiasi badan usaha jasa konstruksi terakreditasi.',
   'Siapkan sistem manajemen mutu dan sumber daya sertifikasi LSBU.',
   'Ajukan permohonan lisensi LSBU kepada LPJK.',
   'Ikuti proses evaluasi kelayakan operasional LSBU oleh LPJK.',
   'Perbarui lisensi secara berkala sesuai masa berlaku yang ditetapkan.'
 ]
),
(6, 'penyetaraan',
 'Penyetaraan Tenaga Kerja Konstruksi Asing',
 'Penyetaraan kualifikasi dan kompetensi tenaga kerja konstruksi asing yang akan bekerja di Indonesia.',
 'PP No. 14 Tahun 2021 jo. PP No. 22 Tahun 2020',
 array['penyetaraan','tenaga kerja asing','tka','sertifikat kompetensi asing','pengakuan kualifikasi'],
 array[
   'Siapkan dokumen kualifikasi dan sertifikat kompetensi dari negara asal.',
   'Ajukan permohonan penyetaraan kompetensi kepada LPJK.',
   'Ikuti proses penilaian kesetaraan (uji tambahan bila diperlukan).',
   'Terima surat keterangan/sertifikat penyetaraan dari LPJK.',
   'Gunakan hasil penyetaraan sebagai syarat penerbitan izin kerja tenaga asing.'
 ]
),
(7, 'sistem-informasi',
 'Pengelolaan Sistem Informasi Jasa Konstruksi',
 'Penyediaan dan pengelolaan sistem informasi jasa konstruksi terintegrasi, termasuk program pengembangan keprofesian berkelanjutan (PKB).',
 'PP No. 14 Tahun 2021 jo. PP No. 22 Tahun 2020',
 array['sistem informasi','pkb','keprofesian berkelanjutan','data jasa konstruksi','portal lpjk'],
 array[
   'Daftarkan akun pada Sistem Informasi Jasa Konstruksi Terintegrasi (SIJKT).',
   'Lengkapi dan mutakhirkan data badan usaha/tenaga kerja secara berkala.',
   'Ikuti program Pengembangan Keprofesian Berkelanjutan (PKB) sesuai kewajiban SKA/SKK.',
   'Unggah bukti kegiatan PKB pada aplikasi yang disediakan LPJK.',
   'Pantau notifikasi dan pengumuman resmi melalui portal LPJK.'
 ]
)
on conflict (slug) do nothing;
