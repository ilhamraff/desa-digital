import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    // Background abu muda konsisten dengan halaman login
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Kartu Layout dengan styling yang sama (rounded-2xl, shadow-xl) */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        
        {/* Ikon atau Ilustrasi "Akses Ditolak" */}
        <div className="mx-auto w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2 border border-red-100 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>

        {/* Informasi Error */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Akses Terbatas
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            Maaf, halaman ini hanya dapat diakses oleh petugas desa yang berwenang. Hubungi administrator untuk informasi lebih lanjut.
          </p>
        </div>

        {/* Tombol Navigasi Kembali menggunakan Link (Next.js) */}
        <div className="pt-2">
          <Link
            href="/login"
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#15803d] bg-[#15803d] hover:bg-green-800 shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Login
          </Link>
        </div>

      </div>
    </div>
  );
}
