'use client'

import React from 'react'
import { Eye, Pencil, Trash2, Database } from 'lucide-react'

// Interface untuk definisi struktur kolom
export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => React.ReactNode
}

// Interface untuk props dari DataTable, menggunakan generic T untuk tipe data baris
export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
}: DataTableProps<T>) {
  // Mengecek apakah kolom aksi perlu ditampilkan
  // Kolom aksi muncul jika salah satu dari onEdit, onDelete, atau onView di-provide
  const hasActions = !!(onEdit || onDelete || onView)

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Wrapper untuk enable horizontal scrolling di mobile */}
      <div className="overflow-x-auto whitespace-nowrap">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#166534] text-white">
            <tr>
              {columns.map((col, index) => (
                <th key={String(col.key) + index} className="px-6 py-4 font-medium">
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-4 font-medium text-right">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* State Loading: Menampilkan 5 baris skeleton shimmer rata-rata */}
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="animate-pulse odd:bg-white even:bg-gray-50">
                  {columns.map((col, colIndex) => (
                    <td key={`skeleton-col-${colIndex}`} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              /* State Kosong */
              <tr>
                <td 
                  colSpan={columns.length + (hasActions ? 1 : 0)} 
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Database className="w-8 h-8 text-gray-400" />
                    <p>Belum ada data</p>
                  </div>
                </td>
              </tr>
            ) : (
              /* State Data Ditemukan */
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="group odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  {columns.map((col, colIndex) => {
                    const value = row[col.key as keyof T]
                    return (
                      <td key={String(col.key) + colIndex} className="px-6 py-4">
                        {/* Jika ada fungsi render kustom, gunakan itu. Jika tidak, konversi value ke node */}
                        {col.render ? col.render(value, row) : (value as React.ReactNode)}
                      </td>
                    )
                  })}
                  {hasActions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
