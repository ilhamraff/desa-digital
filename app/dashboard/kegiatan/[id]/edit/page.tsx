import React from "react";
import FormKegiatan from "../../_components/FormKegiatan";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Kegiatan | Desa Digital",
};

interface EditKegiatanPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKegiatanPage(props: EditKegiatanPageProps) {
  const params = await props.params;
  const id = params.id;
  
  const supabase = await createClient();
  
  const { data: kegiatan, error } = await supabase
    .from("kegiatan")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !kegiatan) {
    notFound();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <Link
          href="/dashboard/kegiatan"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Daftar Kegiatan
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Kegiatan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Perbarui informasi kegiatan desa.
        </p>
      </div>

      <FormKegiatan initialData={kegiatan} />
    </div>
  );
}
