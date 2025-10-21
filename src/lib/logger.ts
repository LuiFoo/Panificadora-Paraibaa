/**
 * Sistema de logging para desenvolvimento e produção
 * Em produção, logs sensíveis não são exibidos
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log para informações gerais (sempre exibido)
   */
  info: (...args: unknown[]) => {
    console.log(...args);
  },

  /**
   * Log para desenvolvimento (apenas em dev)
   */
  dev: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log de erro (sempre exibido, mas sem detalhes sensíveis em produção)
   */
  error: (message: string, error?: unknown) => {
    if (isDevelopment) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  },

  /**
   * Log de warning (sempre exibido)
   */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /**
   * Log de debug (apenas em dev)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('🔍 DEBUG:', ...args);
    }
  }
};

