'use client';

import { useEffect, useState } from 'react';

type Tugas = {
  id: string;
  urutan: number;
  slug: string;
  judul: string;
  deskripsi: string;
  dasar_hukum: string;
  kata_kunci: string[];
  langkah_rekomendasi: string[];
};

const KOSONG: Omit<Tugas, 'id'> = {
  urutan: 0,
  slug: '',
  judul: '',
  deskripsi: '',
  dasar_hukum: '',
  kata_kunci: [],
  langkah_rekomendasi: [],
};

export default function KelolaTugasPage() {
  const [daftar, setDaftar] = useState<Tugas[]>([]);
  const [dipilih, setDipilih] = useState<Tugas | null>(null);
  const [form, setForm] = useState<any>(KOSONG);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState('');

  async function muatUlang() {
    const res = await fetch('/api/tugas').then((r) => r.json());
    setDaftar(res.data || []);
  }

  useEffect(() => {
    muatUlang();
  }, []);

  function pilihUntukEdit(t: Tugas) {
    setDipilih(t);
    setForm({
      ...t,
      kata_kunci: t.kata_kunci.join(', '),
      langkah_rekomendasi: t.langkah_rekomendasi.join('\n'),
    });
  }

  function tambahBaru() {
    setDipilih(null);
    setForm({ ...KOSONG, urutan: daftar.length + 1, kata_kunci: '', langkah_rekomendasi: '' });
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setMenyimpan(true);
    setError('');

    const payload = {
      urutan: Number(form.urutan) || 0,
      slug: form.slug.trim(),
      judul: form.judul.trim(),
      deskripsi: form.deskripsi,
      dasar_hukum: form.dasar_hukum,
      kata_kunci: String(form.kata_kunci)
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      langkah_rekomendasi: String(form.langkah_rekomendasi)
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean),
    };

    try {
      const url = dipilih ? `/api/tugas/${dipilih.id}` : '/api/tugas';
      const method = dipilih ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan.');
      await muatUlang();
      setDipilih(null);
      setForm(KOSONG);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMenyimpan(false);
    }
  }

  async function hapus(t: Tugas) {
    if (!confirm(`Hapus tugas "${t.judul}"? Dokumen yang terhubung tidak akan terhapus, hanya tautannya.`)) return;
    await fetch(`/api/tugas/${t.id}`, { method: 'DELETE' });
    await muatUlang();
    if (dipilih?.id === t.id) {
      setDipilih(null);
      setForm(KOSONG);
    }
  }

  return (
    <main className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Kelola 7 Tugas LPJK</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sesuaikan judul, deskripsi, kata kunci klasifikasi otomatis, dan langkah rekomendasi pemenuhan.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card divide-y divide-slate-100">
          {daftar.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {t.urutan}. {t.judul}
                </p>
                <p className="text-xs text-slate-400">/{t.slug}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => pilihUntukEdit(t)} className="btn-secondary px-2.5 py-1.5 text-xs">
                  Edit
                </button>
                <button onClick={() => hapus(t)} className="btn-danger px-2.5 py-1.5 text-xs">
                  Hapus
                </button>
              </div>
            </div>
          ))}
          {daftar.length === 0 && <p className="px-4 py-6 text-sm text-slate-400">Belum ada data tugas.</p>}
          <div className="px-4 py-3">
            <button onClick={tambahBaru} className="btn-primary w-full">
              + Tambah Tugas Baru
            </button>
          </div>
        </div>

        <form onSubmit={simpan} className="card h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold text-slate-700">{dipilih ? `Edit: ${dipilih.judul}` : 'Tugas Baru'}</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Urutan</label>
              <input
                type="number"
                value={form.urutan}
                onChange={(e) => setForm({ ...form, urutan: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Slug (URL)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Judul Tugas *</label>
            <input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Deskripsi</label>
            <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={3} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Dasar Hukum</label>
            <input value={form.dasar_hukum} onChange={(e) => setForm({ ...form, dasar_hukum: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Kata Kunci Klasifikasi (pisahkan dengan koma)</label>
            <textarea
              value={form.kata_kunci}
              onChange={(e) => setForm({ ...form, kata_kunci: e.target.value })}
              rows={2}
              className="input-field"
              placeholder="registrasi, sbu, sertifikat badan usaha"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Langkah Rekomendasi Default (satu baris = satu langkah)</label>
            <textarea
              value={form.langkah_rekomendasi}
              onChange={(e) => setForm({ ...form, langkah_rekomendasi: e.target.value })}
              rows={5}
              className="input-field"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            {dipilih && (
              <button type="button" onClick={tambahBaru} className="btn-secondary">
                Batal
              </button>
            )}
            <button type="submit" disabled={menyimpan} className="btn-primary flex-1">
              {menyimpan ? 'Menyimpan...' : dipilih ? 'Simpan Perubahan' : 'Tambah Tugas'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
