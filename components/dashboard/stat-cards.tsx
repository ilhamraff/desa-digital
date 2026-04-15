import { createClient } from "@/lib/supabase/server";
import { Home, HandHeart, Calendar, FileText, Wallet } from "lucide-react";

export async function StatCards() {
  const supabase = await createClient();

  const [keluargaRes, bansosRes, suratRes, retribusiRes] = await Promise.all([
    supabase.from("keluarga").select("*", { count: "exact", head: true }),
    supabase
      .from("bansos")
      .select("*", { count: "exact", head: true })
      .eq("status", "tersalurkan"),
    supabase
      .from("surat")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("retribusi")
      .select("*", { count: "exact", head: true })
      .eq("status", "belum_bayar"),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { count: countKegiatan } = await supabase
    .from("kegiatan")
    .select("*", { count: "exact", head: true })
    .gte("tanggal", startOfMonth)
    .lte("tanggal", endOfMonth);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* Kartu 1: Total KK */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center bg-blue-50">
          <Home className="w-5 h-5 text-blue-600" />
        </div>
        <div className="mt-8">
          <h3 className="text-3xl font-bold text-gray-800">
            {keluargaRes.count || 0}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
            Total KK Terdaftar
          </p>
        </div>
      </div>

      {/* Kartu 2: Bansos */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center bg-green-50">
          <HandHeart className="w-5 h-5 text-green-600" />
        </div>
        <div className="mt-8">
          <h3 className="text-3xl font-bold text-gray-800">
            {bansosRes.count || 0}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
            Penerima Bansos Aktif
          </p>
        </div>
      </div>

      {/* Kartu 3: Kegiatan */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center bg-purple-50">
          <Calendar className="w-5 h-5 text-purple-600" />
        </div>
        <div className="mt-8">
          <h3 className="text-3xl font-bold text-gray-800">
            {countKegiatan || 0}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
            Kegiatan Bulan Ini
          </p>
        </div>
      </div>

      {/* Kartu 4: Surat */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center bg-orange-50">
          <FileText className="w-5 h-5 text-orange-600" />
        </div>
        <div className="mt-8">
          <h3 className="text-3xl font-bold text-gray-800">
            {suratRes.count || 0}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
            Surat Pending
          </p>
        </div>
      </div>

      {/* Kartu 5: Retribusi */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
        <div className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center bg-red-50">
          <Wallet className="w-5 h-5 text-red-600" />
        </div>
        <div className="mt-8">
          <h3 className="text-3xl font-bold text-gray-800">
            {retribusiRes.count || 0}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">
            Retribusi Belum Lunas
          </p>
        </div>
      </div>
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-5 border border-gray-50 relative"
        >
          <div className="absolute top-4 right-4 w-11 h-11 rounded-full bg-gray-100" />
          <div className="mt-8">
            <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-28 mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
