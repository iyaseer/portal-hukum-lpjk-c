import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { analisisDokumenDenganAI } from '@/lib/ai-analyze';

export const runtime = 'nodejs';
export const maxDuration = 45;

const MIME_PER_JENIS: Record<string, string> = {
  pdf: 'application/pdf',
  image: 'image/jpeg', // fallback umum; dicoba deteksi ulang dari header respons di bawah
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { judul, konten_teks, jenis_file, file_url } = body;

    if (!file_url) {
      return NextResponse.json({ error: 'file_url wajib diisi.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: daftarTugas, error: errTugas } = await admin.from('tugas').select('id, slug, judul');
    if (errTugas) {
      return NextResponse.json({ error: errTugas.message }, { status: 500 });
    }

    // Ambil ulang file dari Storage agar AI bisa "melihat" dokumen aslinya
    // (lebih presisi daripada hanya membaca teks OCR untuk tabel/kop surat/cap).
    let fileBuffer: Buffer | undefined;
    let mimeType: string | undefined;
    try {
      const respFile = await fetch(file_url);
      if (respFile.ok) {
        const arrayBuffer = await respFile.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        mimeType = respFile.headers.get('content-type') || MIME_PER_JENIS[jenis_file] || undefined;
        // Batasi ukuran yang dikirim ke AI agar tidak melebihi limit payload
        if (fileBuffer.byteLength > 18 * 1024 * 1024) {
          fileBuffer = undefined;
          mimeType = undefined;
        }
      }
    } catch {
      // Bila gagal mengambil file, tetap lanjut dengan teks OCR saja
    }

    const hasil = await analisisDokumenDenganAI({
      judul: judul || '',
      kontenTeks: konten_teks || '',
      daftarTugas: daftarTugas || [],
      fileBuffer,
      fileMimeType: mimeType,
    });

    return NextResponse.json({ data: hasil });
  } catch (err: any) {
    console.error('Kesalahan analisis AI:', err);
    return NextResponse.json({ error: err?.message || 'Gagal menganalisis dokumen dengan AI.' }, { status: 500 });
  }
}
