import { createClient } from "@/lib/supabase/server";
import SuratClient from "./_components/SuratClient";

export default async function SuratDanIzinPage() {
  const supabase = await createClient();

  // Fetch data surat beserta nama pemohon
  const { data: suratData, error } = await supabase
    .from("surat")
    .select(`
      *,
      profiles:pemohon_id (nama)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching surat:", error);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <SuratClient initialData={suratData || []} />
    </div>
  );
}
