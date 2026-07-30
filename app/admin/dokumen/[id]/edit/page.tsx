'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Tugas = { id: string; judul: string };

export default function EditDokumenPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [dimuat, setDimuat] = useState(false);
  const [daftarTugas, setDaftarTugas] = useState<Tugas[]>([]);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState('');

  const [judul, setJudul] = useState('');
  const [nomorDokumen, setNomorDokumen] = useState('');
  const [jenisPeraturan, setJenisPeraturan] = useState('');
  const [tanggalDokumen, setTanggalDokumen] = useState('');
  const [sumber, setSumber] = useState('');
  const [tugasId, setTugasId] = useState('');
  const [kontenTeks, setKontenTeks] = useState('');
  const [langkahRekomendasi, setLangkahRekomendasi] = useState('');
  const [statusPublikasi, setStatusPublikasi] = useState<'terbit' | 'draft'>('terbit');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/documents/${params.id}`).then((r) => r.json()),
      fetch('/api/tugas').then((r) => r.json()),
    ]).then(([dokRes, tugasRes]) => {
      const d = dokRes.data;
      setJudul(d.judul || '');
      setNomorDokumen(d.nomor_dokumen || '');
      setJenisPeraturan(d.jenis_peraturan || '');
      setTanggalDokumen(d.tanggal_dokumen ? d.tanggal_dokumen.slice(0, 10) : '');
      setSumber(d.sumber || '');
      setTugasId(d.tugas_id || '');
      setKontenTeks(d.konten_teks || '');
      setLangkahRekomendasi((d.langkah_rekomendasi || []).join('\n'));
      setStatusPublikasi(d.status_publikasi || 'terbit');
      setFileUrl(d.file_url || '');
      setDaftarTugas(tugasRes.data || []);
      setDimuat(true);
    });
  }, [params.id]);

  async function handleSimpan(e: React.FormEvent) {
    e.preventDefault();
    setMenyimpan(true);
    setError('');
    try {
      const res = await fetch(`/api/documents/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul,
          nomor_dokumen: nomorDokumen,
          jenis_peraturan: jenisPeraturan,
          tanggal_dokumen: tanggalDokumen || null,
          sumber,
          tugas_id: tugasId || null,
          konten_teks: kontenTeks,
          langkah_rekomendasi: langkahRekomendasi.split('\n').map((s) => s.trim()).filter(Boolean),
          status_publikasi: statusPublikasi,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan perubahan.');
      router.push('/admin/dokumen');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMenyimpan(false);
    }
  }

  if (!dimuat) {
    return <main className="p-8 text-sm text-slate-500">Memuat data dokumen...</main>;
  }

  return (
    <main className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Edit Dokumen</h1>
      {fileUrl && (
        <a href={fileUrl} target="_blank" className="mt-1 inline-block text-xs text-primary-600 underline">
          Lihat file asli
        </a>
      )}

      <form onSubmit={handleSimpan} className="card mt-6 max-w-2xl space-y-4 p-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Judul Dokumen *</label>
          <input required value={judul} onChange={(e) => setJudul(e.target.value)} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Jenis Peraturan</label>
            <input value={jenisPeraturan} onChange={(e) => setJenisPeraturan(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nomor Dokumen</label>
            <input value={nomorDokumen} onChange={(e) => setNomorDokumen(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tanggal Dokumen</label>
            <input type="date" value={tanggalDokumen} onChange={(e) => setTanggalDokumen(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Sumber / Instansi</label>
            <input value={sumber} onChange={(e) => setSumber(e.target.value)} className="input-field" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tugas Terkait</label>
          <select value={tugasId} onChange={(e) => setTugasId(e.target.value)} className="input-field">
            <option value="">— Pilih tugas —</option>
            {daftarTugas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.judul}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Teks Terekstraksi / OCR</label>
          <textarea value={kontenTeks} onChange={(e) => setKontenTeks(e.target.value)} rows={6} className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Langkah Rekomendasi (satu baris = satu langkah)</label>
          <textarea value={langkahRekomendasi} onChange={(e) => setLangkahRekomendasi(e.target.value)} rows={5} className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
          <select value={statusPublikasi} onChange={(e) => setStatusPublikasi(e.target.value as any)} className="input-field">
            <option value="terbit">Terbit</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={menyimpan} className="btn-primary flex-1">
            {menyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </main>
  );
}
