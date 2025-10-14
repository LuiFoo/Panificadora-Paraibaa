"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import Toast from "@/components/Toast";

interface ToastContextType {
  showToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

interface ToastData {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  let nextId = 0;

  const showToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div key={toast.id} style={{ marginTop: index > 0 ? '8px' : '0' }}>
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

