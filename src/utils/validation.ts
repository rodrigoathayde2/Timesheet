/**
 * Utilitários de validação
 */

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * Valida força da senha
 * Mínimo 8 caracteres, maiúsculas, minúsculas, números
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers;
}

/**
 * Valida horas (deve estar entre 0.25 e 24)
 */
export function isValidHours(hours: number): boolean {
  return hours >= 0.25 && hours <= 24 && Number.isFinite(hours);
}

/**
 * Valida se horas estão no múltiplo de 0.25 (15 minutos)
 */
export function isQuarterHour(hours: number): boolean {
  return (hours * 4) % 1 === 0;
}

/**
 * Valida data no formato YYYY-MM-DD
 */
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
export function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '');
}

/**
 * Valida se string não está vazia
 */
export function isNotEmpty(str: string | undefined | null): boolean {
  return str !== undefined && str !== null && str.trim().length > 0;
}

/**
 * Valida se valor é um número positivo
 */
export function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
