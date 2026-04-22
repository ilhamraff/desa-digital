"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { Kegiatan } from "@/types";
import Link from "next/link";

interface KegiatanCalendarProps {
  data: Kegiatan[];
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
}

const DAYS_OF_WEEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
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

export default function KegiatanCalendar({
  data,
  selectedMonth,
  selectedYear,
  onMonthChange,
}: KegiatanCalendarProps) {
  const [popoverState, setPopoverState] = useState<{
    dateStr: string;
    kegiatans: Kegiatan[];
    rect: DOMRect;
  } | null>(null);

  const prevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12, selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1, selectedYear);
    }
    setPopoverState(null);
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(1, selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1, selectedYear);
    }
    setPopoverState(null);
  };

  // Generate calendar grid
  // Note: selectedMonth is 1-indexed (1 = Jan, 12 = Dec)
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysInPrevMonth = new Date(selectedYear, selectedMonth - 1, 0).getDate();

  const cells = [];
  
  // Previous month dates
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({
      day,
      month: selectedMonth === 1 ? 12 : selectedMonth - 1,
      year: selectedMonth === 1 ? selectedYear - 1 : selectedYear,
      isCurrentMonth: false,
    });
  }

  // Current month dates
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      month: selectedMonth,
      year: selectedYear,
      isCurrentMonth: true,
    });
  }

  // Next month dates
  const remainingCells = 42 - cells.length; // 6 rows of 7 days
  for (let day = 1; day <= remainingCells; day++) {
    cells.push({
      day,
      month: selectedMonth === 12 ? 1 : selectedMonth + 1,
      year: selectedMonth === 12 ? selectedYear + 1 : selectedYear,
      isCurrentMonth: false,
    });
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const handleCellClick = (
    e: React.MouseEvent<HTMLDivElement>,
    dateStr: string,
    cellKegiatans: Kegiatan[]
  ) => {
    if (cellKegiatans.length === 0) {
      setPopoverState(null);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverState({ dateStr, kegiatans: cellKegiatans, rect });
  };

  // Tutup popover saat click diluar, tapi untuk simpelnya, kita buat overlay tipis saja
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, idx) => {
          const dateStr = `${cell.year}-${String(cell.month).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          
          // Cari kegiatan untuk tanggal ini
          const cellKegiatans = data.filter((k) => k.tanggal === dateStr);
          const hasKegiatan = cellKegiatans.length > 0;

          return (
            <div
              key={`${dateStr}-${idx}`}
              onClick={(e) => handleCellClick(e, dateStr, cellKegiatans)}
              className={`
                aspect-square flex flex-col items-center justify-center p-1 rounded-lg relative cursor-pointer
                transition-all duration-200 hover:bg-gray-50
                ${cell.isCurrentMonth ? "text-gray-900" : "text-gray-300"}
              `}
            >
              <div
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                  ${isToday ? "bg-blue-600 text-white shadow-md" : ""}
                `}
              >
                {cell.day}
              </div>
              
              {/* Dot Indicator */}
              <div className="h-1.5 flex mt-1 gap-0.5">
                {hasKegiatan && (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popover */}
      {popoverState && (
        <>
          {/* Overlay to close popover */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setPopoverState(null)} 
          />
          <div
            className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-xl p-4 w-64 text-sm"
            style={{
              top: popoverState.rect.bottom - popoverState.rect.height / 2 + 10,
              left: "50%",
              transform: "translateX(-50%)"
            }}
          >
            <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">
              Kegiatan ({new Date(popoverState.dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long" })})
            </h4>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {popoverState.kegiatans.map((kegiatan) => (
                <div key={kegiatan.id} className="space-y-2">
                  <div className="font-medium text-gray-900 leading-tight">
                    {kegiatan.judul}
                  </div>
                  <div className="text-gray-500 flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {kegiatan.waktu_mulai?.slice(0, 5) || "-"} - {kegiatan.waktu_selesai?.slice(0, 5) || "-"} WIB
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{kegiatan.lokasi}</span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/kegiatan/${kegiatan.id}`}
                    className="inline-block text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                  >
                    Lihat Detail &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
