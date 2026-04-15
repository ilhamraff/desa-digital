import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inisialisasi klien Supabase pada server
  const supabase = await createClient();
  
  // Dapatkan sesi user aktif
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect jika belum login
  if (!user) {
    redirect("/login");
  }

  // Ambil profil data user dari tabel profiles untuk ditampilkan di header
  let userName = "Pengguna";
  const { data: profile } = await supabase
    .from("profiles")
    .select("nama")
    .eq("id", user.id)
    .single();

  if (profile?.nama) {
    userName = profile.nama;
  }

  return (
    // Membungkus children ke dalam layout wrapper (Client Component)
    <DashboardLayoutClient userName={userName}>
      {children}
    </DashboardLayoutClient>
  );
}
