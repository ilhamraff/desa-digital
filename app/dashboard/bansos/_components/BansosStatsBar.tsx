"use client";

interface BansosStatsBarProps {
  totalProgramAktif: number;
  totalPenerima: number;
  tersalurkan: number;
  menunggu: number;
}

const STAT_ITEMS = [
  {
    key: "totalProgramAktif" as const,
    label: "Program Aktif",
    valueClass: "text-green-600",
  },
  {
    key: "totalPenerima" as const,
    label: "Total Penerima",
    valueClass: "text-gray-900",
  },
  {
    key: "tersalurkan" as const,
    label: "Tersalurkan",
    valueClass: "text-emerald-600",
  },
  {
    key: "menunggu" as const,
    label: "Menunggu Penyaluran",
    valueClass: "text-amber-500",
  },
];

export function BansosStatsBar(props: BansosStatsBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex divide-x divide-gray-100">
        {STAT_ITEMS.map(({ key, label, valueClass }) => (
          <div
            key={key}
            className="flex-1 flex flex-col items-center justify-center py-4 px-3 min-w-0"
          >
            <span
              className={`text-3xl font-bold tabular-nums leading-none ${valueClass}`}
            >
              {props[key]}
            </span>
            <span className="text-xs text-gray-400 mt-1.5 text-center leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
