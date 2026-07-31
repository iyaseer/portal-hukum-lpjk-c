import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            LPJK
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Dasar Hukum Tugas LPJK</p>
            <p className="text-[11px] text-slate-500">PP No. 14 Tahun 2021</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/" className="hover:text-primary-600">Beranda</Link>
          <Link href="/cari" className="hover:text-primary-600">Pencarian</Link>
          <Link href="/admin" className="hover:text-primary-600">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
