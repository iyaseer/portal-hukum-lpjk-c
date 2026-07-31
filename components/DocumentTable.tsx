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

export default function DocumentTable({ dokumenList }: { dokumenList: Dokumen[] }) {
  if (!dokumenList || dokumenList.length === 0) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        Belum ada dokumen yang diunggah untuk tugas ini.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Tampilan tabel — layar sedang ke atas */}
      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Nomor Dokumen</th>
            <th className="px-4 py-3 font-semibold">Judul Dokumen</th>
            <th className="px-4 py-3 font-semibold">Keterangan</th>
            <th className="px-4 py-3 text-right font-semibold">Preview</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dokumenList.map((d) => (
            <tr key={d.id} className="align-top hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-4">
                <Link href={`/dokumen/${d.id}`} className="text-sm font-medium text-primary-700 hover:underline">
                  {d.nomor_dokumen || '-'}
                </Link>
                <div className="mt-1">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                    Berlaku
                  </span>
                </div>
              </td>
              <td className="px-4 py-4">
                <Link href={`/dokumen/${d.id}`} className="font-medium text-slate-800 hover:text-primary-600">
                  {d.judul}
                </Link>
              </td>
              <td className="px-4 py-4 text-slate-500">
                <p>{d.jenis_peraturan || '-'}</p>
                <p className="text-xs text-slate-400">{formatTanggal(d.tanggal_dokumen)}</p>
                {d.sumber && <p className="text-xs text-slate-400">{d.sumber}</p>}
              </td>
              <td className="px-4 py-4 text-right">
                <Link
                  href={`/dokumen/${d.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                    {d.jenis_file === 'pdf' ? 'PDF' : 'Gambar'}
                  </span>
                  Lihat
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tampilan kartu — layar kecil (mobile) */}
      <div className="divide-y divide-slate-100 sm:hidden">
        {dokumenList.map((d) => (
          <Link key={d.id} href={`/dokumen/${d.id}`} className="block px-4 py-4 hover:bg-slate-50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-primary-700">{d.nomor_dokumen || '-'}</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                Berlaku
              </span>
            </div>
            <p className="mt-1 font-medium text-slate-800">{d.judul}</p>
            <p className="mt-1 text-xs text-slate-500">
              {d.jenis_peraturan || '-'} · {formatTanggal(d.tanggal_dokumen)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
