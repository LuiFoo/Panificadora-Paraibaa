"use client";

import { usePermissionSync } from "@/hooks/usePermissionSync";

/**
 * Componente para sincronizar permissões em tempo real
 * Deve ser usado no layout principal para funcionar em toda a aplicação
 */
export function PermissionSync() {
  usePermissionSync();
  return null; // Componente invisível
}

