/**
 * Utilitários de validação e parsing
 */

/**
 * Parse seguro de inteiro com validação
 * @param value - Valor para fazer parse
 * @param defaultValue - Valor padrão se parsing falhar
 * @returns Número inteiro válido
 */
export function safeParseInt(value: string | number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }
  
  return Math.floor(parsed); // Garante que é inteiro
}

/**
 * Parse seguro de float com validação
 * @param value - Valor para fazer parse
 * @param defaultValue - Valor padrão se parsing falhar
 * @returns Número decimal válido
 */
export function safeParseFloat(value: string | number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }
  
  return parsed;
}

/**
 * Valida se um número está dentro de um range
 * @param value - Valor para validar
 * @param min - Valor mínimo (inclusivo)
 * @param max - Valor máximo (inclusivo)
 * @returns true se o valor está no range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Clamp um número dentro de um range
 * @param value - Valor para limitar
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns Valor limitado ao range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Valida formato de email
 * @param email - Email para validar
 * @returns true se o email é válido
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida formato de hora (HH:MM)
 * @param time - Hora para validar
 * @returns Objeto com hora e minuto se válido, null caso contrário
 */
export function parseTime(time: string): { hour: number; minute: number } | null {
  if (!time || typeof time !== 'string') {
    return null;
  }
  
  const parts = time.split(':');
  if (parts.length !== 2) {
    return null;
  }
  
  const hour = safeParseInt(parts[0], -1);
  const minute = safeParseInt(parts[1], -1);
  
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  
  return { hour, minute };
}

/**
 * Valida CEP brasileiro
 * @param cep - CEP para validar (com ou sem formatação)
 * @returns true se o CEP é válido
 */
export function isValidCEP(cep: string): boolean {
  if (!cep || typeof cep !== 'string') {
    return false;
  }
  
  // Remove formatação
  const cepNumeros = cep.replace(/\D/g, '');
  
  // Verifica se tem 8 dígitos
  if (cepNumeros.length !== 8) {
    return false;
  }
  
  // Verifica se não é sequência inválida (00000000, 11111111, etc)
  if (/^(\d)\1{7}$/.test(cepNumeros)) {
    return false;
  }
  
  return true;
}

/**
 * Valida telefone brasileiro
 * @param phone - Telefone para validar
 * @returns true se o telefone é válido
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove formatação
  const phoneNumeros = phone.replace(/\D/g, '');
  
  // Aceita 10 ou 11 dígitos (DDD + telefone)
  if (phoneNumeros.length < 10 || phoneNumeros.length > 11) {
    return false;
  }
  
  return true;
}

/**
 * Sanitiza string removendo caracteres perigosos
 * @param input - String para sanitizar
 * @returns String sanitizada
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove tags HTML
  return input
    .replace(/<[^>]*>/g, '')
    .trim();
}

