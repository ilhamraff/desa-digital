"use client";

import React, { useEffect, useRef } from "react";
import { TriangleAlert, Loader2 } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Hapus",
  confirmVariant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape untuk menutup moda dan Tab untuk Aksesibilitas (Focus Trap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tombol Escape menutup modal jika tidak sedang proses loading
      if (e.key === "Escape" && isOpen && !isLoading) {
        onCancel();
      }

      // Terapkan Focus Trap jika menekan tombol Tab
      if (e.key === "Tab" && isOpen && modalRef.current) {
        const focusableElements =
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );

        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            // Shift + Tab (arah terbalik)
            if (
              document.activeElement === firstElement ||
              document.activeElement === document.body
            ) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            // Normal Tab (arah maju)
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Cegah scroll konten di background

      // Auto-fokus ke elemen interaktif pertama (Tombol Batal) agar mudah diakses
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements =
            modalRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 10);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Kembalikan fungsional scroll
    };
  }, [isOpen, isLoading, onCancel]);

  // Jangan render apapun jika tidak terbuka
  if (!isOpen) return null;

  // Data config styling berdasarkan varian confirm
  const variantStyles = {
    danger: {
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
      buttonBg: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    },
    warning: {
      iconColor: "text-orange-500",
      iconBg: "bg-orange-100",
      buttonBg:
        "bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500",
    },
    primary: {
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      buttonBg: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    },
  };

  const currentVariant = variantStyles[confirmVariant];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Inline styles agar animasi masuk tidak bergantung pada library tambahan tailwind */}
      <style>{`
        @keyframes modalOverlayEnter {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalContentEnter {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Overlay Gelap */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ animation: "modalOverlayEnter 0.2s ease-out forwards" }}
        onClick={() => {
          if (!isLoading) onCancel(); // Tutup saat overlay di klik, kecuali jika state loading
        }}
        aria-hidden="true"
      />

      {/* Konten Modal di Tengah */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ animation: "modalContentEnter 0.2s ease-out forwards" }}
        className="relative z-10 w-full max-w-[400px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col"
      >
        <div className="p-6 flex flex-col items-center text-center">
          {/* Ikon Peringatan / Icon Warning */}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${currentVariant.iconBg}`}
          >
            <TriangleAlert
              className={`w-7 h-7 ${currentVariant.iconColor}`}
              strokeWidth={2.5}
            />
          </div>

          {/* Judul Besar */}
          <h3 id="modal-title" className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>

          {/* Pesan Instruksi */}
          <p className="text-gray-500 text-[15px] leading-relaxed">{message}</p>
        </div>

        {/* Baris Tombol Aksi - Footer Modal */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end items-center border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100/50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] ${currentVariant.buttonBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wait...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
