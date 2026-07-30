import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminDocumentTable from '@/components/AdminDocumentTable';

export const revalidate = 0;

export default async function AdminDokumenPage({ searchParams }: { searchParams: { tugas?: string } }) {
  const supabase = createClient();

  let query = supabase.from('dokumen').select('*, tugas:tugas_id(*)').order('created_at', { ascending: false });

  if (searchParams.tugas) {
    const { data: tugas } = await supabase.from('tugas').select('id').eq('slug', searchParams.tugas).single();
    if (tugas) query = query.eq('tugas_id', tugas.id);
  }

  const { data: dokumenList } = await query;

  return (
    <main className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dokumen</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola seluruh dokumen dasar hukum LPJK.</p>
        </div>
        <Link href="/admin/dokumen/baru" className="btn-primary">
          + Unggah Dokumen
        </Link>
      </div>

      <div className="mt-6">
        <AdminDocumentTable dokumenAwal={(dokumenList || []) as any} />
      </div>
    </main>
  );
}
