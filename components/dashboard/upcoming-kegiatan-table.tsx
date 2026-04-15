import { createClient } from "@/lib/supabase/server";

export async function UpcomingKegiatanTable() {
  const supabase = await createClient();

  const now = new Date();
  const todayDate = now.toISOString().split("T")[0];

  const { data: kegiatanMendatang } = await supabase
    .from("kegiatan")
    .select("id, judul, tanggal, lokasi, kuota")
    .gte("tanggal", todayDate)
    .order("tanggal", { ascending: true })
    .limit(3);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col items-stretch">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Kegiatan Mendatang</h2>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b border-gray-100 text-gray-500">
            <tr>
              <th className="pb-3 font-medium">Judul</th>
              <th className="pb-3 font-medium">Tanggal</th>
              <th className="pb-3 font-medium">Lokasi</th>
              <th className="pb-3 font-medium text-right">Kuota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {kegiatanMendatang && kegiatanMendatang.length > 0 ? (
              kegiatanMendatang.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50/50">
                  <td className="py-4 pr-4 font-medium text-gray-900">{k.judul}</td>
                  <td className="py-4 pr-4">{formatDate(k.tanggal)}</td>
                  <td className="py-4 pr-4 text-gray-500 truncate max-w-[150px]">{k.lokasi}</td>
                  <td className="py-4 text-right font-medium">{k.kuota}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">Tidak ada kegiatan dalam waktu dekat.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
