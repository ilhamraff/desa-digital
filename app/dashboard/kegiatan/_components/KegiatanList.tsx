"use client";

import React from "react";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Kegiatan } from "@/types";

interface KegiatanListProps {
  data: Kegiatan[];
  isLoading: boolean;
  onEdit?: (kegiatan: Kegiatan) => void;
  onDelete?: (kegiatan: Kegiatan) => void;
  onView?: (kegiatan: Kegiatan) => void;
}

export default function KegiatanList({
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
}: KegiatanListProps) {
  const columns: Column<Kegiatan>[] = [
    {
      key: "judul",
      label: "Judul Kegiatan",
      render: (value) => <span className="font-medium">{String(value)}</span>,
    },
    {
      key: "tanggal",
      label: "Tanggal",
      render: (value) => {
        try {
          return new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(new Date(String(value)));
        } catch {
          return String(value);
        }
      },
    },
    {
      key: "waktu",
      label: "Waktu",
      render: (_, row) => {
        const mulai = row.waktu_mulai ? row.waktu_mulai.slice(0, 5) : "-";
        const selesai = row.waktu_selesai ? row.waktu_selesai.slice(0, 5) : "-";
        return `${mulai} – ${selesai} WIB`;
      },
    },
    {
      key: "lokasi",
      label: "Lokasi",
    },
    {
      key: "peserta",
      label: "Peserta",
      render: (_, row) => {
        const count = row.peserta_kegiatan?.[0]?.count || 0;
        const max = row.kuota || 0;
        const percentage = max > 0 ? (count / max) * 100 : 100;
        
        let colorClass = "text-green-600 bg-green-50";
        if (percentage >= 100) {
          colorClass = "text-red-600 bg-red-50";
        } else if (percentage >= 80) { // Sisa <= 20%
          colorClass = "text-orange-600 bg-orange-50";
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {count} / {max}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={String(value)} />,
    },
  ];

  return (
    <div className="w-full">
      {data.length === 0 && !isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Belum ada kegiatan
          </h3>
          <p className="text-gray-500 max-w-sm">
            Tidak ada kegiatan desa yang dijadwalkan pada bulan ini. Anda bisa
            membuat kegiatan baru untuk bulan ini.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      )}
    </div>
  );
}
