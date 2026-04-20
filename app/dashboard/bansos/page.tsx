import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  BansosWithRelations,
  ProgramSummary,
} from "./_components/bansos.types";
import BansosClient from "./BansosClient";

export const metadata = {
  title: "Manajemen Bantuan Sosial - Desa Digital",
  description:
    "Kelola program bantuan sosial dan daftar penerima bantuan di desa.",
};

// ── Data Fetcher (async Server Component) ─────────────────────────────────────

async function BansosDataFetcher() {
  const supabase = await createClient();

  // FK aktual di DB: bansos.penerima_id → public.keluarga.id
  const { data: rawData, error } = await supabase
    .from("bansos")
    .select(
      `
      *,
      keluarga!penerima_id(no_kk, nama_kepala)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bansos:", error);
  }

  const bansosData: BansosWithRelations[] = (rawData ?? []).map((item) => ({
    ...item,
    // Supabase bisa mengembalikan objek tunggal atau array; normalkan ke object
    keluarga: Array.isArray(item.keluarga)
      ? (item.keluarga[0] ?? null)
      : (item.keluarga ?? null),
    profiles: null, // tidak ada FK bansos → profiles di DB aktual
  }));

  // ── Bangun ringkasan per program (group by nama_program) ──────────────────
  const programMap = new Map<string, ProgramSummary>();

  for (const item of bansosData) {
    const existing = programMap.get(item.nama_program);
    if (existing) {
      existing.total_penerima += 1;
    } else {
      programMap.set(item.nama_program, {
        nama_program: item.nama_program,
        total_penerima: 1,
        jumlah_bantuan: item.jumlah_bantuan,
        periode: item.periode,
        // Tandai aktif jika masih ada penerima dengan status pending
        aktif: item.status === "pending",
      });
    }

    // Jika ada satu saja yang masih pending, program dianggap aktif
    if (item.status === "pending") {
      const prog = programMap.get(item.nama_program);
      if (prog) prog.aktif = true;
    }
  }

  const programs: ProgramSummary[] = Array.from(programMap.values());

  return <BansosClient initialData={bansosData} programs={programs} />;
}

// ── Page Component (Server Component) ────────────────────────────────────────

export default function BansosPage() {
  return (
    <main className="p-6">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
            <p className="text-sm font-medium">Memuat data bantuan sosial...</p>
          </div>
        }
      >
        <BansosDataFetcher />
      </Suspense>
    </main>
  );
}
