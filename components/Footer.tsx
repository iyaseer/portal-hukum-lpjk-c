export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-app py-8 text-sm text-slate-500">
        <p>
          Platform Dasar Hukum Tugas LPJK — dibangun untuk memudahkan akses dokumen hukum
          terkait 7 tugas Lembaga Pengembangan Jasa Konstruksi berdasarkan PP No. 14 Tahun 2021
          jo. PP No. 22 Tahun 2020 tentang Peraturan Pelaksanaan UU No. 2 Tahun 2017 tentang Jasa Konstruksi.
        </p>
        <p className="mt-2">© {new Date().getFullYear()} — Dokumen bersifat referensi, rujuk selalu sumber resmi JDIH terkait.</p>
      </div>
    </footer>
  );
}
