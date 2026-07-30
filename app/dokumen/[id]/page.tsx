import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RecommendationBox from '@/components/RecommendationBox';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 0;

function formatTanggal(tgl: string | null) {
  if (!tgl) return '-';
  try {
    return new Date(tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return tgl;
  }
}

export default async function DokumenDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: dokumen } = await supabase
    .from('dokumen')
    .select('*, tugas:tugas_id(*)')
    .eq('id', params.id)
    .eq('status_publikasi', 'terbit')
    .single();

  if (!dokumen) return notFound();

  // Tambah penghitung dilihat (best-effort, tidak menghambat render)
  try {
    const admin = createAdminClient();
    await admin.from('dokumen').update({ dilihat: (dokumen.dilihat || 0) + 1 }).eq('id', dokumen.id);
  } catch {}

  const langkah =
    dokumen.langkah_rekomendasi && dokumen.langkah_rekomendasi.length > 0
      ? dokumen.langkah_rekomendasi
      : dokumen.tugas?.langkah_rekomendasi || [];

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <nav className="mb-4 text-xs text-slate-500">
          <Link href="/" className="hover:text-primary-600">Beranda</Link>
          {dokumen.tugas && (
            <>
              {' / '}
              <Link href={`/tugas/${dokumen.tugas.slug}`} className="hover:text-primary-600">
                {dokumen.tugas.judul}
              </Link>
            </>
          )}
          {' / '}
          <span className="text-slate-700">{dokumen.judul}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            {dokumen.tugas && <span className="badge">{dokumen.tugas.judul}</span>}
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{dokumen.judul}</h1>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-400">Jenis Peraturan</dt>
                <dd className="text-slate-700">{dokumen.jenis_peraturan || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Nomor</dt>
                <dd className="text-slate-700">{dokumen.nomor_dokumen || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Tanggal</dt>
                <dd className="text-slate-700">{formatTanggal(dokumen.tanggal_dokumen)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Sumber</dt>
                <dd className="text-slate-700">{dokumen.sumber || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Format File</dt>
                <dd className="text-slate-700">{dokumen.jenis_file === 'pdf' ? 'PDF' : 'Gambar (hasil OCR)'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Dilihat</dt>
                <dd className="text-slate-700">{dokumen.dilihat} kali</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={dokumen.file_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Lihat Dokumen Asli
              </a>
              <a href={dokumen.file_url} download className="btn-secondary">
                Unduh File
              </a>
            </div>

            {dokumen.jenis_file === 'image' && (
              <div className="mt-6 card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dokumen.file_url} alt={dokumen.judul} className="w-full object-contain" />
              </div>
            )}

            {dokumen.jenis_file === 'pdf' && (
              <div className="mt-6 card overflow-hidden">
                <iframe src={dokumen.file_url} className="h-[70vh] w-full" title={dokumen.judul} />
              </div>
            )}

            {dokumen.konten_teks && (
              <div className="mt-6 card p-5">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">
                  Teks Hasil Ekstraksi{dokumen.jenis_file === 'image' ? ' (OCR)' : ''}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {dokumen.konten_teks.slice(0, 3000)}
                  {dokumen.konten_teks.length > 3000 && '…'}
                </p>
              </div>
            )}
          </div>

          <aside>
            <RecommendationBox judulTugas={dokumen.tugas?.judul} langkah={langkah} />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
