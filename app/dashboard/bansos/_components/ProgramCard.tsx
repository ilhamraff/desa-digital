"use client";

import { HandHeart, Pencil } from "lucide-react";
import { ProgramSummary } from "./bansos.types";
import { formatRupiah } from "@/lib/utils";

interface ProgramCardProps {
  program: ProgramSummary;
  isSelected: boolean;
  onLihatPenerima: (nama: string) => void;
}

export function ProgramCard({
  program,
  isSelected,
  onLihatPenerima,
}: ProgramCardProps) {
  return (
    <div
      className={`relative bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col ${
        isSelected
          ? "border-green-500 shadow-green-100"
          : "border-gray-100 hover:border-green-200"
      }`}
    >
      {/* Top accent bar */}
      <div
        className={`h-1.5 w-full ${program.aktif ? "bg-linear-to-r from-green-500 to-emerald-400" : "bg-gray-300"}`}
      />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                program.aktif ? "bg-green-50" : "bg-gray-100"
              }`}
            >
              <HandHeart
                className={`w-5 h-5 ${program.aktif ? "text-green-600" : "text-gray-400"}`}
              />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                {program.nama_program}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{program.periode}</p>
            </div>
          </div>
          <button
            title="Edit Program"
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors shrink-0"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {program.total_penerima}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Total Penerima</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              {formatRupiah(program.jumlah_bantuan)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Per Penerima</p>
          </div>
        </div>

        {/* Status badge + action */}
        <div className="flex items-center justify-between mt-auto">
          {program.aktif ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Nonaktif
            </span>
          )}

          <button
            onClick={() => onLihatPenerima(program.nama_program)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isSelected
                ? "bg-green-600 text-white"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {isSelected ? "✓ Sedang Dilihat" : "Lihat Penerima"}
          </button>
        </div>
      </div>
    </div>
  );
}
