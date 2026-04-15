"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export default function DashboardLayoutClient({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f9fafb]">
      {/* Komponen Sidebar dengan state manajemen terpusat */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Area Utama Konten (Header & Children) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          userName={userName} 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
        />
        
        {/* Container Konten Utama: independen scroll, padding proporsional */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
