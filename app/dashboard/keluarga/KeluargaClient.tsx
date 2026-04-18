"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { DataTable, Column } from "@/components/DataTable";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Keluarga } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { ExportButton, ExportColumn } from "@/components/ExportButton";

export interface KeluargaWithCount extends Keluarga {
  anggota: { count: number }[];
}

export default function KeluargaClient({
  initialData,
}: {
  initialData: KeluargaWithCount[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [data, setData] = useState<KeluargaWithCount[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk Confirm Modal Hapus Data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeluarga, setSelectedKeluarga] =
    useState<KeluargaWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 2. Filter real-time berdasarkan nam_kepala atau no_kk
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.nama_kepala.toLowerCase().includes(lowerSearch) ||
        item.no_kk.toLowerCase().includes(lowerSearch),
    );
  }, [data, searchTerm]);

  // 3. Konfigurasi Kolom DataTable
  const columns: Column<KeluargaWithCount>[] = [
    {
      key: "no",
      label: "No",
      render: (_, row) => filteredData.indexOf(row) + 1,
    },
    {
      key: "no_kk",
      label: "Nomor KK",
    },
    {
      key: "nama_kepala",
      label: "Nama Kepala KK",
    },
    {
      key: "rt_rw",
      label: "RT/RW",
      render: (_, row) => `RT ${row.rt} / RW ${row.rw}`,
    },
    {
      key: "anggota",
      label: "Anggota",
      render: (_, row) => {
        // COUNT query dari tabel anggota diakses dari relasi Supabase
        const count =
          row.anggota && row.anggota.length > 0 ? row.anggota[0].count : 0;
        return `${count} Orang`;
      },
    },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 4. Aksi Hapus dari Supabase dan update State
  const confirmDelete = async () => {
    if (!selectedKeluarga) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from("keluarga")
      .delete()
      .eq("id", selectedKeluarga.id);

    if (!error) {
      setData((prev) => prev.filter((item) => item.id !== selectedKeluarga.id));
      router.refresh();
      setIsModalOpen(false);
      setSelectedKeluarga(null);
    } else {
      console.error("Error deleting:", error);
      alert(
        "Gagal menghapus data. Pastikan tidak ada data yang terkait (seperti anggota).",
      );
    }

    setIsDeleting(false);
  };

  // 5. Konfigurasi Kolom Export CSV
  const exportColumns: ExportColumn<KeluargaWithCount>[] = [
    { header: "No KK", accessor: (row) => row.no_kk },
    { header: "Nama Kepala KK", accessor: (row) => row.nama_kepala },
    { header: "RT", accessor: (row) => row.rt },
    { header: "RW", accessor: (row) => row.rw },
    { header: "Alamat", accessor: (row) => row.alamat || "-" },
    {
      header: "Jumlah Anggota",
      accessor: (row) =>
        row.anggota && row.anggota.length > 0 ? row.anggota[0].count : 0,
    },
    {
      header: "Tanggal Daftar",
      accessor: (row) =>
        row.created_at
          ? new Date(row.created_at).toISOString().split("T")[0]
          : "-",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Keluarga</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{data.length} KK terdaftar</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            data={data}
            columns={exportColumns}
            filename={`data-keluarga-${new Date().toISOString().split("T")[0]}.csv`}
            label="Export CSV"
          />
          <Link
            href="/dashboard/keluarga/tambah"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah KK
          </Link>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
            placeholder="Cari nama kepala keluarga atau nomor KK..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* 3 & 5. Tabel Data & Empty State Ramah */}
      {data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Daftar Keluarga Kosong
          </h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Saat ini belum ada data keluarga yang tercatat di sistem. Silakan
            tambahkan data keluarga terlebih dahulu.
          </p>
          <Link
            href="/dashboard/keluarga/tambah"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Data KK Pertama
          </Link>
        </div>
      ) : filteredData.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredData}
          onView={(row) => router.push(`/dashboard/keluarga/${row.id}`)}
          onEdit={(row) => router.push(`/dashboard/keluarga/${row.id}/edit`)}
          onDelete={(row) => {
            setSelectedKeluarga(row);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Data tidak ditemukan
          </h3>
          <p className="text-gray-500 flex-wrap max-w-md">
            Kami tidak dapat menemukan data keluarga yang cocok dengan pencarian
            &quot;{searchTerm}&quot;. Silakan coba dengan kata kunci lain.
          </p>
        </div>
      )}

      {/* 4. ConfirmModal */}
      <ConfirmModal
        isOpen={isModalOpen}
        title="Hapus Data Keluarga"
        message={`Apakah Anda yakin ingin menghapus data keluarga dengan Kepala Keluarga "${selectedKeluarga?.nama_kepala}" (No. KK: ${selectedKeluarga?.no_kk})? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setIsModalOpen(false);
            setSelectedKeluarga(null);
          }
        }}
      />
    </div>
  );
}
