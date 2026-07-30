import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dasar Hukum Tugas LPJK | PP No. 14 Tahun 2021',
  description:
    'Platform koleksi dan pencarian dokumen dasar hukum untuk 7 tugas Lembaga Pengembangan Jasa Konstruksi (LPJK) sesuai PP No. 14 Tahun 2021.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
