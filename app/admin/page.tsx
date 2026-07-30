import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = createClient();

  const [{ count: totalDokumen }, { count: totalDraft }, { data: tugasList }] = await Promise.all([
    supabase.from('dokumen').select('*', { count: 'exact', head: true }).eq('status_publikasi', 'terbit'),
    supabase.from('dokumen').select('*', { count: 'exact', head: true }).eq('status_publikasi', 'draft'),
    supabase.from('tugas').select('id, judul, slug').order('urutan'),
  ]);

  const { data: dokumenPerTugas } = await supabase.from('dokumen').select('tugas_id');
  const hitungPerTugas: Record<string, number> = {};
  (dokumenPerTugas || []).forEach((d: any) => {
    if (d.tugas_id) hitungPerTugas[d.tugas_id] = (hitungPerTugas[d.tugas_id] || 0) + 1;
  });

  return (
    <main className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Dasbor</h1>
      <p className="mt-1 text-sm text-slate-500">Ringkasan koleksi dokumen dasar hukum LPJK.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-slate-400">Dokumen Terbit</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalDokumen || 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400">Draft</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalDraft || 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400">Kategori Tugas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{tugasList?.length || 0}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Dokumen per Tugas</h2>
        <div className="card divide-y divide-slate-100">
          {(tugasList || []).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <Link href={`/admin/dokumen?tugas=${t.slug}`} className="text-sm text-slate-700 hover:text-primary-600">
                {t.judul}
              </Link>
              <span className="badge">{hitungPerTugas[t.id] || 0} dokumen</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/admin/dokumen/baru" className="btn-primary">
          + Unggah Dokumen Baru
        </Link>
        <Link href="/admin/tugas" className="btn-secondary">
          Kelola 7 Tugas
        </Link>
      </div>
    </main>
  );
}
