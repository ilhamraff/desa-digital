"use client";

import React from "react";
import { Download } from "lucide-react";

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

export interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  label?: string;
  className?: string;
}

export function ExportButton<T>({
  data,
  columns,
  filename,
  label = "Export CSV",
  className = "",
}: ExportButtonProps<T>) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    // 1. Buat Header baris
    const headers = columns
      .map((col) => `"${col.header.replace(/"/g, '""')}"`)
      .join(",");

    // 2. Buat Rows dari data array
    const rows = data.map((row) => {
      return columns
        .map((col) => {
          const value = col.accessor(row);
          // Format value as string, handle nulls/undefined, and escape double quotes
          const stringValue = String(value ?? "").replace(/"/g, '""');
          return `"${stringValue}"`;
        })
        .join(",");
    });

    // 3. Gabungkan Header dan Rows (tambahkan format UTF-8 BOM '\uFEFF' agar didukung MS Excel)
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");

    // 4. Create object URL and trigger file download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // 5. Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 ${className}`}
    >
      <Download className="w-5 h-5 text-gray-500" />
      {label}
    </button>
  );
}
