"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, X, Search, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface KeluargaOption {
  id: string;
  no_kk: string;
  nama_kepala: string;
  rt: string;
  rw: string;
}

interface FormPenerimaBansosProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProgram?: string;
  programs: string[];
}

const BULAN_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function FormPenerimaBansos({
  isOpen,
  onClose,
  onSuccess,
  defaultProgram,
  programs,
}: FormPenerimaBansosProps) {
  const supabase = createClient();
  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [program, setProgram] = useState("");
  const [penerima, setPenerima] = useState<KeluargaOption | null>(null);
  const [jumlahBantuan, setJumlahBantuan] = useState("");
  const [bulan, setBulan] = useState("");
  const [tahun, setTahun] = useState("");
  const [catatan, setCatatan] = useState("");

  // Data State
  const [keluargaOptions, setKeluargaOptions] = useState<KeluargaOption[]>([]);
  const [keluargaSearch, setKeluargaSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Initialize form when opened
  useEffect(() => {
    if (isOpen) {
      // Set default values
      setProgram(defaultProgram || "");
      setPenerima(null);
      setJumlahBantuan("");
      setCatatan("");
      setErrorMsg(null);

      const now = new Date();
      setBulan(BULAN_OPTIONS[now.getMonth()]);
      setTahun(now.getFullYear().toString());
    }
  }, [isOpen, defaultProgram]);

  // Debounced Search Keluarga
  useEffect(() => {
    if (!isOpen) return;

    const searchKeluarga = async () => {
      setIsSearching(true);
      let query = supabase
        .from("keluarga")
        .select("id, no_kk, nama_kepala, rt, rw")
        .limit(20);

      if (keluargaSearch.trim()) {
        query = query.or(
          `nama_kepala.ilike.%${keluargaSearch}%,no_kk.ilike.%${keluargaSearch}%`,
        );
      }

      const { data, error } = await query;
      if (!error && data) {
        setKeluargaOptions(data);
      }
      setIsSearching(false);
    };

    const timer = setTimeout(() => {
      searchKeluarga();
    }, 300);

    return () => clearTimeout(timer);
  }, [keluargaSearch, isOpen, supabase]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Format currency
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!program || !penerima || !jumlahBantuan || !bulan || !tahun) {
      setErrorMsg("Semua field yang wajib harus diisi.");
      return;
    }

    const jumlahNumber = parseInt(jumlahBantuan.replace(/\./g, ""), 10);
    if (isNaN(jumlahNumber) || jumlahNumber < 1000) {
      setErrorMsg("Jumlah bantuan minimal Rp 1.000.");
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

    const periodeStr = `${bulan} ${tahun}`;

    setIsSubmitting(true);

    try {
      // Check for duplicates (bypassing Next.js fetch cache with a dynamic dummy filter)
      const { data: existing, error: checkError } = await supabase
        .from("bansos")
        .select("id")
        .eq("nama_program", program)
        .eq("penerima_id", penerima.id)
        .eq("periode", periodeStr)
        .neq("id", crypto.randomUUID());

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        setErrorMsg(
          `⚠️ ${penerima.nama_kepala} sudah terdaftar sebagai penerima ${program} untuk periode ${periodeStr}. Tidak bisa mendaftarkan dua kali untuk program dan periode yang sama.`,
        );
        setIsSubmitting(false);
        return;
      }

      // Insert new data
      const { error: insertError } = await supabase.from("bansos").insert({
        nama_program: program,
        penerima_id: penerima.id,
        jumlah_bantuan: jumlahNumber,
        periode: periodeStr,
        status: "pending", // Default status
        catatan: catatan.trim() || null,
      });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
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
            Tambah Penerima Bansos
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
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <form id="form-bansos" onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Program Bansos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Program Bansos <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                disabled={!!defaultProgram || isSubmitting}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm bg-white disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="" disabled>
                  Pilih Program
                </option>
                {/* Always include defaultProgram if it's not in the programs list */}
                {defaultProgram && !programs.includes(defaultProgram) && (
                  <option value={defaultProgram}>{defaultProgram}</option>
                )}
                {programs.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Pilih Penerima */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Pilih Penerima (KK) <span className="text-red-500">*</span>
              </label>

              <div
                className={`w-full px-4 py-2.5 rounded-lg border ${showDropdown ? "border-green-500 ring-2 ring-green-500/20" : "border-gray-300"} bg-white flex items-center justify-between cursor-text transition-colors`}
                onClick={() => !isSubmitting && setShowDropdown(true)}
              >
                {penerima && !showDropdown ? (
                  <div className="flex-1 flex items-center justify-between group">
                    <span className="text-sm text-gray-900 truncate pr-2">
                      <span className="font-medium">
                        {penerima.nama_kepala}
                      </span>{" "}
                      — KK: {penerima.no_kk}{" "}
                      <span className="text-gray-500">
                        (RT {penerima.rt}/RW {penerima.rw})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPenerima(null);
                        setKeluargaSearch("");
                        setShowDropdown(true);
                      }}
                      className="text-gray-400 hover:text-red-500 hidden group-hover:block transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400"
                      placeholder="Ketik nama kepala keluarga atau no KK..."
                      value={keluargaSearch}
                      onChange={(e) => setKeluargaSearch(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>

              {/* Dropdown Options */}
              {showDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Mencari...
                    </div>
                  ) : keluargaOptions.length > 0 ? (
                    <ul className="py-1">
                      {keluargaOptions.map((opt) => (
                        <li
                          key={opt.id}
                          className="px-4 py-2.5 hover:bg-green-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                          onClick={() => {
                            setPenerima(opt);
                            setShowDropdown(false);
                            setKeluargaSearch("");
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {opt.nama_kepala}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              KK: {opt.no_kk} • RT {opt.rt}/RW {opt.rw}
                            </p>
                          </div>
                          {penerima?.id === opt.id && (
                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Keluarga tidak ditemukan
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Jumlah Bantuan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Jumlah Bantuan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Rp</span>
                </div>
                <input
                  type="text"
                  required
                  value={jumlahBantuan}
                  onChange={handleJumlahChange}
                  disabled={isSubmitting}
                  placeholder="Masukkan jumlah dalam Rupiah"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {/* 4. Periode Bantuan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Periode Bantuan <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <select
                  required
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                  disabled={isSubmitting}
                  className="w-2/3 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm bg-white"
                >
                  {BULAN_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={tahun}
                  onChange={(e) =>
                    setTahun(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  disabled={isSubmitting}
                  placeholder="2024"
                  className="w-1/3 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm text-center"
                  maxLength={4}
                />
              </div>
            </div>

            {/* 5. Catatan Tambahan */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex justify-between">
                <span>Catatan Tambahan</span>
                <span className="text-gray-400 font-normal">
                  {catatan.length}/500
                </span>
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value.slice(0, 500))}
                disabled={isSubmitting}
                placeholder="Catatan khusus untuk penerima ini (opsional)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-colors text-sm resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
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
            form="form-bansos"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center gap-2 min-w-[120px] justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Penerima"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
