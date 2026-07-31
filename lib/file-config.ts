export const TIPE_FILE_DIIZINKAN: Record<string, 'pdf' | 'image'> = {
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/webp': 'image',
};

// Supabase Storage (free tier) mendukung file hingga 50MB per objek secara default.
// Kita set batas aplikasi sedikit di bawahnya agar aman, dan tidak lagi dibatasi oleh
// batas 4.5MB milik Vercel Serverless Function karena file diunggah langsung dari
// browser ke Supabase Storage (tidak melewati function Next.js).
export const MAKS_UKURAN_FILE = 30 * 1024 * 1024; // 30 MB

export function ekstensiDariNamaFile(namaFile: string, jenisFile: 'pdf' | 'image'): string {
  const bagian = namaFile.split('.');
  if (bagian.length > 1) return bagian.pop() as string;
  return jenisFile === 'pdf' ? 'pdf' : 'jpg';
}
