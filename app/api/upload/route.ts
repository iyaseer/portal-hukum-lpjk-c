import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractPdfText, ocrImageBuffer } from '@/lib/ocr';
import { klasifikasikanDokumen } from '@/lib/classify';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TIPE_DIIZINKAN: Record<string, 'pdf' | 'image'> = {
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/webp': 'image',
};

const MAKS_UKURAN = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const judul = (formData.get('judul') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 });
    }

    const jenisFile = TIPE_DIIZINKAN[file.type];
    if (!jenisFile) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan PDF, JPG, PNG, atau WEBP.' },
        { status: 400 }
      );
    }

    if (file.size > MAKS_UKURAN) {
      return NextResponse.json({ error: 'Ukuran file melebihi 15 MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1) Ekstraksi teks: PDF pakai pdf-parse, gambar pakai OCR Tesseract
    let kontenTeks = '';
    try {
      kontenTeks = jenisFile === 'pdf' ? await extractPdfText(buffer) : await ocrImageBuffer(buffer);
    } catch (err) {
      console.error('Gagal ekstraksi teks:', err);
      kontenTeks = '';
    }

    // 2) Unggah ke Supabase Storage
    const admin = createAdminClient();
    const ekstensi = file.name.split('.').pop() || (jenisFile === 'pdf' ? 'pdf' : 'jpg');
    const namaFile = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ekstensi}`;
    const path = `dokumen/${namaFile}`;

    const { error: uploadError } = await admin.storage.from('dokumen').upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: `Gagal mengunggah file: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage.from('dokumen').getPublicUrl(path);

    // 3) Klasifikasi otomatis ke salah satu dari 7 tugas
    const { data: daftarTugas } = await admin.from('tugas').select('id, slug, judul, kata_kunci');
    const saranKlasifikasi = klasifikasikanDokumen(judul, kontenTeks, daftarTugas || []);

    return NextResponse.json({
      data: {
        file_path: path,
        file_url: publicUrlData.publicUrl,
        jenis_file: jenisFile,
        ukuran_file: file.size,
        konten_teks: kontenTeks,
        saran_klasifikasi: saranKlasifikasi,
      },
    });
  } catch (err: any) {
    console.error('Kesalahan upload:', err);
    return NextResponse.json({ error: err?.message || 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
