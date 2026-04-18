import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KeluargaDetailClient, { KeluargaDetail } from "./KeluargaDetailClient";

export const metadata = {
  title: "Detail Data Keluarga - Desa Digital",
};

export default async function KeluargaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: keluarga, error } = await supabase
    .from("keluarga")
    .select(
      `
      *,
      anggota(*)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !keluarga) {
    console.error("Fetch Detail Error:", error);
    notFound();
  }

  // Mengurutkan anggota berdasar created_at atau status Kepala supaya Kepala selalu duluan?
  // Biasanya dari DB sudah cukup, tapi kita leave sorting to Client atau DB.

  return (
    <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <KeluargaDetailClient initialData={keluarga as KeluargaDetail} />
    </main>
  );
}
