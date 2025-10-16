/**
 * Utilitários para validação e formatação de CEP
 */

/**
 * Valida se o CEP pertence a Ribeirão Preto
 * CEPs válidos: 14000-000 a 14109-999
 */
export function isValidRibeiraoPretoCEP(cep: string): boolean {
  // Remove todos os caracteres não numéricos
  const cepNumeros = cep.replace(/\D/g, '');
  
  // Verifica se tem 8 dígitos
  if (cepNumeros.length !== 8) {
    return false;
  }
  
  // Converte para número para fazer a comparação
  const cepNumero = parseInt(cepNumeros);
  
  // Ribeirão Preto: 14000000 a 14109999
  return cepNumero >= 14000000 && cepNumero <= 14109999;
}

/**
 * Formata CEP para o padrão XXXXX-XXX
 */
export function formatCEP(cep: string): string {
  // Remove todos os caracteres não numéricos
  const cepNumeros = cep.replace(/\D/g, '');
  
  // Se tem 8 dígitos, formata como XXXXX-XXX
  if (cepNumeros.length === 8) {
    return `${cepNumeros.slice(0, 5)}-${cepNumeros.slice(5)}`;
  }
  
  // Se tem 5 ou mais dígitos, adiciona o hífen
  if (cepNumeros.length >= 5) {
    return `${cepNumeros.slice(0, 5)}-${cepNumeros.slice(5)}`;
  }
  
  // Retorna apenas os números se for menos de 5 dígitos
  return cepNumeros;
}

/**
 * Formata CEP de forma mais inteligente, permitindo edição
 */
export function smartFormatCEP(cep: string, previousValue: string = ''): string {
  // Remove todos os caracteres não numéricos
  const cepNumeros = cep.replace(/\D/g, '');
  const previousNumeros = previousValue.replace(/\D/g, '');
  
  // Se não tem dígitos, retorna vazio
  if (cepNumeros.length === 0) {
    return '';
  }
  
  // Se o usuário está apagando (valor atual menor que anterior), 
  // não força a formatação até ter pelo menos 5 dígitos
  if (cepNumeros.length < previousNumeros.length && cepNumeros.length < 5) {
    return cepNumeros;
  }
  
  // Se tem 8 dígitos, formata como XXXXX-XXX
  if (cepNumeros.length === 8) {
    return `${cepNumeros.slice(0, 5)}-${cepNumeros.slice(5)}`;
  }
  
  // Se tem 5 ou mais dígitos, adiciona o hífen
  if (cepNumeros.length >= 5) {
    return `${cepNumeros.slice(0, 5)}-${cepNumeros.slice(5)}`;
  }
  
  // Retorna apenas os números se for menos de 5 dígitos
  return cepNumeros;
}

/**
 * Valida e formata CEP, retornando objeto com resultado
 */
export function validateAndFormatCEP(cep: string, previousValue: string = ''): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  const cepNumeros = cep.replace(/\D/g, '');
  
  // Se não tem dígitos, retorna vazio sem erro
  if (cepNumeros.length === 0) {
    return {
      isValid: false,
      formatted: '',
      error: ''
    };
  }
  
  // Verifica se tem 8 dígitos
  if (cepNumeros.length !== 8) {
    return {
      isValid: false,
      formatted: smartFormatCEP(cep, previousValue),
      error: cepNumeros.length < 8 ? '' : 'CEP deve ter 8 dígitos'
    };
  }
  
  // Verifica se é de Ribeirão Preto
  if (!isValidRibeiraoPretoCEP(cepNumeros)) {
    return {
      isValid: false,
      formatted: smartFormatCEP(cepNumeros, previousValue),
      error: 'Por enquanto, nosso serviço é limitado a Ribeirão Preto. CEPs válidos: 14000-000 a 14109-999'
    };
  }
  
  return {
    isValid: true,
    formatted: smartFormatCEP(cepNumeros, previousValue)
  };
}
