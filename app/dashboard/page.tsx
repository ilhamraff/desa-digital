import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Greeting } from "@/components/dashboard/Greeting";
import { StatCards, StatCardsSkeleton } from "@/components/dashboard/stat-cards";
import { RecentSuratTable, TableSkeleton } from "@/components/dashboard/recent-surat-table";
import { UpcomingKegiatanTable } from "@/components/dashboard/upcoming-kegiatan-table";

export default async function DashboardOverview() {
  const supabase = await createClient();

  // Ambil data user aktif
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ambil nama dari tabel profiles
  let userName = "Pengguna";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nama")
      .eq("id", user.id)
      .single();

    if (profile?.nama) {
      userName = profile.nama;
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Header & Sapaan Dinamis */}
      <Greeting userName={userName} />

      {/* 2. Kartu Statistik Utama (dimuat mandiri) */}
      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      {/* 3. Area Tabel (dimuat mandiri masing-masing) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Suspense fallback={<TableSkeleton />}>
          <RecentSuratTable />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <UpcomingKegiatanTable />
        </Suspense>
      </div>
    </div>
  );
}
