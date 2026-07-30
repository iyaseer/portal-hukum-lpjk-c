import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import DocumentCard from '@/components/DocumentCard';
import RecommendationBox from '@/components/RecommendationBox';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function CariPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || '').trim();
  const supabase = createClient();

  let hasil: any[] = [];
  let rekomendasi: { judul: string; langkah: string[] } | null = null;

  if (q) {
    const { data: dokumenList } = await supabase
      .from('dokumen')
      .select('*, tugas:tugas_id(*)')
      .eq('status_publikasi', 'terbit')
      .or(
        `judul.ilike.%${q}%,nomor_dokumen.ilike.%${q}%,jenis_peraturan.ilike.%${q}%,konten_teks.ilike.%${q}%,sumber.ilike.%${q}%`
      )
      .limit(50);

    const kataKunci = q.toLowerCase();
    hasil = (dokumenList || [])
      .map((d) => {
        const skor =
          hitung(d.judul.toLowerCase(), kataKunci) * 5 +
          hitung((d.konten_teks || '').toLowerCase(), kataKunci) * 1 +
          hitung((d.nomor_dokumen || '').toLowerCase(), kataKunci) * 3;
        return { ...d, _skor: skor, _cuplikan: cuplikan(d.konten_teks || d.judul, q) };
      })
      .sort((a, b) => b._skor - a._skor);

    const { data: daftarTugas } = await supabase.from('tugas').select('*');
    let terbaik: any = null;
    let skorTerbaik = 0;
    for (const t of daftarTugas || []) {
      let skor = 0;
      for (const kk of t.kata_kunci || []) {
        if (kataKunci.includes(kk.toLowerCase()) || kk.toLowerCase().includes(kataKunci)) skor += 2;
      }
      if (t.judul.toLowerCase().includes(kataKunci)) skor += 3;
      if (skor > skorTerbaik) {
        skorTerbaik = skor;
        terbaik = t;
      }
    }
    if (!terbaik && hasil.length > 0 && hasil[0].tugas) terbaik = hasil[0].tugas;
    if (terbaik) rekomendasi = { judul: terbaik.judul, langkah: terbaik.langkah_rekomendasi };
  }

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <h1 className="text-xl font-semibold text-slate-900">Pencarian Dokumen Hukum</h1>
        <div className="mt-4">
          <SearchBar defaultValue={q} />
        </div>

        {!q && (
          <p className="mt-6 text-sm text-slate-500">
            Masukkan kata kunci, misalnya <em>&ldquo;registrasi SBU&rdquo;</em>, <em>&ldquo;akreditasi asosiasi&rdquo;</em>, atau{' '}
            <em>&ldquo;penilai ahli&rdquo;</em>.
          </p>
        )}

        {q && (
          <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div>
              <p className="mb-4 text-sm text-slate-500">
                {hasil.length} dokumen ditemukan untuk &ldquo;<strong>{q}</strong>&rdquo;
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {hasil.map((d) => (
                  <DocumentCard key={d.id} dokumen={d} cuplikan={d._cuplikan} />
                ))}
              </div>
              {hasil.length === 0 && (
                <div className="card p-6 text-sm text-slate-500">
                  Tidak ada dokumen yang cocok. Coba kata kunci lain atau telusuri melalui daftar{' '}
                  <a href="/" className="text-primary-600 underline">
                    7 tugas LPJK
                  </a>
                  .
                </div>
              )}
            </div>
            <aside>
              {rekomendasi && <RecommendationBox judulTugas={rekomendasi.judul} langkah={rekomendasi.langkah} />}
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function hitung(haystack: string, needle: string) {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

function cuplikan(teks: string, q: string, panjang = 220) {
  if (!teks) return '';
  const lower = teks.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  let awal = 0;
  if (idx > -1) awal = Math.max(0, idx - Math.floor(panjang / 3));
  let potongan = teks.slice(awal, awal + panjang);
  if (awal > 0) potongan = '…' + potongan;
  if (awal + panjang < teks.length) potongan += '…';
  try {
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    potongan = potongan.replace(regex, '<mark>$1</mark>');
  } catch {}
  return potongan;
}
