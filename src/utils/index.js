/**
 * Exports centralizados de utilidades
 */

export * from './phoneUtils';

/**
 * Convierte un objeto Date a string en formato YYYY-MM-DD
 * sin problemas de zona horaria
 * @param {Date} date - Objeto Date a convertir
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export const formatDateToString = (date) => {
  if (!date) return '';
  
  if (!(date instanceof Date)) {
    // Si ya es string, retornarlo (asumiendo que está en formato correcto)
    return date;
  }
  
  // Usar métodos locales para evitar problemas de zona horaria
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}; 