"use client";

import { useAuthSync } from "@/hooks/useAuthSync";

export default function AuthSync() {
  useAuthSync();
  return null; // Componente invisível que apenas sincroniza
}
