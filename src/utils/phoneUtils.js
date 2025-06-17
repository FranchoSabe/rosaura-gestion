/**
 * Utilidades para manejo de números de teléfono
 */

/**
 * Formatea un teléfono para WhatsApp (lógica Argentina completa)
 * @param {string} phone - Número de teléfono
 * @returns {string} - Teléfono formateado para WhatsApp
 */
export const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  
  // Ya tiene código de país 54
  if (cleaned.startsWith('54')) {
    return cleaned;
  }
  
  // Número con 0 inicial (formato local argentino)
  if (cleaned.startsWith('0')) {
    return '54' + cleaned.substring(1);
  }
  
  // Número con 9 inicial (celular)
  if (cleaned.startsWith('9')) {
    return `54${cleaned}`;
  }
  
  // Número sin código, agregar 549
  return `549${cleaned}`;
};

/**
 * Formatea un teléfono para mostrar (con formato argentino)
 * @param {string} phone - Número de teléfono
 * @returns {string} - Teléfono formateado para mostrar
 */
export const formatPhoneDisplay = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  
  // Formato argentino: +54 9 11 1234-5678
  if (cleaned.length >= 10) {
    return `+54 9 ${cleaned.slice(-8, -4)}-${cleaned.slice(-4)}`;
  }
  
  return phone;
};

/**
 * Valida si un teléfono argentino es válido
 * @param {string} phone - Número de teléfono
 * @returns {boolean} - True si es válido
 */
export const isValidArgentinePhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 13;
}; 