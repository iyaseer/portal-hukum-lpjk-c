'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TIPE_FILE_DIIZINKAN, MAKS_UKURAN_FILE, ekstensiDariNamaFile } from '@/lib/file-config';

type Tugas = { id: string; judul: string; slug: string; langkah_rekomendasi: string[] };
type Saran = { tugas_id: string; slug: string; judul: string; skor: number; kata_kunci_cocok: string[] };

export default function UnggahDokumenPage() {
  const router = useRouter();
  const [daftarTugas, setDaftarTugas] = useState<Tugas[]>([]);
  const [langkah, setLangkah] = useState(1); // 1 = pilih file, 2 = lengkapi metadata

  // Langkah 1
  const [file, setFile] = useState<File | null>(null);
  const [memprosesEkstraksi, setMemprosesEkstraksi] = useState(false);
  const [errorEkstraksi, setErrorEkstraksi] = useState('');

  // Hasil ekstraksi
  const [hasilUpload, setHasilUpload] = useState<any>(null);
  const [saranKlasifikasi, setSaranKlasifikasi] = useState<Saran[]>([]);

  // Langkah 2 (form metadata)
  const [judul, setJudul] = useState('');
  const [nomorDokumen, setNomorDokumen] = useState('');
  const [jenisPeraturan, setJenisPeraturan] = useState('');
  const [tanggalDokumen, setTanggalDokumen] = useState('');
  const [sumber, setSumber] = useState('');
  const [tugasId, setTugasId] = useState('');
  const [langkahRekomendasi, setLangkahRekomendasi] = useState('');
  const [statusPublikasi, setStatusPublikasi] = useState<'terbit' | 'draft'>('terbit');
  const [menyimpan, setMenyimpan] = useState(false);
  const [errorSimpan, setErrorSimpan] = useState('');

  // Analisis AI (Gemini) - opsional, dipicu manual
  const [menganalisisAI, setMenganalisisAI] = useState(false);
  const [errorAI, setErrorAI] = useState('');
  const [hasilAI, setHasilAI] = useState<any>(null);

  useEffect(() => {
    fetch('/api/tugas')
      .then((r) => r.json())
      .then((res) => setDaftarTugas(res.data || []));
  }, []);

  async function handleEkstraksi(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setMemprosesEkstraksi(true);
    setErrorEkstraksi('');

    try {
      const jenisFile = TIPE_FILE_DIIZINKAN[file.type];
      if (!jenisFile) {
        throw new Error('Format file tidak didukung. Gunakan PDF, JPG, PNG, atau WEBP.');
      }
      if (file.size > MAKS_UKURAN_FILE) {
        throw new Error(`Ukuran file melebihi ${Math.round(MAKS_UKURAN_FILE / 1024 / 1024)}MB.`);
      }

      // 1) Unggah file LANGSUNG dari browser ke Supabase Storage (tidak lewat
      //    server Next.js), agar tidak terbentur batas 4.5MB request body
      //    milik Vercel Serverless Function.
      const supabase = createClient();
      const ekstensi = ekstensiDariNamaFile(file.name, jenisFile);
      const namaFile = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ekstensi}`;
      const path = `dokumen/${namaFile}`;

      const { error: uploadError } = await supabase.storage.from('dokumen').upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) {
        throw new Error(
          `Gagal mengunggah file ke Storage: ${uploadError.message}. Pastikan Anda sudah login dan policy Storage sudah diterapkan (lihat supabase/storage-setup.sql).`
        );
      }

      const { data: publicUrlData } = supabase.storage.from('dokumen').getPublicUrl(path);
      const fileUrl = publicUrlData.publicUrl;

      // 2) Minta server membaca teksnya (OCR/ekstraksi PDF) & klasifikasi otomatis,
      //    hanya dengan mengirim URL (payload kecil, aman dari batas Vercel).
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl, jenis_file: jenisFile, judul: judul || file.name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memproses file.');

      const dataGabungan = {
        file_path: path,
        file_url: fileUrl,
        jenis_file: jenisFile,
        ukuran_file: file.size,
        konten_teks: json.data.konten_teks,
        saran_klasifikasi: json.data.saran_klasifikasi,
      };

      setHasilUpload(dataGabungan);
      setSaranKlasifikasi(dataGabungan.saran_klasifikasi || []);

      if (!judul) setJudul(file.name.replace(/\.[^.]+$/, ''));

      // Prefill tugas dari saran teratas (jika skornya > 0)
      const terbaik = (dataGabungan.saran_klasifikasi || [])[0];
      if (terbaik && terbaik.skor > 0) {
        setTugasId(terbaik.tugas_id);
        const t = daftarTugas.find((x) => x.id === terbaik.tugas_id);
        if (t) setLangkahRekomendasi(t.langkah_rekomendasi.join('\n'));
      }

      setLangkah(2);
    } catch (err: any) {
      setErrorEkstraksi(err.message || 'Terjadi kesalahan.');
    } finally {
      setMemprosesEkstraksi(false);
    }
  }

  function pilihTugas(id: string) {
    setTugasId(id);
    const t = daftarTugas.find((x) => x.id === id);
    if (t) setLangkahRekomendasi(t.langkah_rekomendasi.join('\n'));
  }

  async function handleAnalisisAI() {
    if (!hasilUpload) return;
    setMenganalisisAI(true);
    setErrorAI('');
    setHasilAI(null);

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul,
          konten_teks: hasilUpload.konten_teks,
          jenis_file: hasilUpload.jenis_file,
          file_url: hasilUpload.file_url,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menganalisis dokumen dengan AI.');

      const hasil = json.data;
      setHasilAI(hasil);

      // Isi otomatis field metadata dari hasil AI (admin tetap bisa menyunting)
      if (hasil.jenis_peraturan) setJenisPeraturan(hasil.jenis_peraturan);
      if (hasil.nomor_dokumen) setNomorDokumen(hasil.nomor_dokumen);
      if (hasil.tanggal_dokumen) setTanggalDokumen(hasil.tanggal_dokumen);
      if (hasil.instansi_penerbit) setSumber(hasil.instansi_penerbit);

      if (hasil.tugas_slug) {
        const t = daftarTugas.find((x) => x.slug === hasil.tugas_slug);
        if (t) pilihTugas(t.id);
      }
    } catch (err: any) {
      setErrorAI(err.message || 'Terjadi kesalahan.');
    } finally {
      setMenganalisisAI(false);
    }
  }

  async function handleSimpan(e: React.FormEvent) {
    e.preventDefault();
    if (!hasilUpload) return;
    setMenyimpan(true);
    setErrorSimpan('');

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul,
          nomor_dokumen: nomorDokumen,
          jenis_peraturan: jenisPeraturan,
          tanggal_dokumen: tanggalDokumen || null,
          sumber,
          tugas_id: tugasId || null,
          jenis_file: hasilUpload.jenis_file,
          file_path: hasilUpload.file_path,
          file_url: hasilUpload.file_url,
          ukuran_file: hasilUpload.ukuran_file,
          konten_teks: hasilUpload.konten_teks,
          langkah_rekomendasi: langkahRekomendasi
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          status_publikasi: statusPublikasi,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan dokumen.');

      router.push('/admin/dokumen');
      router.refresh();
    } catch (err: any) {
      setErrorSimpan(err.message || 'Terjadi kesalahan.');
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <main className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Unggah Dokumen Baru</h1>
      <p className="mt-1 text-sm text-slate-500">
        Langkah 1: unggah file — sistem otomatis membaca teks (ekstraksi PDF / OCR gambar) dan
        merekomendasikan tugas terkait. Langkah 2: lengkapi metadata dan konfirmasi.
      </p>

      <div className="mt-6 flex items-center gap-3 text-xs font-medium">
        <span className={`rounded-full px-3 py-1 ${langkah === 1 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
          1. Unggah &amp; Ekstraksi
        </span>
        <span className="h-px w-6 bg-slate-300" />
        <span className={`rounded-full px-3 py-1 ${langkah === 2 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
          2. Metadata &amp; Klasifikasi
        </span>
      </div>

      {langkah === 1 && (
        <form onSubmit={handleEkstraksi} className="card mt-6 max-w-xl space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">File Dokumen (PDF, JPG, PNG, WEBP — maks 30MB)</label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Judul Dokumen (opsional, bisa diisi setelahnya)</label>
            <input value={judul} onChange={(e) => setJudul(e.target.value)} className="input-field" placeholder="Mis. PP No. 14 Tahun 2021" />
          </div>
          {errorEkstraksi && <p className="text-sm text-red-600">{errorEkstraksi}</p>}
          <button type="submit" disabled={!file || memprosesEkstraksi} className="btn-primary w-full">
            {memprosesEkstraksi ? 'Memproses OCR/ekstraksi teks...' : 'Ekstrak Teks & Klasifikasikan'}
          </button>
        </form>
      )}

      {langkah === 2 && hasilUpload && (
        <form onSubmit={handleSimpan} className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="card space-y-4 p-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Judul Dokumen *</label>
              <input required value={judul} onChange={(e) => setJudul(e.target.value)} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Jenis Peraturan</label>
                <input
                  value={jenisPeraturan}
                  onChange={(e) => setJenisPeraturan(e.target.value)}
                  placeholder="PP / UU / Permen / SE"
                  className="input-field"
                />
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
              <label className="mb-1 block text-xs font-medium text-slate-600">Tugas Terkait (klasifikasi)</label>
              <select value={tugasId} onChange={(e) => pilihTugas(e.target.value)} className="input-field">
                <option value="">— Pilih tugas —</option>
                {daftarTugas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.judul}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Langkah Rekomendasi Pemenuhan (satu baris = satu langkah)
              </label>
              <textarea
                value={langkahRekomendasi}
                onChange={(e) => setLangkahRekomendasi(e.target.value)}
                rows={6}
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
              <select value={statusPublikasi} onChange={(e) => setStatusPublikasi(e.target.value as any)} className="input-field">
                <option value="terbit">Terbit (tampil di publik)</option>
                <option value="draft">Draft (belum tampil)</option>
              </select>
            </div>

            {errorSimpan && <p className="text-sm text-red-600">{errorSimpan}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setLangkah(1)} className="btn-secondary">
                Kembali
              </button>
              <button type="submit" disabled={menyimpan} className="btn-primary flex-1">
                {menyimpan ? 'Menyimpan...' : 'Simpan Dokumen'}
              </button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card border-violet-200 bg-violet-50/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-violet-900">✨ Analisis dengan AI</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Baca dokumen aslinya (bukan cuma kata kunci) untuk mengekstrak nomor, tanggal,
                instansi, ringkasan, dan klasifikasi tugas yang lebih presisi — memakai Google Gemini.
              </p>
              <button
                type="button"
                onClick={handleAnalisisAI}
                disabled={menganalisisAI}
                className="mt-3 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {menganalisisAI ? 'Menganalisis dokumen...' : 'Analisis dengan AI'}
              </button>
              {errorAI && <p className="mt-2 text-xs text-red-600">{errorAI}</p>}
              {hasilAI && (
                <div className="mt-3 space-y-2 rounded-lg bg-white p-3 text-xs">
                  <p>
                    <span className="font-medium text-slate-600">Keyakinan klasifikasi:</span>{' '}
                    <span className="badge">{hasilAI.keyakinan}%</span>
                  </p>
                  {hasilAI.alasan && (
                    <p className="text-slate-500">
                      <span className="font-medium text-slate-600">Alasan: </span>
                      {hasilAI.alasan}
                    </p>
                  )}
                  {hasilAI.ringkasan && (
                    <p className="text-slate-500">
                      <span className="font-medium text-slate-600">Ringkasan: </span>
                      {hasilAI.ringkasan}
                    </p>
                  )}
                  <p className="text-slate-400">Field metadata di formulir sudah diisi otomatis — silakan periksa &amp; sunting bila perlu.</p>
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700">Saran Klasifikasi Otomatis (kata kunci)</h3>
              <p className="mt-1 text-xs text-slate-400">
                Berdasarkan kemunculan kata kunci pada judul &amp; teks hasil ekstraksi.
              </p>
              <ul className="mt-3 space-y-2">
                {saranKlasifikasi.slice(0, 5).map((s) => (
                  <li key={s.tugas_id}>
                    <button
                      type="button"
                      onClick={() => pilihTugas(s.tugas_id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                        tugasId === s.tugas_id ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-medium text-slate-700">{s.judul}</span>
                      <span className="badge">skor {s.skor}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700">Cuplikan Teks Terbaca</h3>
              <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-line text-xs text-slate-500">
                {hasilUpload.konten_teks
                  ? hasilUpload.konten_teks.slice(0, 800) + (hasilUpload.konten_teks.length > 800 ? '…' : '')
                  : 'Tidak ada teks terbaca dari file ini.'}
              </p>
            </div>
          </aside>
        </form>
      )}
    </main>
  );
}
