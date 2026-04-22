"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { Kegiatan } from "@/types";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

interface FormKegiatanProps {
  initialData?: Kegiatan;
}

export default function FormKegiatan({ initialData }: FormKegiatanProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const isEdit = !!initialData;

  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [judul, setJudul] = useState(initialData?.judul || "");
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi || "");
  const [tanggal, setTanggal] = useState(initialData?.tanggal || "");
  const [waktuMulai, setWaktuMulai] = useState(
    initialData?.waktu_mulai?.slice(0, 5) || "",
  );
  const [waktuSelesai, setWaktuSelesai] = useState(
    initialData?.waktu_selesai?.slice(0, 5) || "",
  );
  const [lokasi, setLokasi] = useState(initialData?.lokasi || "");
  const [kuota, setKuota] = useState<string>(
    initialData?.kuota ? String(initialData.kuota) : "",
  );
  const [status, setStatus] = useState<"aktif" | "selesai" | "dibatalkan">(
    initialData?.status || "aktif",
  );
  const [catatanTambahan, setCatatanTambahan] = useState(
    initialData?.catatan_tambahan || "",
  );

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!judul || judul.length < 5) {
      newErrors.judul = "Judul kegiatan minimal 5 karakter";
    }

    if (deskripsi && deskripsi.length > 1000) {
      newErrors.deskripsi = "Deskripsi maksimal 1000 karakter";
    }

    if (!tanggal) {
      newErrors.tanggal = "Tanggal kegiatan wajib diisi";
    } else {
      const selectedDate = new Date(tanggal);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // reset waktu agar komparasi adil pada hari yang sama
      if (selectedDate < today && !isEdit) {
        // Validasi tidak boleh lewat dari hari ini saat buat baru
        newErrors.tanggal = "Tanggal tidak boleh kurang dari hari ini";
      }
    }

    if (!waktuMulai) {
      newErrors.waktuMulai = "Waktu mulai wajib diisi";
    }

    if (!waktuSelesai) {
      newErrors.waktuSelesai = "Waktu selesai wajib diisi";
    }

    if (waktuMulai && waktuSelesai) {
      if (waktuSelesai <= waktuMulai) {
        newErrors.waktuSelesai =
          "Waktu selesai harus lebih besar dari waktu mulai";
      }
    }

    if (!lokasi) {
      newErrors.lokasi = "Lokasi kegiatan wajib diisi";
    }

    if (kuota !== "") {
      const numKuota = Number(kuota);
      if (isNaN(numKuota) || numKuota < 1 || numKuota > 9999) {
        newErrors.kuota = "Kuota harus berupa angka antara 1 - 9999";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast(
        "error",
        "Gagal menyimpan",
        "Silakan periksa kembali form anda",
      );
      return;
    }

    setIsLoading(true);

    const payload = {
      judul,
      deskripsi: deskripsi || null,
      tanggal,
      waktu_mulai: waktuMulai,
      waktu_selesai: waktuSelesai,
      lokasi,
      kuota: kuota === "" ? null : Number(kuota),
      status,
      catatan_tambahan: catatanTambahan || null,
    };

    if (isEdit && initialData) {
      const { error } = await supabase
        .from("kegiatan")
        .update(payload)
        .eq("id", initialData.id);

      if (error) {
        showToast("error", "Terjadi kesalahan", error.message);
      } else {
        showToast("success", "Berhasil!", "Data kegiatan berhasil diperbarui.");
        router.push(`/dashboard/kegiatan`); // atau ke detail
      }
    } else {
      const { data, error } = await supabase
        .from("kegiatan")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        showToast("error", "Terjadi kesalahan", error.message);
      } else if (data) {
        showToast(
          "success",
          "Berhasil!",
          "Kegiatan berhasil dibuat! Sekarang tambahkan peserta.",
        );
        // Sesuai requirement, redirect ke halaman detail id-baru
        // Karena halaman detail mungkin belum ada, sementara redirect ke list atau id tersebut
        router.push(`/dashboard/kegiatan`);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Kolom Kiri: Form */}
      <div className="lg:col-span-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
        >
          {/* Section: Info Utama */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Info Utama
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Misal: Gotong Royong Bersih Desa"
                  className={`w-full p-2.5 bg-gray-50 border rounded-lg focus:bg-white transition-colors ${
                    errors.judul
                      ? "border-red-500"
                      : "border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  }`}
                />
                {errors.judul && (
                  <p className="mt-1 text-sm text-red-500">{errors.judul}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Deskripsi
                  </label>
                  <span
                    className={`text-xs ${deskripsi.length > 1000 ? "text-red-500" : "text-gray-500"}`}
                  >
                    {deskripsi.length} / 1000
                  </span>
                </div>
                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan tujuan dan detail kegiatan ini..."
                  rows={4}
                  className={`w-full p-2.5 bg-gray-50 border rounded-lg focus:bg-white transition-colors resize-none ${
                    errors.deskripsi
                      ? "border-red-500"
                      : "border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  }`}
                />
                {errors.deskripsi && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.deskripsi}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Kegiatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    min={
                      !isEdit
                        ? new Date().toISOString().split("T")[0]
                        : undefined
                    }
                    className={`w-full p-2.5 bg-gray-50 border rounded-lg focus:bg-white transition-colors ${
                      errors.tanggal
                        ? "border-red-500"
                        : "border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    }`}
                  />
                  {errors.tanggal && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.tanggal}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={waktuMulai}
                      onChange={(e) => setWaktuMulai(e.target.value)}
                      className={`flex-1 p-2.5 bg-gray-50 border rounded-lg focus:bg-white transition-colors ${
                        errors.waktuMulai
                          ? "border-red-500"
                          : "border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      }`}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={waktuSelesai}
                      onChange={(e) => setWaktuSelesai(e.target.value)}
                      className={`flex-1 p-2.5 bg-gray-50 border rounded-lg focus:bg-white transition-colors ${
                        errors.waktuSelesai
                          ? "border-red-500"
                          : "border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      }`}
                    />
                  </div>
                  {(errors.waktuMulai || errors.waktuSelesai) && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.waktuSelesai || errors.waktuMulai}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lokasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    placeholder="Misal: Balai Desa"
                    className={`w-full p-2.5 bg-gray-50 border rounded-lg focus:bg-white transition-colors ${
                      errors.lokasi
                        ? "border-red-500"
                        : "border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    }`}
                  />
                  {errors.lokasi && (
                    <p className="mt-1 text-sm text-red-500">{errors.lokasi}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kuota Peserta
                  </label>
                  <input
                    type="number"
                    value={kuota}
                    onChange={(e) => setKuota(e.target.value)}
                    placeholder="Misal: 100"
                    min="1"
                    max="9999"
                    className={`w-full p-2.5 bg-gray-50 border rounded-lg focus:bg-white transition-colors ${
                      errors.kuota
                        ? "border-red-500"
                        : "border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    }`}
                  />
                  {errors.kuota ? (
                    <p className="mt-1 text-sm text-red-500">{errors.kuota}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Kosongkan untuk kuota tidak terbatas
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Pengaturan */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Pengaturan Tambahan
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Kegiatan
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="aktif"
                      checked={status === "aktif"}
                      onChange={() => setStatus("aktif")}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="selesai"
                      checked={status === "selesai"}
                      onChange={() => setStatus("selesai")}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Selesai</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="dibatalkan"
                      checked={status === "dibatalkan"}
                      onChange={() => setStatus("dibatalkan")}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Dibatalkan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Tambahan untuk Peserta
                </label>
                <textarea
                  value={catatanTambahan}
                  onChange={(e) => setCatatanTambahan(e.target.value)}
                  placeholder="Misal: Harap membawa alat kebersihan masing-masing..."
                  rows={3}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#166534] rounded-lg hover:bg-green-800 focus:ring-4 focus:ring-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Buat Kegiatan"}
            </button>
          </div>
        </form>
      </div>

      {/* Kolom Kanan: Preview (Desktop Only) */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Preview Kegiatan
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-24 bg-[#166534] relative">
              <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
                <Calendar className="w-6 h-6 text-[#166534]" />
              </div>
              <div className="absolute top-4 right-4">
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="pt-10 pb-6 px-6 space-y-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                  {judul || "Judul Kegiatan"}
                </h4>
                <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                  {deskripsi || "Belum ada deskripsi yang ditambahkan."}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                  <span>
                    {tanggal
                      ? new Intl.DateTimeFormat("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(new Date(tanggal))
                      : "Pilih tanggal"}
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                  <span>
                    {waktuMulai || "--:--"} - {waktuSelesai || "--:--"} WIB
                  </span>
                </div>

                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                  <span>{lokasi || "Pilih lokasi"}</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <Users className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                  <span>
                    {kuota
                      ? `Maksimal ${kuota} peserta`
                      : "Kuota Tidak Terbatas"}
                  </span>
                </div>
              </div>

              {catatanTambahan && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h5 className="text-xs font-semibold text-gray-900 mb-1 uppercase tracking-wider">
                    Catatan untuk Peserta:
                  </h5>
                  <p className="text-sm text-gray-600 italic">
                    "{catatanTambahan}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
