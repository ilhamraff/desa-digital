import React from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import KegiatanDetailClient from "./KegiatanDetailClient";

export const metadata = {
  title: "Detail Kegiatan | Desa Digital",
};

interface KegiatanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function KegiatanDetailPage(
  props: KegiatanDetailPageProps,
) {
  const params = await props.params;
  const id = params.id;

  const supabase = await createClient();

  // Ambil data kegiatan
  const { data: kegiatan, error } = await supabase
    .from("kegiatan")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !kegiatan) {
    notFound();
  }

  // Ambil data peserta beserta profilenya
  const { data: pesertaData } = await supabase
    .from("peserta_kegiatan")
    .select("*, profiles(*)")
    .eq("kegiatan_id", id)
    .order("waktu_daftar", { ascending: true });

  return (
    <KegiatanDetailClient
      kegiatan={kegiatan}
      initialPeserta={pesertaData || []}
    />
  );
}
