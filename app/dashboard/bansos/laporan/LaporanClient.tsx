"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  Filter,
  CheckCircle2,
  XCircle,
  Users,
  BarChart3,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LaporanClientProps {
  data: any[];
  filterProgram: string;
  filterPeriode: string;
  availablePrograms: string[];
  availablePeriodes: string[];
}

export function LaporanClient({
  data,
  filterProgram,
  filterPeriode,
  availablePrograms,
  availablePeriodes,
}: LaporanClientProps) {
  const router = useRouter();

  // ── Ringkasan Data ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = data.length;
    const tersalurkan = data.filter((d) => d.status === "tersalurkan").length;
    const belum = total - tersalurkan;
    const persentase =
      total === 0 ? 0 : Math.round((tersalurkan / total) * 100);
    const totalNilai = data
      .filter((d) => d.status === "tersalurkan")
      .reduce((acc, curr) => acc + (curr.jumlah_bantuan || 0), 0);

    return { total, tersalurkan, belum, persentase, totalNilai };
  }, [data]);

  // ── Handler Filter ───────────────────────────────────────────────────────
  const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const program = formData.get("program") as string;
    const periode = formData.get("periode") as string;

    const params = new URLSearchParams();
    if (program && program !== "semua") params.set("program", program);
    if (periode && periode !== "semua") params.set("periode", periode);

    router.push(`/dashboard/bansos/laporan?${params.toString()}`);
  };

  // ── Handler Export ───────────────────────────────────────────────────────
  const exportData = data.map((d, index) => ({
    No: index + 1,
    "Nama KK": d.keluarga?.nama_kepala || "-",
    "Nomor KK": d.keluarga?.no_kk || "-",
    "RT/RW": `${d.keluarga?.rt || "-"}/${d.keluarga?.rw || "-"}`,
    "Jumlah (Rp)": d.jumlah_bantuan || 0,
    Status: d.status === "tersalurkan" ? "Tersalurkan" : "Belum Tersalurkan",
    "Tgl Tersalurkan":
      d.status === "tersalurkan" && d.updated_at
        ? new Date(d.updated_at).toLocaleDateString("id-ID")
        : "-",
  }));

  const handleExportExcel = () => {
    if (data.length === 0) return alert("Tidak ada data untuk diekspor");

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Bansos");

    const fileName = `Laporan_Bansos_${filterProgram}_${filterPeriode}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return alert("Tidak ada data untuk diekspor");

    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("LAPORAN PENYALURAN BANTUAN SOSIAL", 14, 20);

    doc.setFontSize(10);
    doc.text(
      `Program: ${filterProgram === "semua" ? "Semua Program" : filterProgram}`,
      14,
      30,
    );
    doc.text(
      `Periode: ${filterPeriode === "semua" ? "Semua Periode" : filterPeriode}`,
      14,
      36,
    );
    doc.text(
      `Total Penyaluran: Rp ${new Intl.NumberFormat("id-ID").format(stats.totalNilai)}`,
      14,
      42,
    );

    const tableColumn = [
      "No",
      "Nama KK",
      "Nomor KK",
      "RT/RW",
      "Jumlah",
      "Status",
      "Tgl. Tersalurkan",
    ];
    const tableRows = exportData.map((row) => [
      row.No,
      row["Nama KK"],
      row["Nomor KK"],
      row["RT/RW"],
      `Rp ${new Intl.NumberFormat("id-ID").format(row["Jumlah (Rp)"])}`,
      row.Status,
      row["Tgl Tersalurkan"],
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 125, 50] }, // Tailwind green-800
    });

    const fileName = `Laporan_Bansos_${filterProgram}_${filterPeriode}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Bansos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Lihat dan unduh laporan penyaluran bantuan sosial.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form
          onSubmit={handleFilterChange}
          className="flex flex-col md:flex-row items-end gap-4"
        >
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Program Bansos
            </label>
            <select
              name="program"
              defaultValue={filterProgram}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm bg-white"
            >
              <option value="semua">Semua Program</option>
              {availablePrograms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Periode
            </label>
            <select
              name="periode"
              defaultValue={filterPeriode}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm bg-white"
            >
              <option value="semua">Semua Periode</option>
              {availablePeriodes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Tampilkan Laporan
          </button>
        </form>
      </div>

      {/* Konten Laporan (Jika ada filter atau default) */}
      <div className="space-y-6">
        {/* Tombol Export */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <FileText className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-gray-500 text-sm">
                Total Penerima
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total} KK</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-gray-500 text-sm">
                Sudah Tersalurkan
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.tersalurkan} KK{" "}
              <span className="text-sm font-medium text-gray-400 ml-1">
                ({stats.persentase}%)
              </span>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-gray-500 text-sm">
                Belum Tersalurkan
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.belum} KK{" "}
              <span className="text-sm font-medium text-gray-400 ml-1">
                ({stats.total > 0 ? 100 - stats.persentase : 0}%)
              </span>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-gray-500 text-sm">
                Total Nilai Tersalurkan
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              Rp {new Intl.NumberFormat("id-ID").format(stats.totalNilai)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700">Progress Penyaluran</h3>
            <span className="text-sm font-bold text-green-600">
              {stats.persentase}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="bg-green-500 h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${stats.persentase}%` }}
            ></div>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama KK</th>
                  <th className="px-6 py-4">Nomor KK</th>
                  <th className="px-6 py-4">RT/RW</th>
                  <th className="px-6 py-4 text-right">Jumlah</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Tgl Tersalurkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Tidak ada data yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.keluarga?.nama_kepala || "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500">
                        {item.keluarga?.no_kk || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {item.keluarga?.rt || "-"}/{item.keluarga?.rw || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          item.jumlah_bantuan || 0,
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            item.status === "tersalurkan"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {item.status === "tersalurkan"
                            ? "Tersalurkan"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === "tersalurkan" && item.updated_at
                          ? new Date(item.updated_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
