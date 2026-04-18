"use client";

import { useState, useEffect, useCallback } from "react";

export type ToastVariant = "success" | "error" | "warning";

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  message: string;
  removing?: boolean;
}

// State Global agar toast bisa dishare antar komponen/hook instances
let toastList: ToastData[] = [];
const listeners: Set<Function> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toastList]));
};

// Global actions untuk toast (digunakan oleh ToastContainer untuk remove)
export const toastActions = {
  removeToast: (id: string) => {
    // 1. Ubah field removing menjadi true untuk trigger animasi keluar
    toastList = toastList.map((t) => (t.id === id ? { ...t, removing: true } : t));
    notifyListeners();

    // 2. Hapus data sepenuhnya dari state setelah animasi CSS selesai
    setTimeout(() => {
      toastList = toastList.filter((t) => t.id !== id);
      notifyListeners();
    }, 300); // durasi slideOut 0.3s
  },
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>(toastList);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, title: string, message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      toastList = [...toastList, { id, variant, title, message }];
      notifyListeners();
    },
    []
  );

  return { showToast, toasts };
}
