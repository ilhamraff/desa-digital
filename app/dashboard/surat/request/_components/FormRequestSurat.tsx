"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, X, File as FileIcon, CheckCircle, Search, FileText } from "lucide-react";
import { ToastContainer } from "@/components/Toast";

interface Profile {
  id: string;
  nama: string;
  rt: string;
  rw: string;
}

interface FormRequestSuratProps {
  profiles: Profile[];
}

const JENIS_SURAT_OPTIONS = [
  "Surat Keterangan Domisili",
  "Surat Keterangan Tidak Mampu (SKTM)",
  "Surat Keterangan Usaha",
  "Surat Pengantar KTP/KK",
  "Surat Izin Kegiatan",
  "Surat Keterangan Kematian",
  "Lainnya"
];

export default function FormRequestSurat({ profiles }: FormRequestSuratProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [jenisSurat, setJenisSurat] = useState("");
  const [jenisLainnya, setJenisLainnya] = useState("");
  const [keperluan, setKeperluan] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Filter profiles based on search
  const filteredProfiles = profiles.filter(p => 
    p.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    // Validasi jumlah file (maks 3)
    if (files.length + selectedFiles.length > 3) {
      showToast("error", "Error", "Maksimal 3 file dokumen pendukung.");
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    selectedFiles.forEach(file => {
      // Validasi ukuran (maks 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "File Terlalu Besar", `File ${file.name} melebihi 5MB.`);
        return;
      }
      
      // Validasi tipe (image atau pdf)
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        showToast("error", "Format Tidak Didukung", `File ${file.name} harus berupa gambar atau PDF.`);
        return;
      }

      validFiles.push(file);
      
      if (file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        // Mock preview for PDF
        newPreviews.push('pdf');
      }
    });

    setFiles([...files, ...validFiles]);
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    
    // Revoke object URL to avoid memory leaks
    if (newPreviews[index] !== 'pdf') {
      URL.revokeObjectURL(newPreviews[index]);
    }
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const uploadFiles = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedProfileId}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('surat-dokumen')
        .upload(filePath, file);
        
      if (error) {
        console.error("Error uploading file:", error);
        throw new Error(`Gagal mengupload ${file.name}`);
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('surat-dokumen')
        .getPublicUrl(filePath);
        
      uploadedUrls.push(publicUrlData.publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi
    if (!selectedProfileId) {
      showToast("error", "Error", "Pilih pemohon terlebih dahulu.");
      return;
    }
    
    if (!jenisSurat) {
      showToast("error", "Error", "Pilih jenis surat.");
      return;
    }
    
    const finalJenisSurat = jenisSurat === "Lainnya" ? jenisLainnya : jenisSurat;
    
    if (jenisSurat === "Lainnya" && !jenisLainnya.trim()) {
      showToast("error", "Error", "Sebutkan jenis surat lainnya.");
      return;
    }
    
    if (keperluan.trim().length < 20) {
      showToast("error", "Error", "Keperluan minimal 20 karakter.");
      return;
    }

    try {
      setIsLoading(true);
      
      // Upload dokumen jika ada
      let fileUrls: string[] = [];
      if (files.length > 0) {
        fileUrls = await uploadFiles();
      }
      
      // Insert ke tabel surat
      const { data, error } = await supabase
        .from('surat')
        .insert({
          pemohon_id: selectedProfileId,
          jenis_surat: finalJenisSurat,
          keperluan: keperluan.trim(),
          status: 'pending',
          file_urls: fileUrls.length > 0 ? fileUrls : null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      showToast("success", "Berhasil", "Permohonan surat berhasil diajukan!");
      
      // Tunggu sebentar agar toast terlihat
      setTimeout(() => {
        router.push(`/dashboard/surat`);
      }, 1500);
      
    } catch (err: any) {
      showToast("error", "Gagal", err.message || "Terjadi kesalahan saat menyimpan data.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Pilih Pemohon */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-gray-700">
            Pemohon <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div 
              className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-lg cursor-pointer ${
                selectedProfileId ? 'border-green-500 bg-green-50/30' : 'border-gray-300 bg-white'
              }`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className={selectedProfileId ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                {selectedProfile ? `${selectedProfile.nama} — RT ${selectedProfile.rt}/RW ${selectedProfile.rw}` : 'Pilih Warga...'}
              </span>
              <Search className="w-5 h-5 text-gray-400" />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Cari nama warga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div className="overflow-y-auto p-1">
                  {filteredProfiles.length === 0 ? (
                    <div className="p-3 text-center text-sm text-gray-500">Tidak ada data warga ditemukan.</div>
                  ) : (
                    filteredProfiles.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProfileId(p.id);
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                        }}
                        className="px-3 py-2 hover:bg-green-50 rounded-md cursor-pointer flex flex-col"
                      >
                        <span className="font-medium text-gray-800">{p.nama}</span>
                        <span className="text-xs text-gray-500">RT {p.rt}/RW {p.rw}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Jenis Surat */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Jenis Surat <span className="text-red-500">*</span>
          </label>
          <select
            value={jenisSurat}
            onChange={(e) => setJenisSurat(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 bg-white"
          >
            <option value="" disabled>Pilih Jenis Surat...</option>
            {JENIS_SURAT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          
          {jenisSurat === "Lainnya" && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2">
              <input
                type="text"
                placeholder="Tuliskan jenis surat..."
                value={jenisLainnya}
                onChange={(e) => setJenisLainnya(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
              />
            </div>
          )}
        </div>

        {/* 3. Keperluan */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Keperluan / Tujuan Surat <span className="text-red-500">*</span>
          </label>
          <textarea
            value={keperluan}
            onChange={(e) => setKeperluan(e.target.value)}
            placeholder="Contoh: Untuk mendaftar beasiswa di Universitas X..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 min-h-[120px]"
          />
          <div className="flex justify-between items-center text-xs">
            <span className={keperluan.length > 0 && keperluan.length < 20 ? "text-red-500" : "text-gray-500"}>
              Minimal 20 karakter
            </span>
            <span className="text-gray-500">{keperluan.length} karakter</span>
          </div>
        </div>

        {/* 4. Dokumen Pendukung */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Dokumen Pendukung <span className="text-gray-400 font-normal">(Opsional)</span>
          </label>
          
          <div 
            onClick={() => files.length < 3 && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              files.length >= 3 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-green-400 cursor-pointer'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {files.length >= 3 ? 'Batas maksimal file tercapai' : 'Klik untuk upload dokumen'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Mendukung JPG, PNG, atau PDF (Max 5MB). Maksimal 3 file.
                </p>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              disabled={files.length >= 3}
            />
          </div>

          {/* Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {files.map((file, index) => (
                <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex items-center p-2 gap-3 h-16">
                  <div className="w-12 h-12 shrink-0 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                    {previews[index] === 'pdf' ? (
                      <FileText className="w-6 h-6 text-red-500" />
                    ) : (
                      <img src={previews[index]} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="w-6 h-6 shrink-0 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading || !selectedProfileId || !jenisSurat || keperluan.length < 20}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Ajukan Permohonan Surat
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
