import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import KeluargaClient from "./KeluargaClient";

export const metadata = {
  title: "Data Keluarga - Desa Digital",
};

// Component asinkron untuk fetch data awal
async function KeluargaDataFetcher() {
  const supabase = await createClient();
  
  // Mengambil semua data dari tabel keluarga dengan menyertakan count anggota
  const { data, error } = await supabase
    .from("keluarga")
    .select("*, anggota(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching data keluarga:", error);
    // Memberikan array kosong jika error terjadi agar UI aman
  }

  return <KeluargaClient initialData={data || []} />;
}

export default function KeluargaPage() {
  return (
    <main className="p-6">
      {/* 5. Suspense untuk loading state */}
      <Suspense 
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            <p className="text-sm font-medium">Memuat data keluarga...</p>
          </div>
        }
      >
        <KeluargaDataFetcher />
      </Suspense>
    </main>
  );
}
