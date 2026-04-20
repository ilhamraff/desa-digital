"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { Users, Plus, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { BansosWithRelations, ProgramSummary } from "./_components/bansos.types";
import { BansosStatsBar } from "./_components/BansosStatsBar";
import { BansosFilters } from "./_components/BansosFilters";
import { BulkActionBar } from "./_components/BulkActionBar";
import { PenerimaTable } from "./_components/PenerimaTable";
import { ProgramCard } from "./_components/ProgramCard";

interface BansosClientProps {
  initialData: BansosWithRelations[];
  programs: ProgramSummary[];
}

export default function BansosClient({ initialData, programs }: BansosClientProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // ── State ────────────────────────────────────────────────────────────────
  const [data, setData] = useState<BansosWithRelations[]>(initialData);
  const [filterProgram, setFilterProgram] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BansosWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<"tersalurkan" | "hapus" | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const uniquePrograms = useMemo(
    () => [...new Set(data.map((d) => d.nama_program))],
    [data],
  );

  const stats = useMemo(
    () => ({
      totalProgramAktif: programs.filter((p) => p.aktif).length,
      totalPenerima: data.length,
      tersalurkan: data.filter((d) => d.status === "tersalurkan").length,
      menunggu: data.filter((d) => d.status === "pending").length,
    }),
    [data, programs],
  );

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchProgram = filterProgram === "semua" || item.nama_program === filterProgram;
      const matchStatus = filterStatus === "semua" || item.status === filterStatus;
      const matchSearch =
        !searchTerm ||
        (item.keluarga?.nama_kepala ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.keluarga?.no_kk ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchProgram && matchStatus && matchSearch;
    });
  }, [data, filterProgram, filterStatus, searchTerm]);

  const selectedCount = selectedIds.size;
  const allVisibleIds = useMemo(() => filteredData.map((d) => d.id), [filteredData]);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const isIndeterminate = !isAllSelected && allVisibleIds.some((id) => selectedIds.has(id));

  // ── Selection handlers ───────────────────────────────────────────────────
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
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...allVisibleIds]);
    });
  }, [allVisibleIds]);

  const handleLihatPenerima = useCallback((namaProgram: string) => {
    setFilterProgram(namaProgram);
    setSelectedIds(new Set());
    document.getElementById("tabel-penerima")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleReset = useCallback(() => {
    setFilterProgram("semua");
    setFilterStatus("semua");
    setSearchTerm("");
  }, []);

  // ── Single row actions ───────────────────────────────────────────────────
  const handleUpdateStatus = useCallback(
    async (item: BansosWithRelations, newStatus: "pending" | "tersalurkan") => {
      setUpdatingIds((prev) => new Set(prev).add(item.id));

      const { error } = await supabase
        .from("bansos")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", item.id);

      if (error) {
        showToast("error", "Gagal memperbarui status", "Terjadi kesalahan saat memperbarui status penyaluran.");
      } else {
        setData((prev) => prev.map((d) => (d.id === item.id ? { ...d, status: newStatus } : d)));
        showToast(
          "success",
          newStatus === "tersalurkan" ? "Bantuan Tersalurkan" : "Status Dibatalkan",
          newStatus === "tersalurkan"
            ? `Bantuan untuk ${item.keluarga?.nama_kepala ?? "-"} berhasil ditandai tersalurkan.`
            : `Status penyaluran untuk ${item.keluarga?.nama_kepala ?? "-"} berhasil dibatalkan.`,
        );
      }

      setUpdatingIds((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
    },
    [supabase, showToast],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const { error } = await supabase.from("bansos").delete().eq("id", deleteTarget.id);

    if (error) {
      showToast("error", "Gagal menghapus", "Terjadi kesalahan saat menghapus data penerima.");
    } else {
      startTransition(() => setData((prev) => prev.filter((d) => d.id !== deleteTarget.id)));
      showToast("success", "Data Dihapus", "Data penerima berhasil dihapus dari sistem.");
    }

    setIsDeleting(false);
    setDeleteTarget(null);
  }, [deleteTarget, supabase, showToast, startTransition]);

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
      showToast("error", "Gagal bulk update", "Terjadi kesalahan saat memperbarui status.");
    } else {
      setData((prev) => prev.map((d) => (ids.includes(d.id) ? { ...d, status: "tersalurkan" } : d)));
      setSelectedIds(new Set());
      showToast("success", "Berhasil Tersalurkan", `${ids.length} penerima berhasil ditandai tersalurkan.`);
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
      showToast("error", "Gagal menghapus", "Terjadi kesalahan saat menghapus data.");
    } else {
      startTransition(() => setData((prev) => prev.filter((d) => !ids.includes(d.id))));
      setSelectedIds(new Set());
      showToast("success", "Data Dihapus", `${ids.length} penerima berhasil dihapus dari sistem.`);
    }

    setIsBulkLoading(false);
    setBulkConfirm(null);
  }, [selectedIds, supabase, showToast, startTransition]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer />

      <div className="space-y-8 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Bantuan Sosial</h1>
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

        {/* Stats Bar */}
        <BansosStatsBar {...stats} />

        {/* Program Cards */}
        {programs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum ada program bansos</p>
            <p className="text-sm text-gray-400 mt-1">Klik &quot;Tambah Program&quot; untuk memulai.</p>
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

        {/* Tabel Penerima */}
        <div id="tabel-penerima" className="scroll-mt-6">
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
            onReset={handleReset}
          />

          <BulkActionBar
            selectedCount={selectedCount}
            onTersalurkan={() => setBulkConfirm("tersalurkan")}
            onHapus={() => setBulkConfirm("hapus")}
            onClear={() => setSelectedIds(new Set())}
          />

          <PenerimaTable
            filteredData={filteredData}
            selectedIds={selectedIds}
            updatingIds={updatingIds}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onToggleAll={toggleAll}
            onToggleRow={toggleRow}
            onUpdateStatus={handleUpdateStatus}
            onDeleteRow={setDeleteTarget}
          />
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Data Penerima"
        message={`Apakah Anda yakin ingin menghapus data penerima "${deleteTarget?.keluarga?.nama_kepala ?? "-"}" dari program "${deleteTarget?.nama_program}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => { if (!isDeleting) setDeleteTarget(null); }}
      />

      <ConfirmModal
        isOpen={bulkConfirm === "tersalurkan"}
        title="Konfirmasi Bulk Update"
        message={`Tandai ${selectedCount} penerima sebagai sudah tersalurkan? Status akan diperbarui sekaligus di database.`}
        confirmLabel={`Tandai ${selectedCount} Penerima`}
        confirmVariant="primary"
        isLoading={isBulkLoading}
        onConfirm={handleBulkTersalurkan}
        onCancel={() => { if (!isBulkLoading) setBulkConfirm(null); }}
      />

      <ConfirmModal
        isOpen={bulkConfirm === "hapus"}
        title="Hapus Massal"
        message={`Anda akan menghapus ${selectedCount} data penerima sekaligus. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={`Hapus ${selectedCount} Data`}
        confirmVariant="danger"
        isLoading={isBulkLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => { if (!isBulkLoading) setBulkConfirm(null); }}
      />

      {isPending && null}
    </>
  );
}
