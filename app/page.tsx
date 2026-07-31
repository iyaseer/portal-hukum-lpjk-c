import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import DocumentCard from '@/components/DocumentCard';
import { createClient } from '@/lib/supabase/server';
import type { Tugas, Dokumen } from '@/lib/types';

export const revalidate = 0;

export default async function BerandaPage() {
  const supabase = createClient();

  const [{ data: daftarTugas }, { data: dokumenTerbaru }] = await Promise.all([
    supabase.from('tugas').select('*').order('urutan', { ascending: true }),
    supabase
      .from('dokumen')
      .select('*, tugas:tugas_id(*)')
      .eq('status_publikasi', 'terbit')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const tugasList = (daftarTugas || []) as Tugas[];
  const dokumenList = (dokumenTerbaru || []) as Dokumen[];

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-gradient-to-b from-primary-50 to-white py-14">
          <div className="container-app flex flex-col items-center text-center">
            <span className="badge mb-4">PP No. 14 Tahun 2021 jo. PP No. 22 Tahun 2020</span>
            <h1 className="max-w-2xl text-3xl font-bold text-slate-900 sm:text-4xl">
              Koleksi Dasar Hukum Tugas LPJK
            </h1>
            <p className="mt-3 max-w-xl text-slate-600">
              Cari dokumen hukum terkait tugas dan fungsi Lembaga Pengembangan Jasa Konstruksi dan dapatkan
              rekomendasi langkah pemenuhan secara langsung.
            </p>
            <div className="mt-6 w-full flex justify-center">
              <SearchBar />
            </div>
          </div>
        </section>

        <section className="container-app py-12">
          <h2 className="text-lg font-semibold text-slate-900">7 Tugas LPJK</h2>
          <p className="mt-1 text-sm text-slate-500">Pilih salah satu tugas untuk melihat dokumen hukum terkait.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tugasList.map((t) => (
              <Link
                key={t.id}
                href={`/tugas/${t.slug}`}
                className="card group p-5 transition hover:border-primary-300 hover:shadow-md"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">
                  {t.urutan}
                </div>
                <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-primary-700">{t.judul}</h3>
                <p className="mt-1.5 line-clamp-3 text-sm text-slate-500">{t.deskripsi}</p>
              </Link>
            ))}
            {tugasList.length === 0 && (
              <p className="text-sm text-slate-500">
                Belum ada data tugas. Jalankan <code>supabase/schema.sql</code> pada database Anda.
              </p>
            )}
          </div>
        </section>

        {dokumenList.length > 0 && (
          <section className="container-app pb-16">
            <h2 className="text-lg font-semibold text-slate-900">Dokumen Terbaru</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dokumenList.map((d) => (
                <DocumentCard key={d.id} dokumen={d} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
