import { createClient } from "@/lib/supabase/server";

export async function RecentSuratTable() {
  const supabase = await createClient();

  const { data: suratTerbaru } = await supabase
    .from("surat")
    .select("id, jenis_surat, created_at, status, profiles(nama)")
    .order("created_at", { ascending: false })
    .limit(5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 inline-flex text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full w-fit">Pending</span>;
      case "diproses":
        return <span className="px-2.5 py-1 inline-flex text-xs font-medium bg-blue-100 text-blue-800 rounded-full w-fit">Diproses</span>;
      case "selesai":
        return <span className="px-2.5 py-1 inline-flex text-xs font-medium bg-green-100 text-green-800 rounded-full w-fit">Selesai</span>;
      case "ditolak":
        return <span className="px-2.5 py-1 inline-flex text-xs font-medium bg-red-100 text-red-800 rounded-full w-fit">Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 inline-flex text-xs font-medium bg-gray-100 text-gray-800 rounded-full w-fit">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col items-stretch">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Surat Terbaru</h2>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b border-gray-100 text-gray-500">
            <tr>
              <th className="pb-3 font-medium">Pemohon</th>
              <th className="pb-3 font-medium">Jenis Surat</th>
              <th className="pb-3 font-medium">Tanggal</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {suratTerbaru && suratTerbaru.length > 0 ? (
              suratTerbaru.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="py-4 pr-4">
                    {s.profiles ? String((s.profiles as any).nama) : "-"}
                  </td>
                  <td className="py-4 pr-4">{s.jenis_surat}</td>
                  <td className="py-4 pr-4">{formatDate(s.created_at)}</td>
                  <td className="py-4">{getStatusBadge(s.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">Belum ada permohonan surat.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-50 p-6 animate-pulse">
      <div className="h-6 bg-gray-100 rounded w-40 mb-8" />
      <div className="space-y-6">
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="flex gap-4">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
