"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Anggota } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";

export interface ModalAnggotaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  keluargaId: string;
  initialData?: Anggota | null;
  existingAnggota?: Anggota[];
}

const HUBUNGAN_OPTIONS = [
  "Kepala Keluarga",
  "Suami",
  "Istri",
  "Anak",
  "Orang Tua",
  "Mertua",
  "Cucu",
  "Saudara",
  "Lainnya",
];

export function ModalAnggota({
  isOpen,
  onClose,
  onSuccess,
  keluargaId,
  initialData,
  existingAnggota = [],
}: ModalAnggotaProps) {
  const { showToast } = useToast();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    nama: "",
    nik: "",
    hubungan: "Anak",
    tgl_lahir: "",
    jenis_kelamin: "L" as "L" | "P",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state ketika modal terbuka
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          nama: initialData.nama || "",
          nik: initialData.nik || "",
          hubungan: initialData.hubungan || "Anak",
          tgl_lahir: initialData.tgl_lahir || "",
          jenis_kelamin: initialData.jenis_kelamin || "L",
        });
      } else {
        const hasKepala = existingAnggota.some(
          (a) => a.hubungan?.toLowerCase() === "kepala keluarga",
        );
        setFormData({
          nama: "",
          nik: "",
          hubungan: !hasKepala ? "Kepala Keluarga" : "Istri", // default
          tgl_lahir: "",
          jenis_kelamin: "L",
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama || formData.nama.trim().length < 2) {
      newErrors.nama = "Nama lengkap minimal 2 karakter.";
    }

    if (!formData.tgl_lahir) {
      newErrors.tgl_lahir = "Tanggal lahir wajib diisi.";
    }

    if (!formData.nik) {
      newErrors.nik = "NIK wajib diisi.";
    } else if (!/^\d{16}$/.test(formData.nik)) {
      newErrors.nik = "NIK harus terdiri dari tepat 16 digit angka.";
    } else {
      // Validasi Tanggal Lahir (KTP)
      const tglLahirStr = formData.nik.substring(6, 12);
      let day = parseInt(tglLahirStr.substring(0, 2), 10);
      const month = parseInt(tglLahirStr.substring(2, 4), 10);

      if (day >= 40) day -= 40;

      if (day < 1 || day > 31 || month < 1 || month > 12) {
        newErrors.nik = "Format tanggal lahir pada digit 7-12 NIK tidak valid.";
      } else {
        // Cek NIK Unik
        const isEditMode = !!initialData;
        if (!isEditMode || (isEditMode && formData.nik !== initialData.nik)) {
          const { data } = await supabase
            .from("anggota")
            .select("id")
            .eq("nik", formData.nik)
            .maybeSingle();

          if (data) {
            newErrors.nik =
              "NIK ini sudah terdaftar sebagai anggota di seluruh sistem (lintas KK).";
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isValid = await validate();
    if (!isValid) {
      setIsSubmitting(false);
      return;
    }

    let oldKepalaId: string | null = null;

    // Validasi aturan Kepala Keluarga
    if (formData.hubungan === "Kepala Keluarga") {
      const existingKepala = existingAnggota.find(
        (a) =>
          a.hubungan?.toLowerCase() === "kepala keluarga" &&
          a.id !== initialData?.id,
      );

      if (existingKepala) {
        const confirmReplace = window.confirm(
          "KK ini sudah memiliki kepala keluarga. Apakah Anda ingin mengganti kepala keluarga?",
        );
        if (!confirmReplace) {
          setIsSubmitting(false);
          return;
        } else {
          oldKepalaId = existingKepala.id;
        }
      }
    }

    try {
      if (oldKepalaId) {
        // Otomatis demote kepala lama jika konfirmasi ditekan
        await supabase
          .from("anggota")
          .update({ hubungan: "Lainnya" })
          .eq("id", oldKepalaId);
      }

      const payload = {
        keluarga_id: keluargaId,
        nama: formData.nama,
        nik: formData.nik,
        hubungan: formData.hubungan,
        tgl_lahir: formData.tgl_lahir,
        jenis_kelamin: formData.jenis_kelamin,
      };

      if (initialData) {
        // Update
        const { error } = await supabase
          .from("anggota")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        showToast(
          "success",
          "Anggota Diperbarui",
          "Data anggota berhasil diperbarui.",
        );
      } else {
        // Insert
        const { error } = await supabase.from("anggota").insert([payload]);
        if (error) throw error;
        showToast(
          "success",
          "Anggota Ditambahkan",
          "Data anggota baru berhasil ditambahkan.",
        );
      }

      onSuccess();
    } catch (error: any) {
      console.error(error);
      if (error?.code === "23505") {
        showToast(
          "error",
          "Simpan Gagal",
          "NIK ini sudah digunakan oleh orang lain di dalam sistem database, melanggar ketentuan status unik.",
        );
      } else {
        showToast(
          "error",
          "Simpan Gagal",
          error.message || "Terdapat kesalahan saat menyimpan data.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
      ></div>

      {/* Modal box */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            {initialData ? "Edit Anggota Keluarga" : "Tambah Anggota Keluarga"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto w-full">
          <form
            id="anggotaForm"
            onSubmit={handleSubmit}
            className="px-6 py-6 space-y-5"
          >
            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex. Budi Santoso"
              />
              {errors.nama && (
                <p className="text-xs text-red-500 mt-1">{errors.nama}</p>
              )}
            </div>

            {/* NIK */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIK (16 Digit) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex. 3201..."
                maxLength={16}
              />
              {errors.nik && (
                <p className="text-xs text-red-500 mt-1">{errors.nik}</p>
              )}
            </div>

            {/* Hubungan & Tgl Lahir Split */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hubungan <span className="text-red-500">*</span>
                </label>
                <select
                  name="hubungan"
                  value={formData.hubungan}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {HUBUNGAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tgl_lahir"
                  value={formData.tgl_lahir}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.tgl_lahir && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.tgl_lahir}
                  </p>
                )}
              </div>
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jenis_kelamin"
                    value="L"
                    checked={formData.jenis_kelamin === "L"}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-sm border text-gray-700">
                    Laki-laki
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jenis_kelamin"
                    value="P"
                    checked={formData.jenis_kelamin === "P"}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Perempuan</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Batal
          </button>
          <button
            type="submit"
            form="anggotaForm"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Menyimpan" : "Simpan Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
