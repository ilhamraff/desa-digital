import { createClient } from "@/lib/supabase/server";
import { LaporanClient } from "./LaporanClient";

interface LaporanPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LaporanBansosPage({
  searchParams,
}: LaporanPageProps) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  const programFilter =
    typeof resolvedSearchParams.program === "string"
      ? resolvedSearchParams.program
      : "semua";
  const periodeFilter =
    typeof resolvedSearchParams.periode === "string"
      ? resolvedSearchParams.periode
      : "semua";

  // Fetch unique programs and periodes for filters
  // Since Supabase doesn't have SELECT DISTINCT, we fetch all definitions and extract
  const { data: allBansos } = await supabase
    .from("bansos")
    .select("nama_program, periode, penerima_id");

  const programs = new Set<string>();
  const periodes = new Set<string>();

  if (allBansos) {
    allBansos.forEach((b) => {
      if (b.nama_program) programs.add(b.nama_program);
      if (b.periode && b.periode !== "-") periodes.add(b.periode);
    });
  }

  // Fetch actual data based on filter
  let query = supabase
    .from("bansos")
    .select(
      `
      id,
      nama_program,
      jumlah_bantuan,
      status,
      periode,
      updated_at,
      penerima_id,
      keluarga:penerima_id (
        id,
        no_kk,
        nama_kepala,
        rt,
        rw
      )
    `,
    )
    .not("penerima_id", "is", null);

  if (programFilter !== "semua") {
    query = query.eq("nama_program", programFilter);
  }

  if (periodeFilter !== "semua") {
    query = query.eq("periode", periodeFilter);
  }

  const { data: rawData, error } = await query;

  if (error) {
    console.error("Error fetching laporan data:", error);
  }

  // Normalize data
  const reportData = (rawData || []).map((item: any) => ({
    id: item.id,
    nama_program: item.nama_program,
    jumlah_bantuan: item.jumlah_bantuan,
    status: item.status,
    periode: item.periode,
    updated_at: item.updated_at,
    keluarga: Array.isArray(item.keluarga)
      ? item.keluarga[0] || null
      : item.keluarga || null,
  }));

  return (
    <LaporanClient
      data={reportData}
      filterProgram={programFilter}
      filterPeriode={periodeFilter}
      availablePrograms={Array.from(programs).sort()}
      availablePeriodes={Array.from(periodes).sort((a, b) => {
        // Custom sort for periodes if needed, string sort is fine for now
        return b.localeCompare(a); // Reverse chronological string sort roughly
      })}
    />
  );
}
