"use client";

import { useState } from "react";
import { CheckCircle2, HandHeart, Search, Trash2, XCircle } from "lucide-react";
import { BansosWithRelations, formatRupiah } from "./bansos.types";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmModal } from "@/components/ConfirmModal";

interface PenerimaTableProps {
  filteredData: BansosWithRelations[];
  selectedIds: Set<string>;
  updatingIds: Set<string>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onToggleAll: () => void;
  onToggleRow: (id: string) => void;
  onUpdateStatus: (
    item: BansosWithRelations,
    status: "pending" | "tersalurkan",
  ) => void;
  onDeleteRow: (item: BansosWithRelations) => void;
}

interface ConfirmAction {
  item: BansosWithRelations;
  newStatus: "pending" | "tersalurkan";
}

export function PenerimaTable({
  filteredData,
  selectedIds,
  updatingIds,
  isAllSelected,
  isIndeterminate,
  onToggleAll,
  onToggleRow,
  onUpdateStatus,
  onDeleteRow,
}: PenerimaTableProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmStatus = async () => {
    if (!confirmAction) return;
    setIsConfirming(true);
    await onUpdateStatus(confirmAction.item, confirmAction.newStatus);
    setIsConfirming(false);
    setConfirmAction(null);
  };

  return (
    <>
      {/* Card wrapper */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#166534] text-white">
              <tr>
                <th className="px-3 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={onToggleAll}
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
                      {/* Checkbox */}
                      <td className="px-3 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleRow(item.id)}
                          className="w-4 h-4 rounded accent-green-600 cursor-pointer"
                          aria-label={`Pilih ${item.keluarga?.nama_kepala ?? item.id}`}
                        />
                      </td>

                      {/* No */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">
                        {index + 1}
                      </td>

                      {/* Nama Kepala KK */}
                      <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                        {item.keluarga?.nama_kepala ?? "-"}
                      </td>

                      {/* Nomor KK */}
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {item.keluarga?.no_kk ?? "-"}
                      </td>

                      {/* Program badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          <HandHeart className="w-3 h-3" />
                          {item.nama_program}
                        </span>
                      </td>

                      {/* Jumlah Bantuan */}
                      <td className="px-4 py-3.5 font-semibold text-green-700 whitespace-nowrap">
                        {formatRupiah(item.jumlah_bantuan)}
                      </td>

                      {/* Periode */}
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                        {item.periode}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "pending" ? (
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  item,
                                  newStatus: "tersalurkan",
                                })
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
                                setConfirmAction({ item, newStatus: "pending" })
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
                            onClick={() => onDeleteRow(item)}
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
        {/* /overflow-x-auto */}

        {/* Footer summary */}
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
                {filteredData.filter((d) => d.status === "tersalurkan").length}
              </span>{" "}
              • Menunggu:{" "}
              <span className="font-semibold text-yellow-600">
                {filteredData.filter((d) => d.status === "pending").length}
              </span>
            </span>
          </div>
        )}
      </div>
      {/* /outer card */}

      {/* Confirm Modal: per-row status update */}
      <ConfirmModal
        isOpen={!!confirmAction}
        title={
          confirmAction?.newStatus === "tersalurkan"
            ? "Konfirmasi Penyaluran"
            : "Batalkan Penyaluran"
        }
        message={
          confirmAction?.newStatus === "tersalurkan"
            ? `Tandai bantuan untuk "${confirmAction?.item.keluarga?.nama_kepala ?? "-"}" sebagai sudah tersalurkan?`
            : `Batalkan status tersalurkan untuk "${confirmAction?.item.keluarga?.nama_kepala ?? "-"}"? Status akan dikembalikan ke menunggu.`
        }
        confirmLabel={
          confirmAction?.newStatus === "tersalurkan"
            ? "Ya, Tandai Tersalurkan"
            : "Ya, Batalkan"
        }
        confirmVariant={
          confirmAction?.newStatus === "tersalurkan" ? "primary" : "danger"
        }
        isLoading={isConfirming}
        onConfirm={handleConfirmStatus}
        onCancel={() => {
          if (!isConfirming) setConfirmAction(null);
        }}
      />
    </>
  );
}
