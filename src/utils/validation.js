// Configuración de códigos de país válidos y sus reglas
const COUNTRY_CODES = {
  '54': { // Argentina 
    name: 'Argentina',
    minLength: 10, // Sin código: 1123456789
    maxLength: 13, // Con código: 5411123456789
    mobilePatterns: [
      /^54(11|15)[0-9]{8}$/, // Buenos Aires: 5411xxxxxxxx, 5415xxxxxxxx
      /^54(2[0-9]{2}|3[0-9]{2}|4[0-9]{2})[0-9]{7}$/, // Interior: 54221xxxxxxx, 54351xxxxxxx, etc.
      /^54(9)(11|15)[0-9]{8}$/, // Con 9: 549115xxxxxxxx
      /^54(9)(2[0-9]{2}|3[0-9]{2}|4[0-9]{2})[0-9]{7}$/ // Interior con 9: 5492213xxxxxxx
    ],
    examples: ['221 123 4567', '11 1234 5678', '351 123 4567']
  },
  '598': { // Uruguay
    name: 'Uruguay', 
    minLength: 8,
    maxLength: 11,
    mobilePatterns: [/^598(9[0-9]{7})$/],
    examples: ['9 123 4567']
  },
  '55': { // Brasil
    name: 'Brasil',
    minLength: 10,
    maxLength: 13,
    mobilePatterns: [/^55(11|21|31|51|61|71|81|85)[0-9]{8,9}$/],
    examples: ['11 98765 4321']
  }
};

// Expresiones regulares mejoradas
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME: /^[a-zA-ZáéíóúñÁÉÍÓÚÑ'\s]{2,50}$/,
  COMMENT: /^[\w\s.,!?@#\-áéíóúñÁÉÍÓÚÑ'"()]{0,500}$/,
  // Regex básico para números (se valida más específicamente con las funciones)
  PHONE_BASIC: /^[\d\s\-\+\(\)]{8,20}$/
};

// 🔍 FUNCIONES DE VALIDACIÓN TELEFÓNICA AVANZADA

/**
 * Limpia y normaliza un número telefónico
 * @param {string} phone - Número telefónico raw
 * @param {string} countryCode - Código de país (ej: '54')
 * @returns {object} - { cleaned: string, formatted: string }
 */
export const cleanPhoneNumber = (phone, countryCode = '54') => {
  if (!phone) return { cleaned: '', formatted: '' };
  
  // Remover todos los caracteres no numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Remover códigos de país duplicados o prefijos incorrectos
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  
  // Para Argentina específicamente
  if (countryCode === '54') {
    // Remover el 0 inicial si existe (código de área argentino)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Remover 15 inicial duplicado (código móvil argentino)
    if (cleaned.startsWith('15')) {
      cleaned = cleaned.substring(2);
    }
    
    // Si no tiene código de país, agregarlo
    if (!cleaned.startsWith('54')) {
      cleaned = countryCode + cleaned;
    }
  }
  
  return {
    cleaned,
    formatted: formatPhoneDisplay(cleaned, countryCode)
  };
};

/**
 * Formatea un número para mostrar
 * @param {string} phone - Número limpio
 * @param {string} countryCode - Código de país
 * @returns {string} - Número formateado para mostrar
 */
const formatPhoneDisplay = (phone, countryCode = '54') => {
  if (!phone) return '';
  
  const config = COUNTRY_CODES[countryCode];
  if (!config) return phone;
  
  // Para Argentina
  if (countryCode === '54') {
    const withoutCountry = phone.replace(/^54/, '');
    
    if (withoutCountry.length >= 10) {
      // Buenos Aires: 11 1234-5678
      if (withoutCountry.startsWith('11') || withoutCountry.startsWith('15')) {
        return `${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 6)}-${withoutCountry.slice(6)}`;
      }
      // Interior: 221 123-4567  
      if (withoutCountry.length >= 10) {
        return `${withoutCountry.slice(0, 3)} ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
      }
    }
  }
  
  return phone;
};

/**
 * Valida si un número telefónico es válido para WhatsApp
 * @param {string} phone - Número telefónico limpio
 * @param {string} countryCode - Código de país
 * @returns {object} - { isValid: boolean, error: string, suggestions: array }
 */
export const validatePhoneNumber = (phone, countryCode = '54') => {
  if (!phone) {
    return {
      isValid: false,
      error: 'El número de teléfono es requerido',
      suggestions: []
    };
  }

  // Limpiar el número
  const { cleaned } = cleanPhoneNumber(phone, countryCode);
  
  if (!REGEX.PHONE_BASIC.test(phone)) {
    return {
      isValid: false,
      error: 'Formato de número inválido. Solo usa números, espacios, guiones o paréntesis.',
      suggestions: COUNTRY_CODES[countryCode]?.examples || []
    };
  }

  const config = COUNTRY_CODES[countryCode];
  if (!config) {
    return {
      isValid: false,
      error: `Código de país ${countryCode} no soportado`,
      suggestions: []
    };
  }

  // Validar longitud
  if (cleaned.length < config.minLength || cleaned.length > config.maxLength) {
    return {
      isValid: false,
      error: `El número debe tener entre ${config.minLength} y ${config.maxLength} dígitos para ${config.name}`,
      suggestions: config.examples
    };
  }

  // Validar patrones específicos del país
  const isValidPattern = config.mobilePatterns.some(pattern => pattern.test(cleaned));
  
  if (!isValidPattern) {
    return {
      isValid: false,
      error: `Formato de número móvil inválido para ${config.name}`,
      suggestions: config.examples
    };
  }

  return {
    isValid: true,
    error: null,
    suggestions: []
  };
};

/**
 * Formatea número para WhatsApp (sin + y sin espacios)
 * @param {string} phone - Número limpio
 * @param {string} countryCode - Código de país
 * @returns {string} - Número listo para WhatsApp
 */
export const formatPhoneForWhatsApp = (phone, countryCode = '54') => {
  const { cleaned } = cleanPhoneNumber(phone, countryCode);
  return cleaned;
};

// 🔍 VALIDACIÓN COMPLETA DE RESERVA

export const validateReservation = (data) => {
  const errors = {};

  // Validar fecha
  if (!data.fecha) {
    errors.fecha = 'La fecha es requerida';
  } else {
    const date = new Date(data.fecha + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (date < now) {
      errors.fecha = 'La fecha no puede ser en el pasado';
    }
  }

  // Validar turno
  if (!['mediodia', 'noche'].includes(data.turno)) {
    errors.turno = 'Turno inválido';
  }

  // Validar número de personas
  if (!data.personas || data.personas < 1 || data.personas > 20) {
    errors.personas = 'El número de personas debe estar entre 1 y 20';
  }

  // Validar datos del cliente
  if (data.cliente) {
    // Validar nombre
    if (!data.cliente.nombre || !REGEX.NAME.test(data.cliente.nombre.trim())) {
      errors.nombre = 'Nombre inválido. Solo letras, espacios y acentos (2-50 caracteres)';
    }
    
    // 📱 VALIDACIÓN ROBUSTA DE TELÉFONO
    const phoneValidation = validatePhoneNumber(
      data.cliente.telefono, 
      data.cliente.codigoPais || '54'
    );
    
    if (!phoneValidation.isValid) {
      errors.telefono = phoneValidation.error;
      errors.telefonoSuggestions = phoneValidation.suggestions;
    }
    
    // Validar email (opcional)
    if (data.cliente.email && !REGEX.EMAIL.test(data.cliente.email.trim())) {
      errors.email = 'Email inválido';
    }
    
    // Validar comentarios (opcional)
    if (data.cliente.comentarios && !REGEX.COMMENT.test(data.cliente.comentarios.trim())) {
      errors.comentarios = 'Comentarios contienen caracteres inválidos';
    }
  } else {
    errors.cliente = 'Datos del cliente requeridos';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// 🧹 SANITIZACIÓN MEJORADA

export const sanitizeData = (data) => {
  const sanitized = { ...data };
  
  if (sanitized.cliente) {
    const countryCode = sanitized.cliente.codigoPais || '54';
    const { cleaned: cleanedPhone } = cleanPhoneNumber(sanitized.cliente.telefono, countryCode);
    
    sanitized.cliente = {
      ...sanitized.cliente,
      nombre: sanitized.cliente.nombre?.trim(),
      telefono: cleanedPhone,
      email: sanitized.cliente.email?.toLowerCase().trim(),
      comentarios: sanitized.cliente.comentarios?.trim()
    };
  }

  return sanitized;
};

// 🔒 RATE LIMITING

const rateLimits = new Map();

export const checkRateLimit = (clientId, operation = 'default', limit = 5, windowMs = 60000) => {
  const key = `${clientId}:${operation}`;
  const now = Date.now();
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, [{timestamp: now}]);
    return true;
  }

  const requests = rateLimits.get(key).filter(req => req.timestamp > now - windowMs);
  
  if (requests.length >= limit) {
    return false;
  }

  requests.push({timestamp: now});
  rateLimits.set(key, requests);
  return true;
};

// 📱 UTILIDADES ADICIONALES

/**
 * Detecta si un número puede recibir WhatsApp (heurística básica)
 * @param {string} phone - Número limpio
 * @param {string} countryCode - Código de país
 * @returns {boolean}
 */
export const isWhatsAppCapable = (phone, countryCode = '54') => {
  const phoneValidation = validatePhoneNumber(phone, countryCode);
  
  // Solo números móviles válidos pueden tener WhatsApp
  return phoneValidation.isValid;
};

/**
 * Genera sugerencias de formato para el usuario
 * @param {string} countryCode - Código de país
 * @returns {array} - Array de ejemplos
 */
export const getPhoneExamples = (countryCode = '54') => {
  return COUNTRY_CODES[countryCode]?.examples || ['Formato no disponible'];
}; 