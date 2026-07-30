import Link from 'next/link';
import type { Dokumen } from '@/lib/types';

function formatTanggal(tgl: string | null) {
  if (!tgl) return '-';
  try {
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return tgl;
  }
}

export default function DocumentCard({ dokumen, cuplikan }: { dokumen: Dokumen; cuplikan?: string }) {
  return (
    <Link
      href={`/dokumen/${dokumen.id}`}
      className="card flex flex-col gap-2 p-4 transition hover:border-primary-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="badge">{dokumen.tugas?.judul || 'Belum dikategorikan'}</span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase text-slate-500">
          {dokumen.jenis_file === 'pdf' ? 'PDF' : 'Gambar'}
        </span>
      </div>
      <h3 className="font-semibold text-slate-900 leading-snug">{dokumen.judul}</h3>
      <p className="text-xs text-slate-500">
        {dokumen.jenis_peraturan || 'Dokumen'} {dokumen.nomor_dokumen && `· ${dokumen.nomor_dokumen}`} · {formatTanggal(dokumen.tanggal_dokumen)}
      </p>
      {cuplikan && (
        <p
          className="mt-1 line-clamp-3 text-sm text-slate-600"
          dangerouslySetInnerHTML={{ __html: cuplikan }}
        />
      )}
    </Link>
  );
}
