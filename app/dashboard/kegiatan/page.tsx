import { Wrench } from "lucide-react";

export default function KegiatanDesaPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white shadow-sm min-h-[60vh]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-6">
        <Wrench className="h-8 w-8 text-green-700" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 tracking-tight mb-3">
        Kegiatan Desa
      </h1>
      <p className="text-lg text-gray-500 max-w-md">
        Halaman ini sedang dalam pengembangan. Silakan kembali lagi nanti untuk pembaruan fitur ini.
      </p>
    </div>
  );
}
