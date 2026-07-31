import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractPdfText, ocrImageBuffer } from '@/lib/ocr';
import { klasifikasikanDokumen } from '@/lib/classify';
import { MAKS_UKURAN_FILE } from '@/lib/file-config';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Route ini TIDAK menerima file secara langsung (menghindari batas 4.5MB
 * request body milik Vercel Serverless Function). File sudah diunggah
 * lebih dulu langsung dari browser ke Supabase Storage (lihat halaman
 * admin/dokumen/baru), route ini hanya mengambil ulang file dari URL
 * publiknya untuk dibaca teksnya (OCR/ekstraksi PDF) lalu diklasifikasikan.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file_url, jenis_file, judul } = body;

    if (!file_url || !jenis_file) {
      return NextResponse.json({ error: 'file_url dan jenis_file wajib diisi.' }, { status: 400 });
    }
    if (jenis_file !== 'pdf' && jenis_file !== 'image') {
      return NextResponse.json({ error: 'jenis_file harus "pdf" atau "image".' }, { status: 400 });
    }

    const respFile = await fetch(file_url);
    if (!respFile.ok) {
      return NextResponse.json({ error: 'Gagal mengambil file dari Storage untuk diproses.' }, { status: 502 });
    }

    const arrayBuffer = await respFile.arrayBuffer();
    if (arrayBuffer.byteLength > MAKS_UKURAN_FILE) {
      return NextResponse.json({ error: 'Ukuran file melebihi batas yang diizinkan.' }, { status: 400 });
    }
    const buffer = Buffer.from(arrayBuffer);

    let kontenTeks = '';
    try {
      kontenTeks = jenis_file === 'pdf' ? await extractPdfText(buffer) : await ocrImageBuffer(buffer);
    } catch (err) {
      console.error('Gagal ekstraksi teks:', err);
      kontenTeks = '';
    }

    const admin = createAdminClient();
    const { data: daftarTugas } = await admin.from('tugas').select('id, slug, judul, kata_kunci');
    const saranKlasifikasi = klasifikasikanDokumen(judul || '', kontenTeks, daftarTugas || []);

    return NextResponse.json({
      data: {
        konten_teks: kontenTeks,
        saran_klasifikasi: saranKlasifikasi,
      },
    });
  } catch (err: any) {
    console.error('Kesalahan ekstraksi:', err);
    return NextResponse.json({ error: err?.message || 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
