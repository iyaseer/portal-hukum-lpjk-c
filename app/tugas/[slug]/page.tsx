import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DocumentCard from '@/components/DocumentCard';
import RecommendationBox from '@/components/RecommendationBox';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function TugasPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: tugas } = await supabase.from('tugas').select('*').eq('slug', params.slug).single();
  if (!tugas) return notFound();

  const { data: dokumenList } = await supabase
    .from('dokumen')
    .select('*, tugas:tugas_id(*)')
    .eq('tugas_id', tugas.id)
    .eq('status_publikasi', 'terbit')
    .order('created_at', { ascending: false });

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <span className="badge">Tugas {tugas.urutan} dari 7</span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{tugas.judul}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{tugas.deskripsi}</p>
        {tugas.dasar_hukum && (
          <p className="mt-1 text-xs font-medium text-slate-400">Dasar hukum: {tugas.dasar_hukum}</p>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Dokumen Hukum Terkait ({dokumenList?.length || 0})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(dokumenList || []).map((d) => (
                <DocumentCard key={d.id} dokumen={d} />
              ))}
            </div>
            {(!dokumenList || dokumenList.length === 0) && (
              <div className="card p-6 text-sm text-slate-500">
                Belum ada dokumen yang diunggah untuk tugas ini.
              </div>
            )}
          </div>
          <aside>
            <RecommendationBox judulTugas={tugas.judul} langkah={tugas.langkah_rekomendasi} />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
