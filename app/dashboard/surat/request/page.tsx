import { createClient } from "@/lib/supabase/server";
import FormRequestSurat from "./_components/FormRequestSurat";

export default async function RequestSuratPage() {
  const supabase = await createClient();

  // Ambil data warga untuk searchable dropdown
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, nama, rt, rw")
    .eq("role", "warga")
    .order("nama", { ascending: true });

  if (error) {
    console.error("Error fetching profiles:", error);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Request Surat Baru</h1>
        <p className="text-gray-500">
          Isi formulir ini untuk mengajukan permohonan surat atas nama warga yang datang langsung ke kantor desa.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <FormRequestSurat profiles={profiles || []} />
      </div>
    </div>
  );
}
