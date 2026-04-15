"use client"

import React, { useState } from 'react'
import { DataTable, Column } from '@/components/DataTable'
import { ConfirmModal } from '@/components/ConfirmModal'
import { StatusBadge } from '@/components/StatusBadge'

interface DummyData {
  id: number
  nama: string
  status: string
  tanggal: string
}

export default function TestPage() {
  // State untuk ConfirmModal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalLoading, setIsModalLoading] = useState(false)

  // Definisi Kolom DataTable
  const columns: Column<DummyData>[] = [
    { key: 'nama', label: 'Nama' },
    { 
      key: 'status', 
      label: 'Status',
      // Menggunakan komponen StatusBadge untuk render kolom status
      render: (value) => <StatusBadge status={String(value)} />
    },
    { key: 'tanggal', label: 'Tanggal' },
  ]

  // Data Dummy Normal
  const dataNormal: DummyData[] = [
    { id: 1, nama: 'Budi Santoso', status: 'pending', tanggal: '2026-04-10' },
    { id: 2, nama: 'Siti Aminah', status: 'diproses', tanggal: '2026-04-12' },
    { id: 3, nama: 'Joko Widodo', status: 'selesai', tanggal: '2026-04-15' },
  ]

  // Handler Konfirmasi Modal
  const handleConfirm = () => {
    setIsModalLoading(true)
    // Simulasi request network selama 2 detik
    setTimeout(() => {
      setIsModalLoading(false)
      setIsModalOpen(false)
      alert("Data berhasil dihapus!")
    }, 2000)
  }

  // Semua Status untuk testing
  const allStatuses = [
    'pending', 'diproses', 'selesai', 'ditolak', 
    'aktif', 'nonaktif', 'tersalurkan', 'belum_bayar', 
    'lunas', 'jatuh_tempo', 'kustom_status'
  ]

  return (
    <div className="p-8 space-y-12 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Halaman Testing Komponen UI</h1>
        <p className="text-gray-500">Halaman sementara untuk memastikan semua komponen custom bekerja dengan baik.</p>
      </div>

      {/* 1. Pengujian DataTable */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">1. DataTable</h2>
        
        {/* State Normal */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            State: Normal (Dengan Data)
          </h3>
          <DataTable 
            columns={columns} 
            data={dataNormal} 
            onEdit={(row) => alert(`Edit diklik untuk ID: ${row.id}`)}
            onDelete={(row) => alert(`Hapus diklik untuk ID: ${row.id}`)}
            onView={(row) => alert(`Lihat detail diklik untuk ID: ${row.id}`)}
          />
        </div>

        {/* State Loading */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            State: Loading
          </h3>
          <DataTable 
            columns={columns} 
            data={[]} 
            isLoading={true} 
            // Dummy props agar Header Aksi tetap ter-render
            onEdit={() => {}} 
          />
        </div>

        {/* State Kosong */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            State: Kosong (Empty Data)
          </h3>
          <DataTable 
            columns={columns} 
            data={[]} 
            onDelete={() => {}} 
          />
        </div>
      </section>

      {/* 2. Pengujian ConfirmModal */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">2. ConfirmModal</h2>
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
          >
            Buka Confirm Modal ('danger' variant)
          </button>
        </div>

        <ConfirmModal
          isOpen={isModalOpen}
          title="Hapus Data Penduduk"
          message="Apakah Anda yakin ingin menghapus data atas nama 'Budi Santoso'? Aksi ini tidak dapat dibatalkan, dan data yang terkait juga akan turut terhapus selamanya."
          confirmVariant="danger"
          confirmLabel="Ya, Mengerti"
          isLoading={isModalLoading}
          onConfirm={handleConfirm}
          onCancel={() => setIsModalOpen(false)}
        />
      </section>

      {/* 3. Pengujian StatusBadge */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">3. StatusBadge Variasi</h2>
        <div className="flex flex-wrap gap-6 items-center p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          {allStatuses.map((status) => (
            <div key={status} className="flex flex-col items-center gap-3 w-24">
              <code className="text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded">{status}</code>
              <StatusBadge status={status} />
            </div>
          ))}
        </div>
      </section>
      
    </div>
  )
}
