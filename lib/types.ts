export type Tugas = {
  id: string;
  urutan: number;
  slug: string;
  judul: string;
  deskripsi: string;
  dasar_hukum: string;
  kata_kunci: string[];
  langkah_rekomendasi: string[];
  created_at: string;
  updated_at: string;
};

export type Dokumen = {
  id: string;
  tugas_id: string | null;
  judul: string;
  nomor_dokumen: string;
  jenis_peraturan: string;
  tanggal_dokumen: string | null;
  sumber: string;
  jenis_file: 'pdf' | 'image';
  file_path: string;
  file_url: string;
  ukuran_file: number;
  konten_teks: string;
  langkah_rekomendasi: string[];
  status_publikasi: 'terbit' | 'draft';
  dilihat: number;
  created_at: string;
  updated_at: string;
  tugas?: Tugas | null;
};
