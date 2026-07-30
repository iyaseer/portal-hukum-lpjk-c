import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ data: [], rekomendasi: null });
  }

  const supabase = createClient();

  // Pencarian sederhana namun akurat: cocokkan ke judul, nomor dokumen,
  // jenis peraturan, dan teks hasil ekstraksi/OCR (mendukung dokumen gambar).
  const { data: dokumenList, error } = await supabase
    .from('dokumen')
    .select('*, tugas:tugas_id(*)')
    .eq('status_publikasi', 'terbit')
    .or(
      `judul.ilike.%${q}%,nomor_dokumen.ilike.%${q}%,jenis_peraturan.ilike.%${q}%,konten_teks.ilike.%${q}%,sumber.ilike.%${q}%`
    )
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const kataKunci = q.toLowerCase();
  const hasil = (dokumenList || [])
    .map((d) => {
      const judulSkor = countOccurrences(d.judul.toLowerCase(), kataKunci) * 5;
      const kontenSkor = countOccurrences((d.konten_teks || '').toLowerCase(), kataKunci) * 1;
      const nomorSkor = countOccurrences((d.nomor_dokumen || '').toLowerCase(), kataKunci) * 3;
      const skor = judulSkor + kontenSkor + nomorSkor;
      return { ...d, _skor: skor, _cuplikan: buatCuplikan(d.konten_teks || d.judul, q) };
    })
    .sort((a, b) => b._skor - a._skor);

  // Cari tugas yang paling relevan dengan kata kunci (untuk kotak rekomendasi umum di atas hasil)
  const { data: daftarTugas } = await supabase.from('tugas').select('*');
  let tugasTerbaik: any = null;
  let skorTugasTerbaik = 0;

  for (const t of daftarTugas || []) {
    let skor = 0;
    for (const kk of t.kata_kunci || []) {
      if (kataKunci.includes(kk.toLowerCase()) || kk.toLowerCase().includes(kataKunci)) {
        skor += 2;
      }
    }
    if (t.judul.toLowerCase().includes(kataKunci)) skor += 3;
    if (skor > skorTugasTerbaik) {
      skorTugasTerbaik = skor;
      tugasTerbaik = t;
    }
  }

  // Jika tidak ada match langsung ke tugas, gunakan tugas dari hasil dokumen teratas
  if (!tugasTerbaik && hasil.length > 0 && hasil[0].tugas) {
    tugasTerbaik = hasil[0].tugas;
  }

  return NextResponse.json({
    data: hasil,
    rekomendasi: tugasTerbaik
      ? { judul: tugasTerbaik.judul, langkah: tugasTerbaik.langkah_rekomendasi }
      : null,
  });
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

function buatCuplikan(teks: string, q: string, panjang = 220): string {
  if (!teks) return '';
  const lower = teks.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  let awal = 0;
  if (idx > -1) {
    awal = Math.max(0, idx - Math.floor(panjang / 3));
  }
  let potongan = teks.slice(awal, awal + panjang);
  if (awal > 0) potongan = '…' + potongan;
  if (awal + panjang < teks.length) potongan += '…';

  // highlight kata kunci
  try {
    const regex = new RegExp(`(${escapeRegExp(q)})`, 'ig');
    potongan = potongan.replace(regex, '<mark>$1</mark>');
  } catch {
    // abaikan bila q mengandung karakter regex tak valid
  }
  return potongan;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
