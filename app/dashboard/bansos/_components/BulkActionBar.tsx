"use client";

import { CheckCircle2, Trash2, XCircle } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onTersalurkan: () => void;
  onHapus: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  onTersalurkan,
  onHapus,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-3 flex items-center gap-3 bg-green-950 text-white px-4 py-3 rounded-xl shadow-lg">
      <span className="text-sm font-medium flex-1">
        <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-md mr-2">
          {selectedCount}
        </span>
        penerima dipilih
      </span>

      <button
        onClick={onTersalurkan}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-500 hover:bg-green-400 text-white rounded-lg transition-colors"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Tandai Tersalurkan
      </button>

      <button
        onClick={onHapus}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Hapus Terpilih
      </button>

      <button
        onClick={onClear}
        title="Batalkan pilihan"
        className="p-1.5 text-white/60 hover:text-white rounded-lg transition-colors"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
