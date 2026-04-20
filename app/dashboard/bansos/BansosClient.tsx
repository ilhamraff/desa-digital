"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import {
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  HandHeart,
  Package,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { formatRupiah } from "@/lib/utils";
import {
  BansosWithRelations,
  ProgramSummary,
} from "./_components/bansos.types";
import { ProgramCard } from "./_components/ProgramCard";
import { StatusBadge } from "@/components/StatusBadge";
import { BansosStatsBar } from "./_components/BansosStatsBar";
import { BansosFilters } from "./_components/BansosFilters";

interface BansosClientProps {
  initialData: BansosWithRelations[];
  programs: ProgramSummary[];
}

// ── Main Client Component ─────────────────────────────────────────────────────

export default function BansosClient({
  initialData,
  programs,
}: BansosClientProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Data state
  const [data, setData] = useState<BansosWithRelations[]>(initialData);

  // Filter state
  const [filterProgram, setFilterProgram] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [deleteTarget, setDeleteTarget] = useState<BansosWithRelations | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading per-row status update
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // ── Bulk selection state ────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<
    "tersalurkan" | "hapus" | null
  >(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // ── Derived: program names for dropdown ────────────────────────────────────
  const uniquePrograms = useMemo(
    () => [...new Set(data.map((d) => d.nama_program))],
    [data],
  );

  // ── Stats summary (reaktif: update otomatis saat status diubah) ────────────
  const stats = useMemo(
    () => ({
      totalProgramAktif: programs.filter((p) => p.aktif).length,
      totalPenerima: data.length,
      tersalurkan: data.filter((d) => d.status === "tersalurkan").length,
      menunggu: data.filter((d) => d.status === "pending").length,
    }),
    [data, programs],
  );

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchProgram =
        filterProgram === "semua" || item.nama_program === filterProgram;
      const matchStatus =
        filterStatus === "semua" || item.status === filterStatus;
      const matchSearch =
        !searchTerm ||
        (item.keluarga?.nama_kepala ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.keluarga?.no_kk ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchProgram && matchStatus && matchSearch;
    });
  }, [data, filterProgram, filterStatus, searchTerm]);

  // ── Derived: selection helpers ────────────────────────────────────────────
  const selectedCount = selectedIds.size;
  const allVisibleIds = useMemo(
    () => filteredData.map((d) => d.id),
    [filteredData],
  );
  const isAllSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.has(id));
  const isIndeterminate =
    !isAllSelected && allVisibleIds.some((id) => selectedIds.has(id));

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (allVisibleIds.every((id) => prev.has(id))) {
        // semua sudah dipilih → deselect semua
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      }
      // pilih semua yang tampil
      return new Set([...prev, ...allVisibleIds]);
    });
  }, [allVisibleIds]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleLihatPenerima = useCallback((namaProgram: string) => {
    setFilterProgram(namaProgram);
    setSelectedIds(new Set()); // reset selection saat filter berubah
    document
      .getElementById("tabel-penerima")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Bulk actions ─────────────────────────────────────────────────────────

  const handleBulkTersalurkan = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setIsBulkLoading(true);

    const { error } = await supabase
      .from("bansos")
      .update({ status: "tersalurkan", updated_at: new Date().toISOString() })
      .in("id", ids);

    if (error) {
      showToast(
        "error",
        "Gagal bulk update",
        "Terjadi kesalahan saat memperbarui status.",
      );
    } else {
      setData((prev) =>
        prev.map((d) =>
          ids.includes(d.id) ? { ...d, status: "tersalurkan" } : d,
        ),
      );
      setSelectedIds(new Set());
      showToast(
        "success",
        "Berhasil Tersalurkan",
        `${ids.length} penerima berhasil ditandai tersalurkan.`,
      );
    }

    setIsBulkLoading(false);
    setBulkConfirm(null);
  }, [selectedIds, supabase, showToast]);

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setIsBulkLoading(true);

    const { error } = await supabase.from("bansos").delete().in("id", ids);

    if (error) {
      showToast(
        "error",
        "Gagal menghapus",
        "Terjadi kesalahan saat menghapus data.",
      );
    } else {
      startTransition(() => {
        setData((prev) => prev.filter((d) => !ids.includes(d.id)));
      });
      setSelectedIds(new Set());
      showToast(
        "success",
        "Data Dihapus",
        `${ids.length} penerima berhasil dihapus dari sistem.`,
      );
    }

    setIsBulkLoading(false);
    setBulkConfirm(null);
  }, [selectedIds, supabase, showToast, startTransition]);

  const handleUpdateStatus = useCallback(
    async (item: BansosWithRelations, newStatus: "pending" | "tersalurkan") => {
      setUpdatingIds((prev) => new Set(prev).add(item.id));

      const { error } = await supabase
        .from("bansos")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", item.id);

      if (error) {
        showToast(
          "error",
          "Gagal memperbarui status",
          "Terjadi kesalahan saat memperbarui status penyaluran.",
        );
      } else {
        setData((prev) =>
          prev.map((d) => (d.id === item.id ? { ...d, status: newStatus } : d)),
        );
        showToast(
          "success",
          newStatus === "tersalurkan"
            ? "Bantuan Tersalurkan"
            : "Status Dibatalkan",
          newStatus === "tersalurkan"
            ? `Bantuan untuk ${item.keluarga?.nama_kepala ?? "-"} berhasil ditandai tersalurkan.`
            : `Status penyaluran untuk ${item.keluarga?.nama_kepala ?? "-"} berhasil dibatalkan.`,
        );
      }

      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    },
    [supabase, showToast],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from("bansos")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      showToast(
        "error",
        "Gagal menghapus",
        "Terjadi kesalahan saat menghapus data penerima.",
      );
    } else {
      startTransition(() => {
        setData((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      });
      showToast(
        "success",
        "Data Dihapus",
        `Data penerima berhasil dihapus dari sistem.`,
      );
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  }, [deleteTarget, supabase, showToast]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <ToastContainer />

      <div className="space-y-8 pb-10">
        {/* ── SECTION 1: Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manajemen Bantuan Sosial
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{data.length} penerima terdaftar</span>
            </p>
          </div>
          <button className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4" />
            Tambah Program
          </button>
        </div>

        {/* ── Stats Bar ─────────────────────────────────────────────────── */}
        <BansosStatsBar
          totalProgramAktif={stats.totalProgramAktif}
          totalPenerima={stats.totalPenerima}
          tersalurkan={stats.tersalurkan}
          menunggu={stats.menunggu}
        />

        {/* ── SECTION 1: Program Cards ─────────────────────────────────── */}
        {programs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              Belum ada program bansos
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Klik &quot;Tambah Program&quot; untuk memulai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((program) => (
              <ProgramCard
                key={program.nama_program}
                program={program}
                isSelected={filterProgram === program.nama_program}
                onLihatPenerima={handleLihatPenerima}
              />
            ))}
          </div>
        )}

        {/* ── SECTION 2: Tabel Penerima ─────────────────────────────────── */}
        <div id="tabel-penerima" className="scroll-mt-6">
          {/* Table header: filters + search */}
          <BansosFilters
            filterProgram={filterProgram}
            filterStatus={filterStatus}
            searchTerm={searchTerm}
            uniquePrograms={uniquePrograms}
            filteredCount={filteredData.length}
            totalCount={data.length}
            onFilterProgram={setFilterProgram}
            onFilterStatus={setFilterStatus}
            onSearch={setSearchTerm}
            onReset={() => {
              setFilterProgram("semua");
              setFilterStatus("semua");
              setSearchTerm("");
            }}
          />

          {/* Bulk Action Bar (muncul saat ada baris dipilih) */}
          {selectedCount > 0 && (
            <div className="mx-0 mb-3 flex items-center gap-3 bg-green-950 text-white px-4 py-3 rounded-xl shadow-lg">
              <span className="text-sm font-medium flex-1">
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-md mr-2">
                  {selectedCount}
                </span>
                penerima dipilih
              </span>
              <button
                onClick={() => setBulkConfirm("tersalurkan")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-400 text-white rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tandai Tersalurkan
              </button>
              <button
                onClick={() => setBulkConfirm("hapus")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                title="Batalkan pilihan"
                className="p-1.5 text-white/60 hover:text-white rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Table */}
          <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#166534] text-white">
                  <tr>
                    {/* Checkbox select-all */}
                    <th className="px-3 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate;
                        }}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded accent-green-400 cursor-pointer"
                        aria-label="Pilih semua"
                      />
                    </th>
                    <th className="px-4 py-4 font-medium w-10">No</th>
                    <th className="px-4 py-4 font-medium">Nama Kepala KK</th>
                    <th className="px-4 py-4 font-medium">Nomor KK</th>
                    <th className="px-4 py-4 font-medium">Program</th>
                    <th className="px-4 py-4 font-medium">Jumlah Bantuan</th>
                    <th className="px-4 py-4 font-medium">Periode</th>
                    <th className="px-4 py-4 font-medium">Status</th>
                    <th className="px-4 py-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-14 text-center text-gray-400"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                            <Search className="w-7 h-7 text-gray-300" />
                          </div>
                          <p className="font-medium text-gray-500">
                            Tidak ada data ditemukan
                          </p>
                          <p className="text-sm">
                            Coba ubah filter atau kata kunci pencarian.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => {
                      const isUpdating = updatingIds.has(item.id);
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors duration-150 ${
                            isSelected
                              ? "bg-green-50 border-l-2 border-l-green-500"
                              : "odd:bg-white even:bg-gray-50/60 hover:bg-green-50/40"
                          }`}
                        >
                          {/* Checkbox column */}
                          <td className="px-3 py-3.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(item.id)}
                              className="w-4 h-4 rounded accent-green-600 cursor-pointer"
                              aria-label={`Pilih ${item.keluarga?.nama_kepala ?? item.id}`}
                            />
                          </td>
                          <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                            {item.keluarga?.nama_kepala ?? "-"}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-gray-600 whitespace-nowrap">
                            {item.keluarga?.no_kk ?? "-"}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                              <HandHeart className="w-3 h-3" />
                              {item.nama_program}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-green-700 whitespace-nowrap">
                            {formatRupiah(item.jumlah_bantuan)}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                            {item.periode}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.status === "pending" ? (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(item, "tersalurkan")
                                  }
                                  disabled={isUpdating}
                                  title="Tandai Tersalurkan"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isUpdating ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Tersalurkan
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(item, "pending")
                                  }
                                  disabled={isUpdating}
                                  title="Batalkan Penyaluran"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isUpdating ? (
                                    <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                  )}
                                  Batalkan
                                </button>
                              )}

                              <button
                                onClick={() => setDeleteTarget(item)}
                                title="Hapus"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer summary */}
            {filteredData.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>
                  Total{" "}
                  <span className="font-semibold text-gray-700">
                    {filteredData.length}
                  </span>{" "}
                  penerima
                </span>
                <span>
                  Tersalurkan:{" "}
                  <span className="font-semibold text-green-700">
                    {
                      filteredData.filter((d) => d.status === "tersalurkan")
                        .length
                    }
                  </span>{" "}
                  &bull; Menunggu:{" "}
                  <span className="font-semibold text-yellow-600">
                    {filteredData.filter((d) => d.status === "pending").length}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirm Modal: single delete ──────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Data Penerima"
        message={`Apakah Anda yakin ingin menghapus data penerima "${deleteTarget?.keluarga?.nama_kepala ?? "-"}" dari program "${deleteTarget?.nama_program}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

      {/* ── Confirm Modal: bulk tandai tersalurkan ────────────────────────── */}
      <ConfirmModal
        isOpen={bulkConfirm === "tersalurkan"}
        title="Konfirmasi Bulk Update"
        message={`Tandai ${selectedCount} penerima sebagai sudah tersalurkan? Status akan diperbarui sekaligus di database.`}
        confirmLabel={`Tandai ${selectedCount} Penerima`}
        confirmVariant="primary"
        isLoading={isBulkLoading}
        onConfirm={handleBulkTersalurkan}
        onCancel={() => {
          if (!isBulkLoading) setBulkConfirm(null);
        }}
      />

      {/* ── Confirm Modal: bulk hapus ─────────────────────────────────────── */}
      <ConfirmModal
        isOpen={bulkConfirm === "hapus"}
        title="Hapus Massal"
        message={`Anda akan menghapus ${selectedCount} data penerima sekaligus. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={`Hapus ${selectedCount} Data`}
        confirmVariant="danger"
        isLoading={isBulkLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => {
          if (!isBulkLoading) setBulkConfirm(null);
        }}
      />

      {/* Suppress unused isPending warning */}
      {isPending && null}
    </>
  );
}
