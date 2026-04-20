"use client";

import { Search, Plus, ChevronDown, RotateCcw } from "lucide-react";

interface BansosFiltersProps {
  filterProgram: string;
  filterStatus: string;
  searchTerm: string;
  uniquePrograms: string[];
  filteredCount: number;
  totalCount: number;
  onFilterProgram: (v: string) => void;
  onFilterStatus: (v: string) => void;
  onSearch: (v: string) => void;
  onReset: () => void;
}

export function BansosFilters({
  filterProgram,
  filterStatus,
  searchTerm,
  uniquePrograms,
  filteredCount,
  totalCount,
  onFilterProgram,
  onFilterStatus,
  onSearch,
  onReset,
}: BansosFiltersProps) {
  const isFiltered =
    filterProgram !== "semua" || filterStatus !== "semua" || !!searchTerm;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
      <div className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Program filter */}
        <div className="relative">
          <select
            id="filter-program"
            value={filterProgram}
            onChange={(e) => onFilterProgram(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all w-full md:w-52"
          >
            <option value="semua">Semua Program</option>
            {uniquePrograms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => onFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all w-full md:w-44"
          >
            <option value="semua">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="tersalurkan">Tersalurkan</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            id="search-penerima"
            placeholder="Cari nama kepala KK atau nomor KK..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-gray-700"
          />
        </div>

        {/* Reset */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}

        {/* Tambah Penerima */}
        <button className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shrink-0">
          <Plus className="w-4 h-4" />
          Tambah Penerima
        </button>
      </div>

      {/* Result count */}
      {isFiltered && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400">
            Menampilkan{" "}
            <span className="font-semibold text-gray-600">{filteredCount}</span>{" "}
            dari{" "}
            <span className="font-semibold text-gray-600">{totalCount}</span>{" "}
            penerima
          </p>
        </div>
      )}
    </div>
  );
}
