import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormKeluarga } from "@/components/keluarga/FormKeluarga";

export const metadata = {
  title: "Edit Data Keluarga - Desa Digital",
};

export default async function EditKeluargaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: keluarga, error } = await supabase
    .from("keluarga")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !keluarga) {
    notFound();
  }

  // Melakukan mapping data database ke format FormDataKeluarga lokal kita yang memiliki field tambahan jika perlu
  const initialData = {
    ...keluarga,
    nik_kepala: keluarga.nik_kepala || "", // Jika Supabase belum merekam nik_kepala dsb
  };

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Perbarui Data Keluarga</h1>
        <p className="text-gray-500 mt-1">Perbarui informasi detail kepala keluarga atau lokasi domisilinya.</p>
      </div>

      <FormKeluarga initialData={initialData} isEdit={true} />
    </main>
  );
}
