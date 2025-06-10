// Expresiones regulares para validación
const REGEX = {
  PHONE: /^\+?[0-9]{10,15}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME: /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]{2,50}$/,
  COMMENT: /^[\w\s.,!?@#-]{0,500}$/
};

// Validación de datos de reserva
export const validateReservation = (data) => {
  const errors = {};

  // Validar fecha
  if (!data.fecha) {
    errors.fecha = 'La fecha es requerida';
  } else {
    const date = new Date(data.fecha);
    const now = new Date();
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
    if (!REGEX.NAME.test(data.cliente.nombre)) {
      errors.nombre = 'Nombre inválido';
    }
    if (!REGEX.PHONE.test(data.cliente.telefono)) {
      errors.telefono = 'Teléfono inválido';
    }
    if (data.cliente.email && !REGEX.EMAIL.test(data.cliente.email)) {
      errors.email = 'Email inválido';
    }
    if (data.cliente.comentarios && !REGEX.COMMENT.test(data.cliente.comentarios)) {
      errors.comentarios = 'Comentarios inválidos';
    }
  } else {
    errors.cliente = 'Datos del cliente requeridos';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitización de datos
export const sanitizeData = (data) => {
  const sanitized = { ...data };
  
  if (sanitized.cliente) {
    sanitized.cliente = {
      ...sanitized.cliente,
      nombre: sanitized.cliente.nombre?.trim(),
      telefono: sanitized.cliente.telefono?.replace(/\D/g, ''),
      email: sanitized.cliente.email?.toLowerCase().trim(),
      comentarios: sanitized.cliente.comentarios?.trim()
    };
  }

  return sanitized;
};

// Rate limiting simple (para protección básica contra spam)
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