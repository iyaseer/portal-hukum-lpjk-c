'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const menu = [
  { href: '/admin', label: 'Dasbor' },
  { href: '/admin/dokumen', label: 'Dokumen' },
  { href: '/admin/dokumen/baru', label: 'Unggah Dokumen' },
  { href: '/admin/tugas', label: 'Kelola 7 Tugas' },
];

export default function AdminSidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-sm font-semibold text-slate-900">Panel Admin</p>
        <p className="text-xs text-slate-400">Dasar Hukum LPJK</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {menu.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        {email && <p className="mb-2 truncate px-2 text-xs text-slate-400">{email}</p>}
        <Link href="/" className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          ← Lihat situs publik
        </Link>
        <button
          onClick={handleLogout}
          className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
