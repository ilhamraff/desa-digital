"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, List, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Kegiatan } from "@/types";
import KegiatanList from "./_components/KegiatanList";
import KegiatanCalendar from "./_components/KegiatanCalendar";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function KegiatanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"list" | "calendar">("list");
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  
  const [kegiatans, setKegiatans] = useState<Kegiatan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchKegiatans = async () => {
      setIsLoading(true);
      
      // Calculate start and end dates for the selected month to fetch efficiently
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      // We get the last day of the month by requesting day 0 of the next month
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("kegiatan")
        .select("*, peserta_kegiatan(count)")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .order("tanggal", { ascending: true })
        .order("waktu_mulai", { ascending: true });

      if (error) {
        console.error("Error fetching kegiatan:", error);
      } else if (data) {
        // Karena kita sudah query .gte dan .lte, datanya sudah tersaring berdasarkan bulan/tahun.
        // Data dari Supabase memiliki relasi peserta_kegiatan: [{ count: X }]
        setKegiatans(data as any as Kegiatan[]);
      }
      setIsLoading(false);
    };

    fetchKegiatans();
  }, [selectedMonth, selectedYear]);

  // Handler untuk sinkronisasi Calendar navigation dengan Dropdown filter
  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Generate opsi tahun (misal dari tahun ini - 2 sampai tahun ini + 5)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kegiatan Desa</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola dan pantau agenda kegiatan serta partisipasi warga.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/kegiatan/buat"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#166534] text-white rounded-lg hover:bg-green-800 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Kegiatan
          </Link>
        </div>
      </div>

      {/* Toolbar: Toggle Mode & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Toggle Mode */}
        <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "list"
                ? "bg-[#166534] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setMode("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "calendar"
                ? "bg-[#166534] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Kalender
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 p-2 border bg-white"
          >
            {MONTH_NAMES.map((month, idx) => (
              <option key={month} value={idx + 1}>
                {month}
              </option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 p-2 border bg-white"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        {mode === "list" ? (
          <KegiatanList 
            data={kegiatans} 
            isLoading={isLoading} 
            onView={(kegiatan) => router.push(`/dashboard/kegiatan/${kegiatan.id}`)}
            onEdit={(kegiatan) => router.push(`/dashboard/kegiatan/${kegiatan.id}/edit`)}
          />
        ) : (
          <KegiatanCalendar 
            data={kegiatans} 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
          />
        )}
      </div>
    </div>
  );
}
