"use client";

import React, { createContext, useContext, ReactNode, useEffect } from "react";

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


export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    // Sistema de toast desabilitado - não mostra notificações
    console.log(`Toast (${type}): ${message}`);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

