'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Dokumen } from '@/lib/types';

export default function AdminDocumentTable({ dokumenAwal }: { dokumenAwal: Dokumen[] }) {
  const [dokumenList, setDokumenList] = useState(dokumenAwal);
  const [memproses, setMemproses] = useState<string | null>(null);
  const router = useRouter();

  async function hapusDokumen(id: string) {
    if (!confirm('Hapus dokumen ini secara permanen? Tindakan tidak dapat dibatalkan.')) return;
    setMemproses(id);
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setMemproses(null);
    if (res.ok) {
      setDokumenList((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert('Gagal menghapus dokumen.');
    }
  }

  async function ubahStatus(id: string, statusBaru: 'terbit' | 'draft') {
    setMemproses(id);
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_publikasi: statusBaru }),
    });
    setMemproses(null);
    if (res.ok) {
      setDokumenList((prev) => prev.map((d) => (d.id === id ? { ...d, status_publikasi: statusBaru } : d)));
      router.refresh();
    } else {
      alert('Gagal mengubah status.');
    }
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Judul</th>
            <th className="px-4 py-3">Tugas</th>
            <th className="px-4 py-3">Format</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dokumenList.map((d) => (
            <tr key={d.id}>
              <td className="px-4 py-3">
                <Link href={`/dokumen/${d.id}`} target="_blank" className="font-medium text-slate-800 hover:text-primary-600">
                  {d.judul}
                </Link>
                <p className="text-xs text-slate-400">{d.nomor_dokumen}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{d.tugas?.judul || '-'}</td>
              <td className="px-4 py-3 uppercase text-slate-500">{d.jenis_file}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.status_publikasi === 'terbit' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {d.status_publikasi === 'terbit' ? 'Terbit' : 'Draft'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    disabled={memproses === d.id}
                    onClick={() => ubahStatus(d.id, d.status_publikasi === 'terbit' ? 'draft' : 'terbit')}
                    className="btn-secondary px-2.5 py-1.5 text-xs"
                  >
                    {d.status_publikasi === 'terbit' ? 'Jadikan Draft' : 'Terbitkan'}
                  </button>
                  <Link href={`/admin/dokumen/${d.id}/edit`} className="btn-secondary px-2.5 py-1.5 text-xs">
                    Edit
                  </Link>
                  <button
                    disabled={memproses === d.id}
                    onClick={() => hapusDokumen(d.id)}
                    className="btn-danger px-2.5 py-1.5 text-xs"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {dokumenList.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                Belum ada dokumen.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
