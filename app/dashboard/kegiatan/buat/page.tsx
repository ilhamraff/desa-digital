import React from "react";
import FormKegiatan from "../_components/FormKegiatan";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Buat Kegiatan Baru | Desa Digital",
};

export default function BuatKegiatanPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <Link
          href="/dashboard/kegiatan"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Daftar Kegiatan
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Buat Kegiatan Baru</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tambahkan agenda kegiatan baru untuk warga desa.
        </p>
      </div>

      <FormKegiatan />
    </div>
  );
}
