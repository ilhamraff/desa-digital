"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Plus, Package, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import {
  BansosWithRelations,
  ProgramSummary,
} from "./_components/bansos.types";
import { BansosStatsBar } from "./_components/BansosStatsBar";
import { BansosFilters } from "./_components/BansosFilters";
import { BulkActionBar } from "./_components/BulkActionBar";
import { PenerimaTable } from "./_components/PenerimaTable";
import { ProgramCard } from "./_components/ProgramCard";
import { FormPenerimaBansos } from "./_components/FormPenerimaBansos";
import { FormProgramBansos } from "./_components/FormProgramBansos";

interface BansosClientProps {
  initialData: BansosWithRelations[];
  programs: ProgramSummary[];
}

export default function BansosClient({
  initialData,
  programs,
}: BansosClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // ── State ────────────────────────────────────────────────────────────────
  const [data, setData] = useState<BansosWithRelations[]>(initialData);
  const [localPrograms, setLocalPrograms] =
    useState<ProgramSummary[]>(programs);

  // Sync data saat server component me-refetch props (router.refresh)
  useEffect(() => {
    setData(initialData);
    setLocalPrograms((prev) => {
      const newMap = new Map<string, ProgramSummary>();
      programs.forEach((p) => newMap.set(p.nama_program, p));

      // Pertahankan program lokal yang baru ditambahkan (belum ada di server karena belum ada penerima)
      prev.forEach((p) => {
        if (!newMap.has(p.nama_program)) {
          newMap.set(p.nama_program, p);
        }
      });
      return Array.from(newMap.values());
    });
  }, [initialData, programs]);

  const [filterProgram, setFilterProgram] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BansosWithRelations | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<
    "tersalurkan" | "hapus" | null
  >(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDefaultProgram, setAddModalDefaultProgram] = useState<
    string | undefined
  >(undefined);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editProgramData, setEditProgramData] = useState<ProgramSummary | null>(
    null,
  );

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
      // Sembunyikan row definisi program (yang penerima_id-nya null) dari tabel
      if (!item.penerima_id) return false;

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

  const handleOpenAddProgramModal = useCallback(() => {
    setEditProgramData(null);
    setIsProgramModalOpen(true);
  }, []);

  const handleOpenEditProgramModal = useCallback((program: ProgramSummary) => {
    setEditProgramData(program);
    setIsProgramModalOpen(true);
  }, []);

  const handleProgramSubmit = useCallback(
    async (data: any) => {
      if (data.original_nama) {
        // Mode Edit: Update SEMUA baris di tabel bansos yang memiliki nama program lama
        const updatePayload: any = {
          catatan: data.catatan,
          jumlah_bantuan: data.jumlah_bantuan || 0,
          status: data.aktif ? "pending" : "tersalurkan",
          periode: data.periode,
        };

        if (data.original_nama !== data.nama_program) {
          updatePayload.nama_program = data.nama_program;
        }

        const { error } = await supabase
          .from("bansos")
          .update(updatePayload)
          .eq("nama_program", data.original_nama);

        if (error) throw error;

        // Update local state untuk card
        setLocalPrograms((prev) =>
          prev.map((p) =>
            p.nama_program === data.original_nama
              ? {
                  ...p,
                  nama_program: data.nama_program,
                  catatan: data.catatan,
                  jumlah_bantuan: data.jumlah_bantuan || 0,
                  aktif: data.aktif,
                  periode: data.periode,
                }
              : p,
          ),
        );
      } else {
        // TAMBAH PROGRAM
        // Masukkan row program baru ke tabel bansos (dengan penerima_id null)
        const { error } = await supabase.from("bansos").insert({
          nama_program: data.nama_program,
          catatan: data.catatan,
          jumlah_bantuan: data.jumlah_bantuan || 0,
          status: data.aktif ? "pending" : "tersalurkan",
          periode: data.periode,
          penerima_id: null,
        });

        if (error) throw error;

        // Simpan di local state agar langsung muncul sebagai card
        setLocalPrograms((prev) => [
          {
            nama_program: data.nama_program,
            catatan: data.catatan,
            jumlah_bantuan: data.jumlah_bantuan || 0,
            aktif: data.aktif,
            total_penerima: 0,
            periode: data.periode,
          },
          ...prev,
        ]);
      }

      setIsProgramModalOpen(false);
      showToast(
        "success",
        data.original_nama ? "Program Diperbarui" : "Program Disimpan",
        data.original_nama
          ? "Data program bansos berhasil diperbarui."
          : "Data program bansos akan muncul setelah ada penerima yang didaftarkan.",
      );
      startTransition(() => {
        router.refresh();
      });
    },
    [supabase, router, showToast],
  );

  const handleOpenAddModal = useCallback((programName?: string) => {
    setAddModalDefaultProgram(programName);
    setIsAddModalOpen(true);
  }, []);

  const handleAddSuccess = useCallback(() => {
    setIsAddModalOpen(false);
    showToast(
      "success",
      "Berhasil Ditambahkan",
      "Penerima bansos baru berhasil ditambahkan.",
    );
    startTransition(() => {
      router.refresh();
    });
  }, [router, showToast]);

  const handleLihatPenerima = useCallback(
    (namaProgram: string) => {
      // Jika program lokal belum memiliki penerima, tampilkan toast
      const programExistsInData = data.some(
        (d) => d.nama_program === namaProgram,
      );
      if (!programExistsInData) {
        showToast(
          "warning",
          "Belum Ada Data",
          "Program ini belum memiliki data penerima.",
        );
        return;
      }

      setFilterProgram(namaProgram);
      setSelectedIds(new Set());
      document
        .getElementById("tabel-penerima")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [data, showToast],
  );

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
      startTransition(() =>
        setData((prev) => prev.filter((d) => d.id !== deleteTarget.id)),
      );
      showToast(
        "success",
        "Data Dihapus",
        "Data penerima berhasil dihapus dari sistem.",
      );
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
      startTransition(() =>
        setData((prev) => prev.filter((d) => !ids.includes(d.id))),
      );
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer />

      <div className="space-y-8 pb-10">
        {/* Header */}
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
          <div className="flex gap-2">
            <Link
              href="/dashboard/bansos/laporan"
              className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm border border-blue-200"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Laporan</span>
            </Link>
            <button
              onClick={handleOpenAddProgramModal}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Program</span>
            </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Penerima
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <BansosStatsBar {...stats} />

        {/* Program Cards */}
        {localPrograms.length === 0 ? (
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
            {localPrograms.map((program) => (
              <ProgramCard
                key={program.nama_program}
                program={program}
                isSelected={filterProgram === program.nama_program}
                onLihatPenerima={handleLihatPenerima}
                onAddPenerima={handleOpenAddModal}
                onEditProgram={handleOpenEditProgramModal}
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
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

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

      <FormPenerimaBansos
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        defaultProgram={addModalDefaultProgram}
        programs={localPrograms.map((p) => p.nama_program)} // Provide full local programs array
      />

      <FormProgramBansos
        isOpen={isProgramModalOpen}
        onClose={() => setIsProgramModalOpen(false)}
        onSubmit={handleProgramSubmit}
        initialData={editProgramData}
      />

      {isPending && null}
    </>
  );
}
