"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { ProgramSummary } from "./bansos.types";

interface FormProgramBansosProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nama_program: string;
    catatan: string;
    jumlah_bantuan: number | null;
    aktif: boolean;
    periode: string;
    original_nama?: string;
  }) => Promise<void>;
  initialData?: ProgramSummary | null;
}

export function FormProgramBansos({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: FormProgramBansosProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Form State
  const [namaProgram, setNamaProgram] = useState("");
  const [catatan, setCatatan] = useState("");
  const [jumlahBantuan, setJumlahBantuan] = useState("");
  const [aktif, setAktif] = useState(true);
  const [bulan, setBulan] = useState("");
  const [tahun, setTahun] = useState("");

  const BULAN_OPTIONS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEditMode = !!initialData;

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false); // Reset loading state
      if (initialData) {
        setNamaProgram(initialData.nama_program);
        setCatatan(initialData.catatan || "");
        setJumlahBantuan(
          initialData.jumlah_bantuan
            ? new Intl.NumberFormat("id-ID").format(initialData.jumlah_bantuan)
            : "",
        );
        setAktif(initialData.aktif);
        
        // Ekstrak bulan dan tahun dari periode (misal: "April 2026")
        if (initialData.periode && initialData.periode !== "-") {
          const parts = initialData.periode.split(" ");
          if (parts.length >= 2) {
            setBulan(parts[0]);
            setTahun(parts[1]);
          } else {
            setBulan(BULAN_OPTIONS[new Date().getMonth()]);
            setTahun(new Date().getFullYear().toString());
          }
        } else {
          setBulan(BULAN_OPTIONS[new Date().getMonth()]);
          setTahun(new Date().getFullYear().toString());
        }
      } else {
        setNamaProgram("");
        setCatatan("");
        setJumlahBantuan("");
        setAktif(true);
        setBulan(BULAN_OPTIONS[new Date().getMonth()]);
        setTahun(new Date().getFullYear().toString());
      }
      setShowWarning(false);
      setErrorMsg(null);
    }
  }, [isOpen, initialData]);

  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (!value) {
      setJumlahBantuan("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(
      parseInt(value, 10),
    );
    setJumlahBantuan(formatted);
  };

  const handleAttemptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!namaProgram.trim()) {
      setErrorMsg("Nama program harus diisi.");
      return;
    }

    if (!/^\d{4}$/.test(tahun)) {
      setErrorMsg("Tahun harus terdiri dari 4 digit angka.");
      return;
    }
    const tahunNum = parseInt(tahun, 10);
    if (tahunNum < 2020 || tahunNum > 2030) {
      setErrorMsg("Tahun harus antara 2020 dan 2030.");
      return;
    }

    // Jika edit mode dan nama program berubah, tampilkan warning
    if (
      isEditMode &&
      initialData &&
      namaProgram.trim() !== initialData.nama_program &&
      !showWarning
    ) {
      setShowWarning(true);
      return; // Stop di sini, tunggu konfirmasi user
    }

    executeSubmit();
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const jumlahNumber = jumlahBantuan
      ? parseInt(jumlahBantuan.replace(/\./g, ""), 10)
      : null;

    const periodeStr = `${bulan} ${tahun}`;

    try {
      await onSubmit({
        nama_program: namaProgram.trim(),
        catatan: catatan.trim(),
        jumlah_bantuan: jumlahNumber,
        aktif,
        periode: periodeStr,
        original_nama: isEditMode ? initialData?.nama_program : undefined,
      });
      // Sukses akan ditangani oleh parent, tapi kita pastikan loading state direset
      setIsSubmitting(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data.");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-[500px] max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "modalEnter 0.2s ease-out forwards" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditMode ? "Edit Program Bansos" : "Tambah Program Bansos"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {showWarning ? (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-4 text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-orange-800 font-bold mb-2">
                Peringatan Perubahan Nama
              </h3>
              <p className="text-sm text-orange-700 mb-6">
                Mengubah nama program akan mempengaruhi{" "}
                <strong>{initialData?.total_penerima || 0}</strong> data
                penerima yang sudah terdaftar. Data penerima akan tetap ada,
                tapi nama programnya akan ikut berubah di sistem. Lanjutkan?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowWarning(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Ya, Lanjutkan"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form
              id="form-program-bansos"
              onSubmit={handleAttemptSubmit}
              className="space-y-5"
            >
              {/* 1. Nama Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Program <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaProgram}
                  onChange={(e) => setNamaProgram(e.target.value)}
                  disabled={isSubmitting}
                  placeholder='Contoh: "PKH 2025" atau "BLT Dana Desa Triwulan I"'
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm"
                />
              </div>

              {/* 2. Deskripsi Program */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 flex justify-between">
                  <span>Deskripsi Program</span>
                  <span className="text-gray-400 font-normal">Opsional</span>
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Penjelasan singkat tujuan program ini"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm resize-none"
                />
              </div>

              {/* 3. Jumlah Bantuan Default */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 flex justify-between">
                  <span>Jumlah Bantuan Default</span>
                  <span className="text-gray-400 font-normal">Opsional</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Rp</span>
                  </div>
                  <input
                    type="text"
                    value={jumlahBantuan}
                    onChange={handleJumlahChange}
                    disabled={isSubmitting}
                    placeholder="Contoh: 300.000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Nominal ini akan menjadi standar yang bisa diubah saat
                  mendaftarkan penerima.
                </p>
              </div>

              {/* 4. Periode Program */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bulan Periode <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm bg-white"
                  >
                    <option value="" disabled>Pilih Bulan</option>
                    {BULAN_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tahun <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    disabled={isSubmitting}
                    placeholder="Contoh: 2026"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              {/* 5. Status Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Program
                </label>
                <div
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    aktif ? "bg-green-600" : "bg-gray-200"
                  } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  role="switch"
                  aria-checked={aktif}
                  onClick={() => !isSubmitting && setAktif(!aktif)}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      aktif ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700 select-none">
                  {aktif ? "Aktif (Menerima Pendaftaran)" : "Nonaktif"}
                </span>
                <p className="text-xs text-gray-500 mt-1.5">
                  Menonaktifkan program tidak menghapus data penerimanya.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!showWarning && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              form="form-program-bansos"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center gap-2 min-w-[120px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Program"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
