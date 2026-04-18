import { FormKeluarga } from "@/components/keluarga/FormKeluarga";

export const metadata = {
  title: "Tambah Data Keluarga - Desa Digital",
};

export default function TambahKeluargaPage() {
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tambah Data Keluarga Baru</h1>
        <p className="text-gray-500 mt-1">Lengkapi formulir di bawah ini untuk mendaftarkan Kepala Keluarga baru ke dalam sistem pendataan desa.</p>
      </div>

      <FormKeluarga />
    </main>
  );
}
