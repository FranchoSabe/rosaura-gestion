/**
 * Configuración de días operativos del restaurante
 * 
 * TEMPORAL: Control para habilitar/deshabilitar reservas los lunes
 */

// TEMPORAL: Habilitar lunes para reservas
export const MONDAY_RESERVATIONS_ENABLED = true;

/**
 * Verifica si un día específico está cerrado
 * @param {number} dayOfWeek - Día de la semana (0=domingo, 1=lunes, etc.)
 * @returns {boolean} true si el día está cerrado
 */
export const isDayClosed = (dayOfWeek) => {
  // Lunes: depende de la configuración temporal
  if (dayOfWeek === 1 && !MONDAY_RESERVATIONS_ENABLED) {
    return true; // Lunes cerrado cuando está deshabilitado
  }
  
  return false; // Otros días abiertos
};

/**
 * Verifica si un turno específico está cerrado
 * @param {number} dayOfWeek - Día de la semana (0=domingo, 1=lunes, etc.)
 * @param {string} turno - 'mediodia' o 'noche'
 * @returns {boolean} true si el turno está cerrado
 */
export const isTurnoClosed = (dayOfWeek, turno) => {
  // Lunes: depende de la configuración temporal
  if (dayOfWeek === 1 && !MONDAY_RESERVATIONS_ENABLED) {
    return true; // Lunes cerrado ambos turnos cuando está deshabilitado
  }
  
  // Domingos: turno noche cerrado siempre
  if (dayOfWeek === 0 && turno === 'noche') {
    return true; // Domingos sin turno noche
  }
  
  return false;
};

/**
 * Obtiene lista de horarios disponibles para una fecha y turno
 * Devuelve array vacío si el día/turno está cerrado
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} turno - 'mediodia' o 'noche'
 * @param {object} horarios - Objeto con horarios por turno
 * @returns {array} Array de horarios disponibles
 */
export const getAvailableHours = (fecha, turno, horarios) => {
  const fechaObj = new Date(fecha + "T00:00:00");
  const dayOfWeek = fechaObj.getDay();
  
  // Verificar si el turno está cerrado
  if (isTurnoClosed(dayOfWeek, turno)) {
    return []; // Día/turno cerrado
  }
  
  // Devolver horarios del turno
  return horarios[turno] || [];
};

/**
 * Mensaje explicativo sobre días cerrados
 * @param {number} dayOfWeek - Día de la semana
 * @returns {string} Mensaje explicativo
 */
export const getClosedDayMessage = (dayOfWeek) => {
  if (dayOfWeek === 1 && !MONDAY_RESERVATIONS_ENABLED) {
    return 'Los lunes permanecemos cerrados temporalmente';
  }
  
  return 'Día no disponible para reservas';
};

/**
 * Configuración temporal - cambiar aquí para habilitar/deshabilitar lunes
 */
export const OPERATING_CONFIG = {
  mondayEnabled: MONDAY_RESERVATIONS_ENABLED,
  sundayNightEnabled: false, // Domingos noche siempre cerrado
  
  // Método para cambiar configuración temporalmente
  enableMondays: () => {
    // En producción esto podría actualizarse en base de datos
    // console.log('Lunes habilitados temporalmente');
  },
  
  disableMondays: () => {
    // En producción esto podría actualizarse en base de datos
    // console.log('Lunes deshabilitados');
  }
};