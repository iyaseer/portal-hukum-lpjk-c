# Platform Dasar Hukum Tugas LPJK

Platform web untuk mengelola dan mencari dokumen dasar hukum 7 tugas Lembaga
Pengembangan Jasa Konstruksi (LPJK) berdasarkan **PP No. 14 Tahun 2021 jo. PP
No. 22 Tahun 2020** tentang Peraturan Pelaksanaan UU No. 2 Tahun 2017 tentang
Jasa Konstruksi.

## Fitur

- **Koleksi dokumen** — simpan dokumen hukum berformat PDF atau gambar (JPG/PNG/WEBP), dikelompokkan ke 7 tugas LPJK.
- **Pencarian** — cari berdasarkan judul, nomor dokumen, sumber, dan **teks isi dokumen** (termasuk dokumen gambar, karena teksnya sudah dibaca lewat OCR saat diunggah).
- **Rekomendasi pemenuhan** — setiap hasil pencarian / halaman tugas / halaman dokumen menampilkan kotak "Langkah Rekomendasi Pemenuhan".
- **Panel admin** — login (Supabase Auth), CRUD dokumen, kelola 7 tugas (judul, deskripsi, kata kunci, langkah rekomendasi).
- **Upload + klasifikasi otomatis** — saat admin mengunggah file, sistem otomatis membaca teksnya (ekstraksi PDF / OCR gambar) lalu menyarankan tugas yang paling relevan berdasarkan kecocokan kata kunci.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) — gratis |
| Penyimpanan file | Supabase Storage — gratis |
| OCR gambar | Tesseract.js (berjalan di server, tanpa API berbayar) |
| Ekstraksi teks PDF | pdf-parse |
| Hosting | Vercel (Hobby plan — gratis) |

Semua komponen di atas punya tingkatan gratis yang cukup untuk penggunaan
sederhana (skala instansi kecil/menengah).

---

## 1. Prasyarat

- Akun [GitHub](https://github.com)
- Akun [Supabase](https://supabase.com) (gratis)
- Akun [Vercel](https://vercel.com) (gratis, bisa daftar pakai akun GitHub)
- Node.js 18+ terpasang di komputer (untuk uji coba lokal — opsional bila Anda langsung deploy ke Vercel)

---

## 2. Setup Database & Storage di Supabase

1. Buka [supabase.com](https://supabase.com) → **New project**. Catat **Database Password** yang Anda buat.
2. Setelah project aktif, buka menu **SQL Editor** → **New query**.
3. Copy-paste seluruh isi file `supabase/schema.sql` dari proyek ini, lalu **Run**.
   - Ini akan membuat tabel `tugas` dan `dokumen`, mengaktifkan Row Level Security, dan mengisi **7 tugas LPJK** secara otomatis (silakan disesuaikan redaksinya nanti lewat panel admin bila diperlukan).
4. Buat query baru lagi, copy-paste isi file `supabase/storage-setup.sql`, lalu **Run**.
   - Ini membuat bucket Storage bernama `dokumen` (public) tempat file PDF/gambar disimpan.
   - Alternatif: buat manual lewat menu **Storage → New bucket**, nama `dokumen`, centang **Public bucket**.
5. Buka menu **Project Settings → API**. Catat 3 nilai berikut (akan dipakai di langkah 4):
   - `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (klik "Reveal") → jadi `SUPABASE_SERVICE_ROLE_KEY` — **JANGAN pernah expose key ini ke browser/publik**, hanya dipakai di server.

### Buat akun admin

1. Buka menu **Authentication → Users → Add user**.
2. Isi email & password admin Anda, lalu centang **Auto Confirm User** (agar tidak perlu verifikasi email).
3. Simpan. Akun ini yang dipakai untuk login ke `/admin`.

> Ingin menambah admin lain nanti? Ulangi langkah yang sama di menu Authentication.

---

## 3. Unggah kode ke GitHub

Jika Anda menerima proyek ini sebagai folder/zip, jalankan di terminal:

```bash
cd lpjk-platform
git init
git add .
git commit -m "Inisialisasi platform dasar hukum LPJK"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Ganti `USERNAME/NAMA-REPO` dengan repository GitHub yang sudah Anda buat
(buat repo kosong baru di github.com/new, tanpa README/gitignore agar tidak bentrok).

---

## 4. Deploy ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new), pilih **Import Git Repository**, lalu pilih repo GitHub yang baru Anda push.
2. Vercel otomatis mendeteksi ini sebagai proyek Next.js — biarkan pengaturan build default.
3. Sebelum klik **Deploy**, buka bagian **Environment Variables** dan tambahkan 3 variabel dari Langkah 2:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (Project URL dari Supabase) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon public key) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (service_role key) |

4. Klik **Deploy**. Tunggu 1–2 menit hingga selesai.
5. Situs Anda akan aktif di `https://nama-project-anda.vercel.app`.
6. Coba login admin di `https://nama-project-anda.vercel.app/admin/login` memakai akun yang dibuat di Langkah 2.

Setiap kali Anda `git push` ke branch `main`, Vercel otomatis build & deploy ulang.

---

## 5. Menjalankan di komputer lokal (opsional, untuk pengembangan)

```bash
npm install
cp .env.local.example .env.local
# lalu isi .env.local dengan 3 nilai dari Supabase (Langkah 2)

npm run dev
```

Buka `http://localhost:3000`. Panel admin ada di `http://localhost:3000/admin`.

---

## 6. Cara pakai

### Sebagai pengunjung publik
- Buka beranda → cari lewat kotak pencarian, atau telusuri lewat salah satu dari **7 kartu tugas LPJK**.
- Setiap hasil pencarian/dokumen otomatis menampilkan **kotak rekomendasi langkah pemenuhan** di sisi kanan.

### Sebagai admin
1. Login di `/admin`.
2. **Unggah Dokumen** → pilih file PDF/gambar → klik **Ekstrak Teks & Klasifikasikan**.
   - Sistem membaca teks dokumen (OCR untuk gambar, ekstraksi langsung untuk PDF) dan menampilkan **saran klasifikasi tugas** beserta skor kecocokan kata kunci.
3. Lengkapi metadata (judul, nomor, jenis peraturan, tanggal, sumber), pilih/ubah tugas terkait, sunting langkah rekomendasi bila perlu, lalu **Simpan Dokumen**.
4. Di menu **Dokumen**, Anda bisa mengubah status (Terbit/Draft), mengedit, atau menghapus dokumen.
5. Di menu **Kelola 7 Tugas**, Anda bisa menyunting judul/deskripsi/kata kunci/langkah rekomendasi masing-masing tugas — ini juga memengaruhi hasil klasifikasi otomatis ke depannya.

---

## 7. Struktur folder singkat

```
app/                    → halaman & API (Next.js App Router)
  ├─ page.tsx            → beranda publik
  ├─ cari/               → halaman pencarian
  ├─ tugas/[slug]/        → daftar dokumen per tugas
  ├─ dokumen/[id]/        → detail dokumen
  ├─ admin/               → panel admin (login, dashboard, CRUD)
  └─ api/                 → route handler (documents, tugas, upload, search, auth)
components/             → komponen UI reusable
lib/
  ├─ supabase/            → client Supabase (browser/server/admin)
  ├─ ocr.ts               → OCR gambar (Tesseract.js) & ekstraksi teks PDF
  ├─ classify.ts          → logika klasifikasi otomatis berbasis kata kunci
  └─ types.ts             → tipe data TypeScript
supabase/
  ├─ schema.sql            → skema tabel + seed 7 tugas LPJK
  └─ storage-setup.sql     → setup bucket Storage
middleware.ts           → proteksi rute /admin & sesi Supabase Auth
```

## 8. Catatan & batasan

- **Redaksi 7 tugas**: teks judul/deskripsi/dasar hukum 7 tugas pada `schema.sql` disusun berdasarkan ringkasan tugas LPJK yang berlaku umum. **Silakan periksa dan sesuaikan redaksinya** dengan salinan resmi PP No. 14/2021 melalui panel **Kelola 7 Tugas** agar sesuai kebutuhan instansi Anda.
- **Akurasi OCR**: hasil OCR bergantung pada kualitas/resolusi gambar yang diunggah — gunakan scan yang jelas untuk hasil pembacaan terbaik.
- **Klasifikasi otomatis** bersifat rule-based (pencocokan kata kunci), bukan AI generatif — cepat, gratis, dan hasilnya bisa dikoreksi manual oleh admin sebelum disimpan.
- **Batas ukuran file**: 15 MB per dokumen (bisa diubah di `app/api/upload/route.ts`, variabel `MAKS_UKURAN`), menyesuaikan batas durasi fungsi serverless Vercel Hobby plan.
- **Kuota gratis**: Supabase Free tier memberi 500MB database + 1GB storage; Vercel Hobby cukup untuk trafik ringan-menengah. Untuk penggunaan lebih besar, pertimbangkan upgrade plan berbayar masing-masing layanan.
