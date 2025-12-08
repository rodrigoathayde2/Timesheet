/**
 * Utilitários para manipulação de datas
 */

/**
 * Retorna a data de início da semana (domingo)
 * @param date Data de referência
 * @returns Data do domingo da semana (formato YYYY-MM-DD)
 */
export function getWeekStartDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay(); // 0 = domingo, 1 = segunda, etc
  const diff = d.getDate() - day; // Ajusta para o domingo
  const weekStart = new Date(d.setDate(diff));
  return formatDate(weekStart);
}

/**
 * Retorna a data de fim da semana (sábado)
 */
export function getWeekEndDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  const diff = d.getDate() - day + 6; // Ajusta para o sábado
  const weekEnd = new Date(d.setDate(diff));
  return formatDate(weekEnd);
}

/**
 * Formata data para YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna a data atual no formato YYYY-MM-DD
 */
export function getCurrentDate(): string {
  return formatDate(new Date());
}

/**
 * Retorna o primeiro dia do mês
 */
export function getMonthStartDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

/**
 * Retorna o último dia do mês
 */
export function getMonthEndDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/**
 * Verifica se uma data está no futuro
 */
export function isFutureDate(date: string): boolean {
  const checkDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return checkDate > today;
}

/**
 * Retorna array de datas entre duas datas
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  while (start <= end) {
    dates.push(formatDate(new Date(start)));
    start.setDate(start.getDate() + 1);
  }
  
  return dates;
}

/**
 * Retorna todas as datas da semana
 */
export function getWeekDates(weekStartDate: string): string[] {
  const start = new Date(weekStartDate);
  const dates: string[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(formatDate(date));
  }
  
  return dates;
}

/**
 * Verifica se é dia útil (segunda a sexta)
 */
export function isWeekday(date: string): boolean {
  const d = new Date(date);
  const day = d.getDay();
  return day >= 1 && day <= 5;
}
