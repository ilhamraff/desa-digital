"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, Edit, 
  XCircle, Plus, Trash2, AlertTriangle, X, Search, Printer
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Kegiatan, PesertaKegiatan, Profile } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { ConfirmModal } from "@/components/ConfirmModal";

interface KegiatanDetailClientProps {
  kegiatan: Kegiatan;
  initialPeserta: PesertaKegiatan[];
}

export default function KegiatanDetailClient({ 
  kegiatan: initialKegiatan, 
  initialPeserta 
}: KegiatanDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [kegiatan, setKegiatan] = useState<Kegiatan>(initialKegiatan);
  const [peserta, setPeserta] = useState<PesertaKegiatan[]>(initialPeserta);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // States for Modals
  const [alasanBatal, setAlasanBatal] = useState("");
  const [wargaList, setWargaList] = useState<Profile[]>([]);
  const [selectedWargaId, setSelectedWargaId] = useState("");
  const [catatanPeserta, setCatatanPeserta] = useState("");
  const [searchWarga, setSearchWarga] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Load Warga data when Add Modal opens
  useEffect(() => {
    if (isAddModalOpen && wargaList.length === 0) {
      const fetchWarga = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "warga")
          .order("nama");
        if (data) setWargaList(data as Profile[]);
      };
      fetchWarga();
    }
  }, [isAddModalOpen, supabase, wargaList.length]);

  const kuota = kegiatan.kuota;
  const count = peserta.length;
  const isUnlimited = kuota === null || kuota === undefined;
  const percentage = isUnlimited ? 0 : (count / kuota!) * 100;
  const isFull = !isUnlimited && count >= kuota!;
  const isAlmostFull = !isUnlimited && !isFull && percentage >= 90;

  let progressColor = "bg-green-500";
  if (percentage >= 90) progressColor = "bg-red-500";
  else if (percentage >= 70) progressColor = "bg-yellow-500";

  // Actions
  const handleAddPeserta = async () => {
    if (!selectedWargaId) {
      showToast("error", "Error", "Pilih warga terlebih dahulu");
      return;
    }

    setIsAdding(true);
    const { data, error } = await supabase
      .from("peserta_kegiatan")
      .insert({
        kegiatan_id: kegiatan.id,
        warga_id: selectedWargaId,
        catatan: catatanPeserta || null,
      })
      .select("*, profiles(*)")
      .single();

    setIsAdding(false);

    if (error) {
      // Check for unique constraint error (23505)
      if (error.code === '23505') {
        showToast("error", "Gagal", "Warga sudah terdaftar di kegiatan ini");
      } else {
        showToast("error", "Gagal menambahkan peserta", error.message);
      }
    } else if (data) {
      setPeserta([...peserta, data as PesertaKegiatan]);
      setIsAddModalOpen(false);
      setSelectedWargaId("");
      setCatatanPeserta("");
      setSearchWarga("");
      showToast("success", "Berhasil", "Peserta berhasil ditambahkan");
    }
  };

  const handleDeletePeserta = async () => {
    if (!deleteTargetId) return;

    const { error } = await supabase
      .from("peserta_kegiatan")
      .delete()
      .eq("id", deleteTargetId);

    if (error) {
      showToast("error", "Gagal menghapus", error.message);
    } else {
      setPeserta(peserta.filter(p => p.id !== deleteTargetId));
      showToast("success", "Berhasil", "Peserta dihapus dari daftar");
    }
    setDeleteTargetId(null);
  };

  const handleCancelKegiatan = async () => {
    if (!alasanBatal.trim()) {
      showToast("error", "Error", "Alasan pembatalan wajib diisi");
      return;
    }

    const { error } = await supabase
      .from("kegiatan")
      .update({
        status: "dibatalkan",
        alasan_batal: alasanBatal
      })
      .eq("id", kegiatan.id);

    if (error) {
      showToast("error", "Gagal membatalkan", error.message);
    } else {
      setKegiatan({ ...kegiatan, status: "dibatalkan", alasan_batal: alasanBatal });
      setIsCancelModalOpen(false);
      showToast("success", "Kegiatan Dibatalkan", "Status kegiatan telah diperbarui");
    }
  };

  // Filter warga list
  const filteredWarga = wargaList.filter(w => 
    w.nama.toLowerCase().includes(searchWarga.toLowerCase()) || 
    (w.rt && w.rt.includes(searchWarga))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard/kegiatan"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Daftar Kegiatan
        </Link>
      </div>

      {/* SECTION 1 - INFO KEGIATAN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {kegiatan.judul}
                </h1>
                <StatusBadge status={kegiatan.status} />
              </div>
              <p className="text-gray-600 max-w-3xl leading-relaxed">
                {kegiatan.deskripsi || "Tidak ada deskripsi."}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                Cetak Daftar Hadir
              </button>
              <button
                onClick={() => router.push(`/dashboard/kegiatan/${kegiatan.id}/edit`)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Kegiatan
              </button>
              {kegiatan.status !== "dibatalkan" && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Batalkan Kegiatan
                </button>
              )}
            </div>
          </div>

          {/* Reason for cancellation (if cancelled) */}
          {kegiatan.status === "dibatalkan" && kegiatan.alasan_batal && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <span className="font-semibold block mb-1">Alasan Pembatalan:</span>
              {kegiatan.alasan_batal}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-y border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Tanggal</p>
                <p className="text-gray-900 font-medium mt-0.5">
                  {new Intl.DateTimeFormat("id-ID", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                  }).format(new Date(kegiatan.tanggal))}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Waktu</p>
                <p className="text-gray-900 font-medium mt-0.5">
                  {kegiatan.waktu_mulai?.slice(0, 5)} - {kegiatan.waktu_selesai?.slice(0, 5)} WIB
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Lokasi</p>
                <p className="text-gray-900 font-medium mt-0.5">{kegiatan.lokasi}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="w-full">
                <p className="text-sm text-gray-500 font-medium">Kuota Peserta</p>
                <p className="text-gray-900 font-medium mt-0.5">
                  {count} {kuota ? `/ ${kuota}` : "peserta"}
                </p>
                {!isUnlimited && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div 
                      className={`h-1.5 rounded-full ${progressColor}`} 
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {kegiatan.catatan_tambahan && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">
                Catatan untuk Peserta
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 italic text-sm">
                "{kegiatan.catatan_tambahan}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2 - DAFTAR PESERTA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            Peserta Terdaftar ({count} orang)
          </h2>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={isFull || kegiatan.status === "dibatalkan"}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#166534] text-white rounded-lg hover:bg-green-800 transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Tambah Peserta
          </button>
        </div>

        {/* Warning Banner if almost full */}
        {isAlmostFull && (
          <div className="bg-yellow-50 px-6 py-3 border-b border-yellow-100 flex items-center gap-2 text-yellow-800 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            ⚠️ Sisa kuota hanya {kuota! - count} tempat lagi!
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama Warga</th>
                <th className="px-6 py-4">RT / RW</th>
                <th className="px-6 py-4">No HP</th>
                <th className="px-6 py-4">Waktu Daftar</th>
                <th className="px-6 py-4">Catatan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {peserta.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Belum ada peserta terdaftar
                  </td>
                </tr>
              ) : (
                peserta.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{idx + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {p.profiles?.nama || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      {p.profiles?.rt && p.profiles?.rw 
                        ? `${p.profiles.rt} / ${p.profiles.rw}` 
                        : "-"}
                    </td>
                    <td className="px-6 py-4">{p.profiles?.no_hp || "-"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "2-digit", month: "short", year: "numeric", 
                        hour: "2-digit", minute: "2-digit"
                      }).format(new Date(p.waktu_daftar))}
                    </td>
                    <td className="px-6 py-4 text-gray-500 italic">
                      {p.catatan || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTargetId(p.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Hapus dari daftar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Hapus Peserta */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Hapus Peserta"
        message={`Apakah yakin ingin menghapus peserta ini dari daftar peserta? Kuota akan otomatis dikembalikan.`}
        confirmLabel="Hapus"
        confirmVariant="danger"
        onConfirm={handleDeletePeserta}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Modal Batalkan Kegiatan (Custom implementation because of input) */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Batalkan Kegiatan
              </h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                Status kegiatan akan diubah menjadi dibatalkan. Data peserta tidak akan dihapus sebagai arsip.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan Pembatalan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={alasanBatal}
                  onChange={(e) => setAlasanBatal(e.target.value)}
                  placeholder="Berikan alasan mengapa kegiatan ini dibatalkan..."
                  rows={3}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Kembali
              </button>
              <button
                onClick={handleCancelKegiatan}
                className="px-4 py-2 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700"
              >
                Konfirmasi Pembatalan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Peserta */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Tambah Peserta Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cari Warga
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchWarga}
                    onChange={(e) => setSearchWarga(e.target.value)}
                    placeholder="Ketik nama atau RT..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-gray-50">
                {filteredWarga.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Tidak ada warga yang ditemukan
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredWarga.map((w) => {
                      const isRegistered = peserta.some(p => p.warga_id === w.id);
                      return (
                        <label 
                          key={w.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-green-50 transition-colors ${
                            isRegistered ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="warga"
                            value={w.id}
                            disabled={isRegistered}
                            checked={selectedWargaId === w.id}
                            onChange={() => setSelectedWargaId(w.id)}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {w.nama} {isRegistered && "(Sudah Terdaftar)"}
                            </p>
                            <p className="text-xs text-gray-500">
                              RT {w.rt || "-"} / RW {w.rw || "-"}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Tambahan <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  value={catatanPeserta}
                  onChange={(e) => setCatatanPeserta(e.target.value)}
                  placeholder="Catatan dari panitia atau peserta..."
                  rows={2}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-6 border-t flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleAddPeserta}
                disabled={isAdding || !selectedWargaId}
                className="px-4 py-2 bg-[#166534] rounded-lg text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50 flex items-center justify-center min-w-[100px]"
              >
                {isAdding ? "Menyimpan..." : "Tambahkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT LAYOUT */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      <div id="print-area" className="hidden print:block bg-white text-black min-h-screen p-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold uppercase">Pemerintah Desa [NAMA DESA]</h1>
          <h2 className="text-2xl font-bold uppercase mt-1">Daftar Hadir Kegiatan</h2>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm border-b border-black pb-6">
          <div>
            <p className="mb-1"><span className="font-semibold inline-block w-32">Nama Kegiatan</span>: {kegiatan.judul}</p>
            <p><span className="font-semibold inline-block w-32">Tanggal</span>: {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(kegiatan.tanggal))}</p>
          </div>
          <div>
            <p className="mb-1"><span className="font-semibold inline-block w-32">Waktu</span>: {kegiatan.waktu_mulai?.slice(0, 5)} - {kegiatan.waktu_selesai?.slice(0, 5)} WIB</p>
            <p><span className="font-semibold inline-block w-32">Lokasi</span>: {kegiatan.lokasi}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-sm mb-12">
          <thead>
            <tr>
              <th className="border border-black p-2 w-12 text-center bg-gray-100 print:bg-transparent">No</th>
              <th className="border border-black p-2 text-left bg-gray-100 print:bg-transparent">Nama Lengkap</th>
              <th className="border border-black p-2 text-left bg-gray-100 print:bg-transparent">NIK</th>
              <th className="border border-black p-2 text-center bg-gray-100 print:bg-transparent">RT/RW</th>
              <th className="border border-black p-2 w-32 text-center bg-gray-100 print:bg-transparent">TTD/Paraf</th>
            </tr>
          </thead>
          <tbody>
            {peserta.map((p, idx) => (
              <tr key={p.id}>
                <td className="border border-black p-2 text-center">{idx + 1}</td>
                <td className="border border-black p-2">{p.profiles?.nama || ""}</td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2 text-center">
                  {p.profiles?.rt && p.profiles?.rw ? `${p.profiles.rt}/${p.profiles.rw}` : ""}
                </td>
                <td className="border border-black p-2 text-left relative h-8">
                  {/* Nomor ttd zigzag: ganjil di kiri, genap di kanan */}
                  <span className={`text-xs text-gray-500 absolute ${idx % 2 === 0 ? 'left-2' : 'right-4'}`}>
                    {idx + 1}.
                  </span>
                </td>
              </tr>
            ))}
            {/* 5 Baris Kosong */}
            {Array.from({ length: 5 }).map((_, idx) => {
              const num = peserta.length + idx + 1;
              return (
                <tr key={`empty-${idx}`}>
                  <td className="border border-black p-2 text-center">{num}</td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2 text-left relative h-8">
                    <span className={`text-xs text-gray-500 absolute ${(num - 1) % 2 === 0 ? 'left-2' : 'right-4'}`}>
                      {num}.
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-between items-start mt-8 text-sm px-8">
          <div className="text-center">
            <p>Mengetahui,</p>
            <p className="font-semibold mb-20">Kepala Desa</p>
            <p>(_______________________)</p>
          </div>
          <div className="text-center">
            <p>Yang Membuat Daftar,</p>
            <p className="font-semibold mb-20">Panitia Kegiatan</p>
            <p>(_______________________)</p>
          </div>
        </div>
      </div>

    </div>
  );
}
