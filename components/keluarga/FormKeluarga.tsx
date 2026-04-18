"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";

// Kita mendefinisikan interface data form lokal agar lebih bebas menambahkan field yang diminta (seperti NIK)
export interface FormDataKeluarga {
  id?: string;
  no_kk: string;
  nama_kepala: string;
  nik_kepala: string;
  alamat: string;
  rt: string;
  rw: string;
}

interface FormKeluargaProps {
  initialData?: FormDataKeluarga;
  isEdit?: boolean;
}

export function FormKeluarga({ initialData, isEdit = false }: FormKeluargaProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();

  const [formData, setFormData] = useState<FormDataKeluarga>({
    no_kk: initialData?.no_kk || "",
    nama_kepala: initialData?.nama_kepala || "",
    nik_kepala: initialData?.nik_kepala || "", // Bisa jadi field ini baru ditambahkan di database
    alamat: initialData?.alamat || "",
    rt: initialData?.rt || "",
    rw: initialData?.rw || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormDataKeluarga, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Hapus pesan error field yang sedang diedit
    if (errors[name as keyof FormDataKeluarga]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = async () => {
    const newErrors: Partial<Record<keyof FormDataKeluarga, string>> = {};

    // Validasi Nomor KK: 16 Digit
    if (!formData.no_kk || !/^\d{16}$/.test(formData.no_kk)) {
      newErrors.no_kk = "Nomor KK harus berupa 16 digit angka.";
    } else {
      // Validasi Unique KK ke Supabase
      if (!isEdit || (isEdit && formData.no_kk !== initialData?.no_kk)) {
        const { data } = await supabase
          .from("keluarga")
          .select("id")
          .eq("no_kk", formData.no_kk)
          .maybeSingle();

        if (data) {
          newErrors.no_kk = "Nomor KK sudah terdaftar di sistem.";
        }
      }
    }

    // Validasi Nama Kepala: min 3 kar
    if (!formData.nama_kepala || formData.nama_kepala.trim().length < 3) {
      newErrors.nama_kepala = "Nama kepala keluarga minimal 3 karakter.";
    }

    // Validasi NIK: 16 Digit & Format & Unik
    if (!formData.nik_kepala) {
      newErrors.nik_kepala = "NIK Kepala Keluarga wajib diisi.";
    } else if (!/^\d{16}$/.test(formData.nik_kepala)) {
      newErrors.nik_kepala = "NIK harus terdiri dari tepat 16 digit dan semuanya berupa angka.";
    } else {
      // Validasi logis Tanggal Lahir (Digit 7-12)
      const tglLahirStr = formData.nik_kepala.substring(6, 12);
      let day = parseInt(tglLahirStr.substring(0, 2), 10);
      const month = parseInt(tglLahirStr.substring(2, 4), 10);
      
      // Jika perempuan, tanggal ditambahkan 40
      if (day >= 40) day -= 40;

      if (day < 1 || day > 31 || month < 1 || month > 12) {
        newErrors.nik_kepala = "Kombinasi digit tanggal lahir (digit 7-12) pada NIK tidak valid.";
      } else {
        // Pengecekan unik ke tabel anggota
        if (!isEdit || (isEdit && formData.nik_kepala !== initialData?.nik_kepala)) {
          const { data } = await supabase
            .from("anggota")
            .select("id")
            .eq("nik", formData.nik_kepala)
            .maybeSingle();

          if (data) {
             newErrors.nik_kepala = "Terdapat anggota tersimpan yang sudah menggunakan NIK ini.";
          }
        }
      }
    }

    // Validasi Alamat: min 10 kar
    if (!formData.alamat || formData.alamat.trim().length < 10) {
      newErrors.alamat = "Alamat lengkap diwajibkan minimal 10 karakter.";
    }

    // Validasi RT/RW: 2 digit
    if (!formData.rt || !/^\d{2}$/.test(formData.rt)) {
      newErrors.rt = "Format RT harus 2 digit (contoh: 01, 05).";
    }
    if (!formData.rw || !/^\d{2}$/.test(formData.rw)) {
      newErrors.rw = "Format RW harus 2 digit (contoh: 01, 12).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isValid = await validate();
    if (!isValid) {
      showToast("error", "Validasi Gagal", "Proses simpan dihentikan, silakan periksa kembali isian formulir.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        no_kk: formData.no_kk,
        nama_kepala: formData.nama_kepala,
        nik_kepala: formData.nik_kepala,
        alamat: formData.alamat,
        rt: formData.rt,
        rw: formData.rw,
      };

      if (isEdit && initialData?.id) {
        // Mode Update
        const { error } = await supabase
          .from("keluarga")
          .update(payload)
          .eq("id", initialData.id);

        if (error) throw error;
        showToast("success", "Pembaruan Berhasil", "Data keluarga berhasil diperbarui.");
      } else {
        // Mode Create
        const { error } = await supabase.from("keluarga").insert([payload]);

        if (error) throw error;
        showToast("success", "Simpan Berhasil", "Data keluarga baru telah berhasil didaftarkan.");
      }

      // Redirect kembali ke daftar
      router.push("/dashboard/keluarga");
      router.refresh(); // Pastikan data di server page update
    } catch (err: any) {
      console.error("Supabase Error:", err);
      // Fallback jika error karena nik_kepala (misalnya karena belum ditambahkan ke schema oleh User)
      if (err?.code === "PGRST204") {
        showToast(
          "error", 
          "Kesalahan Skema Database", 
          "Kolom tidak ditemukan di database. Pastikan tabel keluarga memiliki kolom 'nik_kepala'."
        );
      } else {
        showToast("error", "Simpan Gagal", err?.message || "Terjadi kesalahan internal saat menghubungi server.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        
        {/* Layout Grid 2 Kolom untuk Desktop, 1 Kolom untuk Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Field: No KK */}
          <div className="space-y-2">
            <label htmlFor="no_kk" className="block text-sm font-medium text-gray-700">
              Nomor KK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="no_kk"
              name="no_kk"
              value={formData.no_kk}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Contoh: 3201234567890123"
              className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:outline-none transition-all ${
                errors.no_kk 
                  ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50/50" 
                  : "border-gray-300 focus:ring-green-200 focus:border-green-500"
              }`}
            />
            {errors.no_kk && <p className="text-sm text-red-600">{errors.no_kk}</p>}
          </div>

          {/* Field: Nama Kepala KK */}
          <div className="space-y-2">
            <label htmlFor="nama_kepala" className="block text-sm font-medium text-gray-700">
              Nama Kepala Keluarga <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nama_kepala"
              name="nama_kepala"
              value={formData.nama_kepala}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Masukkan nama lengkap sesuai KTP"
              className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:outline-none transition-all ${
                errors.nama_kepala 
                  ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50/50" 
                  : "border-gray-300 focus:ring-green-200 focus:border-green-500"
              }`}
            />
            {errors.nama_kepala && <p className="text-sm text-red-600">{errors.nama_kepala}</p>}
          </div>

          {/* Field: NIK Kepala KK */}
          <div className="space-y-2">
            <label htmlFor="nik_kepala" className="block text-sm font-medium text-gray-700">
              NIK Kepala Keluarga <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nik_kepala"
              name="nik_kepala"
              value={formData.nik_kepala}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Contoh: 3201234567890123"
              className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:outline-none transition-all ${
                errors.nik_kepala 
                  ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50/50" 
                  : "border-gray-300 focus:ring-green-200 focus:border-green-500"
              }`}
            />
            {errors.nik_kepala && <p className="text-sm text-red-600">{errors.nik_kepala}</p>}
          </div>

          {/* Baris Kosong untuk Filler di Grid */}
          <div className="hidden md:block"></div>

          {/* Field: RT */}
          <div className="space-y-2">
            <label htmlFor="rt" className="block text-sm font-medium text-gray-700">
              Rukun Tetangga (RT) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="rt"
              name="rt"
              value={formData.rt}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="01"
              maxLength={3}
              className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:outline-none transition-all ${
                errors.rt 
                  ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50/50" 
                  : "border-gray-300 focus:ring-green-200 focus:border-green-500"
              }`}
            />
            {errors.rt && <p className="text-sm text-red-600">{errors.rt}</p>}
          </div>

          {/* Field: RW */}
          <div className="space-y-2">
            <label htmlFor="rw" className="block text-sm font-medium text-gray-700">
              Rukun Warga (RW) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="rw"
              name="rw"
              value={formData.rw}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="12"
              maxLength={3}
              className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:outline-none transition-all ${
                errors.rw 
                  ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50/50" 
                  : "border-gray-300 focus:ring-green-200 focus:border-green-500"
              }`}
            />
            {errors.rw && <p className="text-sm text-red-600">{errors.rw}</p>}
          </div>

          {/* Field: Alamat Lengkap (Full Width) */}
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="alamat" className="block text-sm font-medium text-gray-700">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              id="alamat"
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={3}
              placeholder="Tuliskan nama jalan, blok, nomor rumah..."
              className={`w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:outline-none transition-all resize-y ${
                errors.alamat 
                  ? "border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50/50" 
                  : "border-gray-300 focus:ring-green-200 focus:border-green-500"
              }`}
            />
            {errors.alamat && <p className="text-sm text-red-600">{errors.alamat}</p>}
          </div>

        </div>

        {/* Footer & Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push("/dashboard/keluarga")}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 text-white font-medium bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSubmitting ? "Menyimpan..." : "Simpan Data"}
          </button>
        </div>
      </form>
    </div>
  );
}
