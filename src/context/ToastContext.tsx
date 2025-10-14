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
  // Toasts desabilitados - mensagens agora aparecem inline no frontend
  const showToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    // Função vazia - não mostra mais pop-ups
    // As mensagens já aparecem inline nas páginas (como em produtos/[id])
    console.log(`[${type.toUpperCase()}]`, message); // Log para debug
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

