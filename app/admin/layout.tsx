import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware sudah mengalihkan ke /admin/login bila belum login,
  // layout ini hanya perlu menampilkan sidebar bila user tersedia.
  if (!user) {
    return <>{children}</>; // dipakai juga untuk render /admin/login tanpa sidebar
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar email={user.email} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
