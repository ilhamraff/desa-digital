import Link from "next/link";
import { Database, ArrowLeft } from "lucide-react";

export default function NotFoundKeluarga() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
        <Database className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Data Tidak Ditemukan
      </h2>
      <p className="text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
        Data keluarga dengan ID ini tidak ditemukan atau sudah dihapus dari
        sistem.
      </p>
      <Link
        href="/dashboard/keluarga"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Keluarga
      </Link>
    </div>
  );
}
