"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Users,
  IdCard,
  MapPin,
  Map,
  Calendar,
  Printer,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { Keluarga, Anggota } from "@/types";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ModalAnggota } from "@/components/keluarga/ModalAnggota";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface KeluargaDetail extends Keluarga {
  anggota: Anggota[];
}

export default function KeluargaDetailClient({
  initialData,
}: {
  initialData: KeluargaDetail;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [isDeleteKkModalOpen, setIsDeleteKkModalOpen] = useState(false);
  const [isDeletingKk, setIsDeletingKk] = useState(false);

  const [isAnggotaModalOpen, setIsAnggotaModalOpen] = useState(false);
  const [selectedAnggotaForEdit, setSelectedAnggotaForEdit] =
    useState<Anggota | null>(null);

  const [deleteAnggota, setDeleteAnggota] = useState<Anggota | null>(null);
  const [isDeletingAnggota, setIsDeletingAnggota] = useState(false);

  const handleDeleteKeluarga = async () => {
    setIsDeletingKk(true);
    // Asumsikan set cascading onDelete pada database, atau tangani manual jika dibutuhkan
    const { error } = await supabase
      .from("keluarga")
      .delete()
      .eq("id", initialData.id);

    setIsDeletingKk(false);

    if (error) {
      showToast(
        "error",
        "Simpan Gagal",
        "Gagal menghapus data keluarga, pastikan tidak ada data yang terikat.",
      );
      return;
    }

    showToast("success", "Terhapus", "Data keluarga berhasil dihapus.");
    setIsDeleteKkModalOpen(false);

    // Redirect
    router.push("/dashboard/keluarga");
    router.refresh();
  };

  const handleDeleteAnggota = async () => {
    if (!deleteAnggota) return;

    setIsDeletingAnggota(true);
    const { error } = await supabase
      .from("anggota")
      .delete()
      .eq("id", deleteAnggota.id);

    setIsDeletingAnggota(false);

    if (error) {
      showToast("error", "Gagal Hapus", error.message);
      return;
    }

    showToast(
      "success",
      "Terhapus",
      `Anggota ${deleteAnggota.nama} berhasil dihapus.`,
    );
    setDeleteAnggota(null);
    router.refresh();
  };

  const handleOpenEditAnggota = (anggota: Anggota) => {
    setSelectedAnggotaForEdit(anggota);
    setIsAnggotaModalOpen(true);
  };

  const handleOpenAddAnggota = () => {
    setSelectedAnggotaForEdit(null);
    setIsAnggotaModalOpen(true);
  };

  const handleAnggotaSuccess = () => {
    setIsAnggotaModalOpen(false);
    router.refresh(); // Fetch data ulang di server config page
  };

  const calculateAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    if (diff < 0) return 0; // proteksi di masa depan
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const formatTanggal = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const maskNik = (nik: string) => {
    if (!nik || nik.length !== 16) return nik;
    return nik.substring(0, 4) + "********" + nik.substring(12, 16);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("DATA KARTU KELUARGA", 14, 20);

    doc.setFontSize(10);
    doc.text(`Nomor KK       : ${initialData.no_kk}`, 14, 30);
    doc.text(`Kepala Keluarga: ${initialData.nama_kepala}`, 14, 36);
    doc.text(`Alamat         : ${initialData.alamat}`, 14, 42);
    doc.text(`RT/RW          : ${initialData.rt}/${initialData.rw}`, 14, 48);

    const tableColumn = [
      "No",
      "Nama",
      "NIK",
      "Hubungan",
      "Jenis Kelamin",
      "Usia",
      "Tgl Lahir",
    ];
    const tableRows = initialData.anggota.map((a, index) => [
      index + 1,
      a.nama,
      maskNik(a.nik), // Tetap di-masking untuk keamanan PDF
      a.hubungan,
      a.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan",
      `${calculateAge(a.tgl_lahir)} Tahun`,
      formatTanggal(a.tgl_lahir),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 56,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }, // Tailwind blue-600
    });

    const fileName = `Data_Keluarga_${initialData.no_kk}.pdf`;
    doc.save(fileName);
  };

  const renderBadgeHubungan = (hubungan: string) => {
    const defaultClasses =
      "px-2.5 py-0.5 rounded-full text-xs font-medium border";
    switch (hubungan.toLowerCase()) {
      case "kepala keluarga":
        return (
          <span
            className={`${defaultClasses} bg-blue-50 text-blue-700 border-blue-200`}
          >
            {hubungan}
          </span>
        );
      case "istri":
        return (
          <span
            className={`${defaultClasses} bg-pink-50 text-pink-700 border-pink-200`}
          >
            {hubungan}
          </span>
        );
      case "anak":
        return (
          <span
            className={`${defaultClasses} bg-green-50 text-green-700 border-green-200`}
          >
            {hubungan}
          </span>
        );
      default:
        return (
          <span
            className={`${defaultClasses} bg-gray-50 text-gray-700 border-gray-200`}
          >
            {hubungan}
          </span>
        );
    }
  };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 20mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          aside, header, nav { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      {/* HEADER KOP SURAT (PRINT ONLY) */}
      <div className="hidden print:block text-center border-b-[3px] border-black pb-4 mb-8 text-black">
        <h1 className="text-xl font-bold uppercase tracking-wider">
          Pemerintah Desa Digital
        </h1>
        <p className="text-sm">
          Kecamatan Inovasi, Kabupaten Teknologi, Provinsi Masa Depan
        </p>
      </div>
      <div className="hidden print:block text-center text-lg font-bold text-black mb-6 underline uppercase tracking-wide">
        Data Kartu Keluarga
      </div>

      {/* Tombol Kembali */}
      <div className="mb-4 print:hidden">
        <Link
          href="/dashboard/keluarga"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Keluarga
        </Link>
      </div>

      {/* SECTION 1: INFO KK */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:p-0 print:border-none print:mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 print:text-black">
            <IdCard className="w-6 h-6 text-green-600 print:hidden" /> Profil
            Kepala Keluarga
          </h2>
          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <Link
              href={`/dashboard/keluarga/${initialData.id}/edit`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors shadow-sm"
            >
              <Pencil className="w-4 h-4" /> Edit Data KK
            </Link>
            <button
              onClick={() => setIsDeleteKkModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Hapus KK
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:p-0 print:gap-4 print:text-black">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
              <IdCard className="w-4 h-4" /> Nomor KK
            </p>
            <p className="text-base font-semibold text-gray-900">
              {initialData.no_kk}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Kepala Keluarga
            </p>
            <p className="text-base font-semibold text-gray-900">
              {initialData.nama_kepala}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
              <Map className="w-4 h-4" /> Wilayah
            </p>
            <p className="text-base font-medium text-gray-900">
              RT {initialData.rt} / RW {initialData.rw}
            </p>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Alamat Lengkap
            </p>
            <p className="text-base font-medium text-gray-900 wrap-break-word">
              {initialData.alamat}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Terdaftar Sejak
            </p>
            <p className="text-base font-medium text-gray-900">
              {formatTanggal(initialData.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: ANGGOTA KELUARGA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 print:shadow-none print:border-none print:rounded-none print:mt-10">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:p-0 print:border-none print:mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 print:text-black">
            <Users className="w-6 h-6 text-blue-600 print:hidden" /> Anggota
            Keluarga ({initialData.anggota.length} orang)
          </h2>
          <button
            onClick={handleOpenAddAnggota}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors shadow-sm print:hidden"
          >
            <Plus className="w-4 h-4" /> Tambah Anggota
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#166534] text-white">
              <tr>
                <th className="px-6 py-4 font-medium min-w-[50px]">No</th>
                <th className="px-6 py-4 font-medium min-w-[200px]">
                  Nama Lengkap
                </th>
                <th className="px-6 py-4 font-medium min-w-[150px]">NIK</th>
                <th className="px-6 py-4 font-medium min-w-[150px]">
                  Hubungan
                </th>
                <th className="px-6 py-4 font-medium min-w-[150px]">
                  Tgl Lahir / Usia
                </th>
                <th className="px-6 py-4 font-medium text-center min-w-[100px] print:text-left print:px-2">
                  Gender
                </th>
                <th className="px-6 py-4 font-medium text-right min-w-[150px] print:hidden">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-900">
              {initialData.anggota.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users className="w-10 h-10 mb-3 text-gray-300" />
                      <p>
                        Belum ada rincian rekam jejak anggota di keluarga ini.
                      </p>
                      <button
                        onClick={handleOpenAddAnggota}
                        className="mt-2 text-green-600 font-medium hover:underline"
                      >
                        Catat Anggota Pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                initialData.anggota
                  /* Option: sort logic if you need to prioritize kepala -> but we skip explicitly doing so for pure UI mapping */
                  .map((anggota, index) => (
                    <tr
                      key={anggota.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {anggota.nama}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {maskNik(anggota.nik)}
                      </td>
                      <td className="px-6 py-4">
                        {renderBadgeHubungan(anggota.hubungan)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900">
                            {formatTanggal(anggota.tgl_lahir)}
                          </span>
                          <span className="text-gray-500 text-xs mt-0.5">
                            {calculateAge(anggota.tgl_lahir)} Tahun
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center print:text-left print:px-2">
                        {anggota.jenis_kelamin === "L" ? (
                          <span className="inline-flex items-center justify-center font-bold text-blue-600 bg-blue-100 rounded-md px-2 py-1 text-xs print:bg-transparent print:text-black print:p-0">
                            Laki-laki
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center font-bold text-pink-600 bg-pink-100 rounded-md px-2 py-1 text-xs print:bg-transparent print:text-black print:p-0">
                            Perempuan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                          <button
                            onClick={() => handleOpenEditAnggota(anggota)}
                            className="p-1.5 text-orange-600 hover:bg-orange-100 rounded-md transition-colors border border-transparent hover:border-orange-200"
                            title="Edit Anggota"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteAnggota(anggota)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors border border-transparent hover:border-red-200"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER PRINT ONLY */}
      <div className="hidden print:block mt-12 pt-4 border-t border-gray-300 text-sm text-black">
        <p>
          Dicetak pada:{" "}
          {new Date().toLocaleString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          WIB
        </p>
      </div>

      {/* MODAL 1: Tambah / Edit Anggota */}
      <ModalAnggota
        isOpen={isAnggotaModalOpen}
        onClose={() => setIsAnggotaModalOpen(false)}
        onSuccess={handleAnggotaSuccess}
        keluargaId={initialData.id}
        initialData={selectedAnggotaForEdit}
        existingAnggota={initialData.anggota}
      />

      {/* MODAL 2: Konfirmasi Hapus Anggota */}
      <ConfirmModal
        isOpen={!!deleteAnggota}
        title="Hapus Data Anggota"
        message={`Apakah Anda yakin ingin menghapus data anggota "${deleteAnggota?.nama}" dari daftar Kartu Keluarga? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Anggota"
        confirmVariant="danger"
        isLoading={isDeletingAnggota}
        onConfirm={handleDeleteAnggota}
        onCancel={() => !isDeletingAnggota && setDeleteAnggota(null)}
      />

      {/* MODAL 3: Konfirmasi Hapus KK */}
      <ConfirmModal
        isOpen={isDeleteKkModalOpen}
        title="Hapus Kartu Keluarga"
        message={
          initialData.anggota.length > 0
            ? `KK ini masih memiliki ${initialData.anggota.length} anggota. Menghapus KK akan menghapus semua data anggota. Lanjutkan?`
            : `Apakah Anda sungguh-sungguh ingin menghapus permanen data keluarga Bp/Ibu "${initialData.nama_kepala}"? Peringatan: hal ini tidak bisa diurungkan.`
        }
        confirmLabel="Hapus Permanen"
        confirmVariant="danger"
        isLoading={isDeletingKk}
        onConfirm={handleDeleteKeluarga}
        onCancel={() => !isDeletingKk && setIsDeleteKkModalOpen(false)}
      />
    </>
  );
}
