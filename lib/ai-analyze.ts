export type TugasUntukAI = {
  id: string;
  slug: string;
  judul: string;
};

export type HasilAnalisisAI = {
  jenis_peraturan: string;
  nomor_dokumen: string;
  tanggal_dokumen: string; // format YYYY-MM-DD, boleh kosong bila tidak ditemukan
  instansi_penerbit: string;
  ringkasan: string;
  tugas_slug: string; // salah satu dari slug yang disediakan, atau "" bila tidak yakin
  keyakinan: number; // 0-100
  alasan: string;
};

// Gemini 3.5 Flash-Lite: model GA (production-ready) yang direkomendasikan Google
// untuk tugas klasifikasi/ekstraksi berbiaya rendah, dan masih masuk free tier.
// (gemini-2.5-flash sudah dipensiunkan untuk API key/proyek baru per 2026)
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SKEMA_RESPON = {
  type: 'object',
  properties: {
    jenis_peraturan: { type: 'string', description: 'Contoh: UU, PP, Permen PUPR, Surat Edaran, Keputusan' },
    nomor_dokumen: { type: 'string', description: 'Nomor resmi dokumen, contoh: "14 Tahun 2021" atau "8/PRT/M/2021"' },
    tanggal_dokumen: { type: 'string', description: 'Tanggal ditetapkan/diundangkan, format YYYY-MM-DD. Kosongkan jika tidak ditemukan.' },
    instansi_penerbit: { type: 'string', description: 'Instansi/lembaga yang menerbitkan dokumen' },
    ringkasan: { type: 'string', description: 'Ringkasan isi dokumen dalam 2-3 kalimat Bahasa Indonesia' },
    tugas_slug: { type: 'string', description: 'Slug tugas LPJK paling relevan dari daftar yang diberikan, atau string kosong jika tidak ada yang cocok' },
    keyakinan: { type: 'number', description: 'Tingkat keyakinan klasifikasi tugas, 0-100' },
    alasan: { type: 'string', description: 'Alasan singkat pemilihan tugas terkait' },
  },
  required: ['jenis_peraturan', 'nomor_dokumen', 'tanggal_dokumen', 'instansi_penerbit', 'ringkasan', 'tugas_slug', 'keyakinan', 'alasan'],
};

/**
 * Menganalisis dokumen hukum memakai Gemini API (Google AI Studio, ada kuota gratis).
 * Bisa memakai teks hasil OCR/ekstraksi saja, atau ditambah file asli (gambar/PDF)
 * sebagai lampiran multimodal agar hasil lebih presisi (Gemini bisa "melihat" tabel,
 * kop surat, cap, dan tanda tangan yang sering terlewat oleh OCR biasa).
 */
export async function analisisDokumenDenganAI(params: {
  judul: string;
  kontenTeks: string;
  daftarTugas: TugasUntukAI[];
  fileBuffer?: Buffer;
  fileMimeType?: string;
}): Promise<HasilAnalisisAI> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum diatur di environment variables server.');
  }

  const daftarTugasTeks = params.daftarTugas.map((t) => `- slug: "${t.slug}" — ${t.judul}`).join('\n');

  const instruksi = `Anda adalah asisten ahli hukum jasa konstruksi Indonesia yang membantu mengelola dokumen dasar hukum untuk Lembaga Pengembangan Jasa Konstruksi (LPJK).

Tugas Anda: baca dokumen yang dilampirkan (dan/atau teks hasil OCR di bawah), lalu ekstrak informasi berikut secara akurat:
1. Jenis peraturan (UU, PP, Permen, Surat Edaran, Keputusan Menteri, dsb).
2. Nomor dokumen resmi.
3. Tanggal dokumen ditetapkan/diundangkan.
4. Instansi/lembaga penerbit.
5. Ringkasan singkat isi dokumen.
6. Tugas LPJK mana yang paling relevan dengan isi dokumen ini, PILIH HANYA dari daftar berikut:
${daftarTugasTeks}

Jika dokumen tidak jelas terkait salah satu tugas di atas, kosongkan tugas_slug dan jelaskan di kolom alasan.
Jika suatu informasi tidak ditemukan dalam dokumen, kosongkan field tersebut — jangan mengarang.

Judul dokumen (dari admin, mungkin belum akurat): "${params.judul || '(tidak diisi)'}"

${params.kontenTeks ? `Teks hasil OCR/ekstraksi dokumen:\n"""\n${params.kontenTeks.slice(0, 12000)}\n"""` : 'Tidak ada teks hasil OCR yang tersedia — gunakan lampiran file untuk membaca dokumen.'}`;

  const parts: any[] = [{ text: instruksi }];

  if (params.fileBuffer && params.fileMimeType) {
    parts.push({
      inline_data: {
        mime_type: params.fileMimeType,
        data: params.fileBuffer.toString('base64'),
      },
    });
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: SKEMA_RESPON,
      },
    }),
  });

  if (!res.ok) {
    const teksError = await res.text();
    const pesanTambahan =
      res.status === 404
        ? ' Kemungkinan Google mengganti/mempensiunkan model ini — cek daftar model terbaru di https://ai.google.dev/gemini-api/docs/models dan perbarui GEMINI_MODEL di lib/ai-analyze.ts.'
        : '';
    throw new Error(`Gemini API gagal (${res.status}): ${teksError.slice(0, 300)}${pesanTambahan}`);
  }

  const json = await res.json();
  const teksRespon = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!teksRespon) {
    throw new Error('Gemini tidak mengembalikan hasil yang valid. Coba lagi.');
  }

  try {
    return JSON.parse(teksRespon) as HasilAnalisisAI;
  } catch {
    throw new Error('Gagal membaca hasil analisis AI (format JSON tidak valid).');
  }
}
