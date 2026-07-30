export type TugasRingkas = {
  id: string;
  slug: string;
  judul: string;
  kata_kunci: string[];
};

export type HasilKlasifikasi = {
  tugas_id: string;
  slug: string;
  judul: string;
  skor: number;
  kata_kunci_cocok: string[];
};

/**
 * Klasifikasi berbasis kata kunci (rule-based) — sederhana, cepat, dan
 * tidak butuh biaya API eksternal (sesuai kebutuhan "operasional sederhana").
 *
 * Cara kerja:
 * 1. Gabungkan judul dokumen (bobot 3x) + teks hasil ekstraksi/OCR.
 * 2. Untuk tiap tugas, hitung berapa kali tiap kata kunci tugas tsb muncul.
 * 3. Urutkan tugas berdasarkan skor tertinggi → jadi rekomendasi klasifikasi.
 */
export function klasifikasikanDokumen(
  judul: string,
  kontenTeks: string,
  daftarTugas: TugasRingkas[]
): HasilKlasifikasi[] {
  const teksGabungan = `${(judul + ' ').repeat(3)} ${kontenTeks || ''}`.toLowerCase();

  const hasil: HasilKlasifikasi[] = daftarTugas.map((tugas) => {
    let skor = 0;
    const kataKunciCocok: string[] = [];

    for (const kk of tugas.kata_kunci || []) {
      const kataKunci = kk.toLowerCase().trim();
      if (!kataKunci) continue;
      const jumlahMuncul = countOccurrences(teksGabungan, kataKunci);
      if (jumlahMuncul > 0) {
        skor += jumlahMuncul;
        kataKunciCocok.push(kk);
      }
    }

    return {
      tugas_id: tugas.id,
      slug: tugas.slug,
      judul: tugas.judul,
      skor,
      kata_kunci_cocok: kataKunciCocok,
    };
  });

  return hasil.sort((a, b) => b.skor - a.skor);
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count += 1;
    pos += needle.length;
  }
  return count;
}
