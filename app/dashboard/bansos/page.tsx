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
    const isDef = !item.penerima_id;
    const existing = programMap.get(item.nama_program);

    if (existing) {
      if (!isDef) {
        existing.total_penerima += 1;
        // Tandai aktif jika masih ada penerima dengan status pending
        if (item.status === "pending") {
          existing.aktif = true;
        }
      } else {
        // Jika ini adalah row definisi, override detail program
        existing.jumlah_bantuan = item.jumlah_bantuan;
        existing.catatan = item.catatan || existing.catatan;
        existing.aktif = item.status === "pending"; // definisi mengontrol status global jika ada
      }
    } else {
      programMap.set(item.nama_program, {
        nama_program: item.nama_program,
        total_penerima: isDef ? 0 : 1,
        jumlah_bantuan: item.jumlah_bantuan,
        periode: item.periode,
        // Aktif default ke pending
        aktif: item.status === "pending",
        catatan: item.catatan || null,
      });
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
