import { createWorker } from 'tesseract.js';

/**
 * Menjalankan OCR pada buffer gambar (JPG/PNG/dsb) dan mengembalikan teks hasil pemindaian.
 * Mendukung Bahasa Indonesia + Inggris sekaligus agar istilah hukum/asing tetap terbaca.
 */
export async function ocrImageBuffer(buffer: Buffer): Promise<string> {
  const worker = await createWorker(['ind', 'eng']);
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

/**
 * Mengekstrak teks dari file PDF (dokumen hasil ketik/digital-native).
 * Jika PDF hasil pindaian (scan) tanpa layer teks, hasil bisa kosong —
 * pada kondisi ini admin dapat mengunggah versi gambar agar diproses OCR.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // Import dinamis agar tidak dibundel ke sisi client
  const pdfParse = (await import('pdf-parse')).default;
  try {
    const result = await pdfParse(buffer);
    return (result.text || '').trim();
  } catch (err) {
    console.error('Gagal mengekstrak teks PDF:', err);
    return '';
  }
}
