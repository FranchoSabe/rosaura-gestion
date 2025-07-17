// CONSTANTES GLOBALES DEL SISTEMA

// CONFIGURACION DE DIAS DE OPERACION

// TEMPORAL: Habilitar lunes para reservas
export const MONDAY_RESERVATIONS_ENABLED = true;

// Función para verificar si un día está cerrado
export const isDayClosed = (dayOfWeek) => {
  // dayOfWeek: 0=domingo, 1=lunes, 2=martes, etc.
  
  if (dayOfWeek === 1 && !MONDAY_RESERVATIONS_ENABLED) {
    return true; // Lunes cerrado (cuando está deshabilitado)
  }
  
  return false; // Otros días abiertos
};

// Función para verificar si un turno específico está cerrado
export const isTurnoClosed = (dayOfWeek, turno) => {
  // Lunes: depende de la configuración
  if (dayOfWeek === 1 && !MONDAY_RESERVATIONS_ENABLED) {
    return true; // Lunes cerrado ambos turnos (cuando está deshabilitado)
  }
  
  // Domingos: turno noche cerrado siempre
  if (dayOfWeek === 0 && turno === 'noche') {
    return true; // Domingos sin turno noche
  }
  
  return false;
};

// CONFIGURACION DE CONTACTO

export const RESTAURANT_CONFIG = {
  name: 'Rosaura',
  phone: '+5491234567890',
  email: 'info@rosaura.com',
  address: 'Dirección del restaurante',
  
  // Horarios de atención
  hours: {
    mediodia: {
      start: '12:00',
      end: '16:00',
      lastReservation: '15:30'
    },
    noche: {
      start: '20:00', 
      end: '24:00',
      lastReservation: '23:30'
    }
  },
  
  // Capacidad del restaurante
  capacity: {
    maxPersonsPerReservation: 6,
    tablesCount: 24,
    walkInTables: [4, 5, 14, 24] // Mesas reservadas para walk-ins
  }
};

// Exportar todas las constantes de modificadores
export * from './modifiers'; 