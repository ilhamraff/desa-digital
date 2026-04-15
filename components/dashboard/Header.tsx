"use client";

import { Menu, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

interface HeaderProps {
  onOpenSidebar: () => void;
  userName: string;
}

export function Header({ onOpenSidebar, userName }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Logika untuk menangani fungsi logout dengan Supabase
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Fungsi helper untuk mendapatkan nama halaman aktif berdasarkan URL yang diakses
  const getPageName = () => {
    if (!pathname) return "";
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/dashboard/keluarga")) return "Data Keluarga";
    if (pathname.startsWith("/dashboard/bansos")) return "Bantuan Sosial";
    if (pathname.startsWith("/dashboard/kegiatan")) return "Kegiatan Desa";
    if (pathname.startsWith("/dashboard/surat")) return "Surat & Izin";
    if (pathname.startsWith("/dashboard/retribusi")) return "Retribusi";
    return "";
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b bg-white px-4 sm:px-6">
      {/* Container Kiri: Tombol Menu (Mobile) & Judul Halaman Aktif */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          title="Buka Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">{getPageName()}</h2>
      </div>

      {/* Container Kanan: Tampilan Nama User & Tombol Logout */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {userName}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-md p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden sm:block text-sm font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}
