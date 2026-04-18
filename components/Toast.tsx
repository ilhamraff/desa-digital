"use client";

import React, { useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";
import { useToast, toastActions, ToastData } from "@/hooks/useToast";

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-3 pointer-events-none">
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutToRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .animate-toast-in {
          animation: slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-toast-out {
          animation: slideOutToRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastData }) {
  useEffect(() => {
    // Auto-hilang setelah 4 detik
    const timer = setTimeout(() => {
      toastActions.removeToast(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id]);

  const variantStyles = {
    success: {
      border: "border-green-500",
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    },
    error: {
      border: "border-red-500",
      icon: <XCircle className="w-5 h-5 text-red-500" />,
    },
    warning: {
      border: "border-orange-500",
      icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    },
  };

  const currentStyle = variantStyles[toast.variant];

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm min-w-[300px] overflow-hidden bg-white rounded-lg shadow-xl border-l-4 ${currentStyle.border} p-4 ${
        toast.removing ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <div className="shrink-0 mr-3 mt-0.5">{currentStyle.icon}</div>
      <div className="flex-1 w-0">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {toast.title}
        </p>
        <p className="text-sm text-gray-500">{toast.message}</p>
      </div>
      <div className="ml-4 shrink-0 flex items-start">
        <button
          onClick={() => toastActions.removeToast(toast.id)}
          className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded transition-colors"
        >
          <span className="sr-only">Tutup</span>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
