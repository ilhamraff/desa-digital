"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText, Home, Briefcase, Heart,
  Search, Filter, Archive, CheckCircle, XCircle, 
  Download, Clock, AlertCircle, Eye, RefreshCw, Plus,
  IdCard, Calendar, UserMinus
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";
import { Surat } from "@/types";

// Extended Surat type to include joined profiles
type SuratWithProfile = Surat & {
  profiles: { nama: string } | null;
};

interface SuratClientProps {
  initialData: SuratWithProfile[];
}

export default function SuratClient({ initialData }: SuratClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState("semua");
  const [data, setData] = useState<SuratWithProfile[]>(initialData);

  // Modal State
  const [isTolakModalOpen, setIsTolakModalOpen] = useState(false);
  const [isSelesaiModalOpen, setIsSelesaiModalOpen] = useState(false);
  const [isAlasanModalOpen, setIsAlasanModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [selectedSuratId, setSelectedSuratId] = useState<string | null>(null);
  
  const [alasanPenolakan, setAlasanPenolakan] = useState("");
  const [selesaiCatatan, setSelesaiCatatan] = useState("");
  const [alasanTampil, setAlasanTampil] = useState("");
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    actionLabel: string;
    actionClass: string;
    onConfirm: () => void;
  } | null>(null);

  const TABS = [
    { id: "semua", label: "Semua" },
    { id: "pending", label: "Pending" },
    { id: "diproses", label: "Diproses" },
    { id: "selesai", label: "Selesai" },
    { id: "ditolak", label: "Ditolak" }
  ];

  const filteredData = data.filter((item) => {
    if (activeTab === "semua") return true;
    return item.status.toLowerCase() === activeTab;
  });

  const countByStatus = (status: string) => {
    if (status === "semua") return data.length;
    return data.filter(s => s.status.toLowerCase() === status).length;
  };

  const getJenisSuratIcon = (jenis: string) => {
    const j = jenis.toLowerCase();
    if (j.includes("usaha") || j.includes("bisnis")) return <Briefcase className="w-5 h-5 text-blue-500" />;
    if (j.includes("domisili") || j.includes("tinggal")) return <Home className="w-5 h-5 text-green-500" />;
    if (j.includes("sktm") || j.includes("tidak mampu") || j.includes("nikah")) return <Heart className="w-5 h-5 text-pink-500" />;
    if (j.includes("ktp") || j.includes("kk")) return <IdCard className="w-5 h-5 text-indigo-500" />;
    if (j.includes("kegiatan")) return <Calendar className="w-5 h-5 text-orange-500" />;
    if (j.includes("kematian") || j.includes("meninggal")) return <UserMinus className="w-5 h-5 text-gray-700" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const calculateDaysAgo = (dateString: string) => {
    const requestDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - requestDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
    
    const formattedTime = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d).replace(".", ":");

    return `${formattedDate}, ${formattedTime}`;
  };

  const handleUpdateStatus = async (id: string, newStatus: Surat['status'], catatan?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (catatan !== undefined) {
        updateData.catatan_petugas = catatan;
      }

      const { error } = await supabase
        .from('surat')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setData(prev => prev.map(s => 
        s.id === id 
          ? { ...s, status: newStatus, ...(catatan !== undefined && { catatan_petugas: catatan }) } 
          : s
      ));

      showToast("success", "Berhasil", `Status surat diperbarui menjadi ${newStatus}`);
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      showToast("error", "Gagal memperbarui status", error.message);
    }
  };

  const handleTolakSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alasanPenolakan.length < 20) {
      showToast("error", "Error", "Alasan penolakan minimal 20 karakter");
      return;
    }
    if (selectedSuratId) {
      await handleUpdateStatus(selectedSuratId, "ditolak", alasanPenolakan);
      setIsTolakModalOpen(false);
      setAlasanPenolakan("");
      setSelectedSuratId(null);
    }
  };

  const handleSelesaiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuratId) {
      await handleUpdateStatus(selectedSuratId, "selesai", selesaiCatatan || undefined);
      setIsSelesaiModalOpen(false);
      setSelesaiCatatan("");
      setSelectedSuratId(null);
    }
  };

  const openTolakModal = (id: string) => {
    setSelectedSuratId(id);
    setAlasanPenolakan("");
    setIsTolakModalOpen(true);
  };

  const openSelesaiModal = (id: string) => {
    setSelectedSuratId(id);
    setSelesaiCatatan("");
    setIsSelesaiModalOpen(true);
  };

  const openAlasanModal = (alasan?: string | null) => {
    setAlasanTampil(alasan || "Tidak ada alasan yang diberikan.");
    setIsAlasanModalOpen(true);
  };

  const openConfirmModal = (title: string, message: string, actionLabel: string, actionClass: string, onConfirm: () => void) => {
    setConfirmConfig({ title, message, actionLabel, actionClass, onConfirm });
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Surat & Administrasi</h1>
          {countByStatus("pending") > 0 && (
            <span className="bg-red-100 text-red-700 py-1 px-3 rounded-full text-sm font-semibold border border-red-200">
              {countByStatus("pending")} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link 
            href="/dashboard/surat/request"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Request Surat
          </Link>
          <Link 
            href="/dashboard/surat/arsip"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <Archive className="w-4 h-4" />
            Lihat Arsip
          </Link>
        </div>
      </div>

      {/* Tab Filter Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200">
          {TABS.map((tab) => {
            const count = countByStatus(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive 
                    ? "border-green-500 text-green-600 bg-green-50/50" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                <span className={`py-0.5 px-2 rounded-full text-xs ${
                  isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tabel Antrian */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-3 px-4 font-medium w-16">No</th>
                <th className="py-3 px-4 font-medium">Nama Pemohon</th>
                <th className="py-3 px-4 font-medium">Jenis Surat</th>
                <th className="py-3 px-4 font-medium">Keperluan</th>
                <th className="py-3 px-4 font-medium">Tanggal Request</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium w-48">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Tidak ada data surat untuk status ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const daysAgo = calculateDaysAgo(item.created_at);
                  const isPending = item.status === "pending";
                  
                  // HIGHLIGHT VISUAL
                  let rowBgClass = "hover:bg-gray-50 bg-white";
                  if (isPending) {
                    if (daysAgo > 7) rowBgClass = "bg-red-50 hover:bg-red-100";
                    else if (daysAgo > 3) rowBgClass = "bg-yellow-50 hover:bg-yellow-100";
                  }

                  return (
                    <tr key={item.id} className={`transition-colors ${rowBgClass}`}>
                      <td className="py-4 px-4 text-gray-500">{index + 1}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {item.profiles?.nama || "Unknown"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getJenisSuratIcon(item.jenis_surat)}
                          <span className="text-gray-700">{item.jenis_surat}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="max-w-[200px] truncate text-gray-600" title={item.keperluan}>
                          {item.keperluan}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-900">{formatDate(item.created_at)}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {daysAgo === 0 ? "Hari ini" : `${daysAgo} hari lalu`}
                            {isPending && daysAgo > 7 && (
                              <span className="text-red-500 font-medium ml-1 cursor-help" title={`Menunggu ${daysAgo} hari — mohon segera diproses`}>
                                (!)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-2">
                          {item.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openConfirmModal(
                                  "Proses Surat",
                                  "Apakah Anda yakin ingin mulai memproses permohonan surat ini?",
                                  "Proses Surat",
                                  "bg-blue-600 hover:bg-blue-700",
                                  () => {
                                    handleUpdateStatus(item.id, "diproses");
                                    setIsConfirmModalOpen(false);
                                  }
                                )}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
                              >
                                Proses
                              </button>
                              <button
                                onClick={() => openTolakModal(item.id)}
                                className="w-full border border-red-300 text-red-600 hover:bg-red-50 py-1.5 px-3 rounded text-xs font-medium transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          
                          {item.status === 'diproses' && (
                            <>
                              <button
                                onClick={() => openSelesaiModal(item.id)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
                              >
                                Selesaikan
                              </button>
                              <button
                                onClick={() => openTolakModal(item.id)}
                                className="w-full border border-red-300 text-red-600 hover:bg-red-50 py-1.5 px-3 rounded text-xs font-medium transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {item.status === 'selesai' && (
                            <>
                              <button
                                onClick={() => showToast("success", "Mendownload", "Mendownload PDF surat...")}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                              >
                                <Download className="w-3 h-3" /> PDF
                              </button>
                              <button
                                onClick={() => showToast("success", "Detail", "Membuka detail surat")}
                                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> Detail
                              </button>
                            </>
                          )}

                          {item.status === 'ditolak' && (
                            <>
                              <button
                                onClick={() => openAlasanModal(item.catatan_petugas)}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3" /> Alasan
                              </button>
                              <button
                                onClick={() => openConfirmModal(
                                  "Proses Ulang Surat",
                                  "Apakah Anda yakin ingin memproses ulang permohonan surat yang telah ditolak ini?",
                                  "Proses Ulang",
                                  "bg-blue-600 hover:bg-blue-700",
                                  () => {
                                    handleUpdateStatus(item.id, "diproses");
                                    setIsConfirmModalOpen(false);
                                  }
                                )}
                                className="w-full border border-blue-500 text-blue-600 hover:bg-blue-50 py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" /> Proses Ulang
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tolak Surat */}
      {isTolakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tolak Surat</h3>
              <p className="text-sm text-gray-500 mb-4">
                Berikan alasan mengapa permohonan surat ini tidak dapat diproses. Alasan ini akan dapat dilihat oleh pemohon.
              </p>
              
              <form onSubmit={handleTolakSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alasan Penolakan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={alasanPenolakan}
                    onChange={(e) => setAlasanPenolakan(e.target.value)}
                    placeholder="Jelaskan alasan surat tidak bisa diproses..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all min-h-[120px] text-sm"
                  />
                  <p className={`text-xs mt-1 ${alasanPenolakan.length > 0 && alasanPenolakan.length < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                    Minimal 20 karakter. (Saat ini: {alasanPenolakan.length})
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTolakModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={alasanPenolakan.length < 20}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Kirim Penolakan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Selesaikan Surat */}
      {isSelesaiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Selesaikan Surat</h3>
              <p className="text-sm text-gray-500 mb-4">
                Tandai permohonan surat ini sebagai selesai. Anda dapat menambahkan catatan atau nomor surat (opsional).
              </p>
              
              <form onSubmit={handleSelesaiSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan / Nomor Surat (Opsional)
                  </label>
                  <textarea
                    value={selesaiCatatan}
                    onChange={(e) => setSelesaiCatatan(e.target.value)}
                    placeholder="Contoh: Nomor Surat: 123/IX/2025"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all min-h-[80px] text-sm"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSelesaiModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Selesaikan Surat
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lihat Alasan */}
      {isAlasanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-xl font-bold text-gray-900">Alasan Penolakan</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                {alasanTampil}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsAlasanModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal */}
      {isConfirmModalOpen && confirmConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmConfig.title}</h3>
              <p className="text-sm text-gray-500 mb-6">
                {confirmConfig.message}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmConfig.onConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg transition-colors ${confirmConfig.actionClass}`}
                >
                  {confirmConfig.actionLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
