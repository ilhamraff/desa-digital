"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Users, HandHeart, Calendar, FileText, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: House },
  { name: "Data Keluarga", href: "/dashboard/keluarga", icon: Users },
  { name: "Bantuan Sosial", href: "/dashboard/bansos", icon: HandHeart },
  { name: "Kegiatan Desa", href: "/dashboard/kegiatan", icon: Calendar },
  { name: "Surat & Izin", href: "/dashboard/surat", icon: FileText },
  { name: "Retribusi", href: "/dashboard/retribusi", icon: Wallet },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Drawer Overlay: Menutup sidebar ketika overlay diklik di mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[240px] transform bg-[#14532d] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full" // Menampilkan sidebar di mobile berdasarkan state
        )}
      >
        {/* Logo / Nama Aplikasi */}
        <div className="flex h-16 items-center justify-center border-b border-white/10">
          <h1 className="text-xl font-bold tracking-wider">Desa Digital</h1>
        </div>

        {/* Daftar Menu Utama */}
        <nav className="mt-6 px-4 space-y-1">
          {menuItems.map((item) => {
            // Logika untuk mendeteksi menu aktif
            const isActive = 
              item.href === "/dashboard" 
                ? pathname === "/dashboard" // Khusus '/dashboard' butuh exact match
                : pathname.startsWith(item.href); // Menu lain menggunakan startsWith agar sub-page tetap ber-background aktif
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Tutup sidebar di interface mobile setelah menu diklik
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#15803d] text-white" // Warna aktif hijau tua
                    : "text-gray-300 hover:bg-[#15803d]/50 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
