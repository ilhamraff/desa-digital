import React from "react";

export interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // Normalisasi status ke lowercase agar pencocokan aman
  const normalizedStatus = status.toLowerCase();

  // Konfigurasi default (Abu-abu, label sesuai input)
  let config = {
    bg: "bg-gray-100",
    text: "text-gray-800",
    label: status,
  };

  // Mapping string status ke warna & label yang sesuai
  switch (normalizedStatus) {
    case "pending":
      config = {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Menunggu",
      };
      break;
    case "diproses":
      config = { bg: "bg-blue-100", text: "text-blue-800", label: "Diproses" };
      break;
    case "selesai":
      config = { bg: "bg-green-100", text: "text-green-800", label: "Selesai" };
      break;
    case "ditolak":
      config = { bg: "bg-red-100", text: "text-red-800", label: "Ditolak" };
      break;
    case "aktif":
      config = { bg: "bg-green-100", text: "text-green-800", label: "Aktif" };
      break;
    case "nonaktif":
      config = { bg: "bg-gray-100", text: "text-gray-800", label: "Nonaktif" };
      break;
    case "tersalurkan":
      config = {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Tersalurkan",
      };
      break;
    case "belum_bayar":
      config = {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Belum Bayar",
      };
      break;
    case "lunas":
      config = { bg: "bg-green-100", text: "text-green-800", label: "Lunas" };
      break;
    case "jatuh_tempo":
      config = { bg: "bg-red-100", text: "text-red-800", label: "Jatuh Tempo" };
      break;
    default:
      // Default case memperbolehkan status tak terdaftar lewat
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
