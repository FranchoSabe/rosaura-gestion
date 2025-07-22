/**
 * reservationService.js - Servicio Unificado de Reservas
 * 
 * Este archivo centraliza TODA la lógica de reservas:
 * ✅ Creación de reservas (admin + cliente)
 * ✅ Asignación automática de mesas UNIFICADA
 * ✅ Validaciones de cupos
 * ✅ Gestión de lista de espera
 * ✅ Lógica de cliente/admin unificada
 * 
 * ELIMINA duplicación de código y centraliza en un solo lugar.
 */

import { addClient, addReservation, addWaitingReservation } from '../../firebase';
import {
  calculateRealTableStates,
  assignTableAutomatically,
  validateTableAvailability,
  assignTableToNewReservation
} from './tableManagementService';
import {
  UNIFIED_TABLES_LAYOUT,
  UNIFIED_RESERVATION_ORDER,
  UNIFIED_DEFAULT_BLOCKED_TABLES
} from '../../utils/tablesLayout';
import { isTurnoClosed } from '../constants/operatingDays';
import { parsePhoneNumber } from 'react-phone-number-input';
import { formatDateToString } from '../../utils';

// =================== CONFIGURACIÓN ===================

// =================== FUNCIÓN PRINCIPAL ===================

/**
 * FUNCIÓN PRINCIPAL: Crear reserva unificada
 * Usa el nuevo sistema de gestión de mesas para asignación automática
 */
export const createReservation = async (reservationData, options = {}) => {
  const {
    isAdmin = false,
    getAvailableSlots = null,
    existingReservations = [],
    loadBlockedTables = null,
    existingOrders = [],
    manualBlocks = new Set()
  } = options;
  try {
    // Iniciando creación de reserva

    // PASO 1: Validaciones iniciales
    const validation = await validateReservationData(reservationData, getAvailableSlots, isAdmin);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // PASO 2: Preparar datos del cliente (aún sin crearlo en la base)
    const clientData = await prepareClientData(reservationData.cliente);

    // PASO 3: Verificar disponibilidad con el sistema unificado
    const fechaString = typeof reservationData.fecha === 'string'
      ? reservationData.fecha
      : formatDateToString(reservationData.fecha);

    // PASO 3.1: Calcular estado real de las mesas
    const realTableStates = calculateRealTableStates(
      existingReservations,
      existingOrders,
      manualBlocks,
      fechaString,
      reservationData.turno
    );

    // PASO 3.2: Validar disponibilidad antes de crear la reserva
    const availability = validateTableAvailability({
      personas: reservationData.personas,
      fecha: fechaString,
      turno: reservationData.turno
    }, realTableStates);

    // Validación de disponibilidad realizada

    // PASO 4: Decidir entre reserva confirmada o lista de espera
    const shouldGoToWaitingList = !isAdmin && (
      reservationData.willGoToWaitingList || 
      !availability.hasAvailability
    );

    if (shouldGoToWaitingList) {
      // Crear cliente solo si realmente se almacenará la solicitud
      const clientId = await addClient(clientData);
      return await createWaitingReservation({
        reservationData: { ...reservationData, fecha: fechaString },
        clientId,
        clientData
      });
    }

    // PASO 5: Asignar mesa automáticamente usando el sistema unificado
    const tempReservation = {
      ...reservationData,
      fecha: fechaString
    };

    const mesaAsignada = assignTableAutomatically(tempReservation, realTableStates);

    if (!mesaAsignada && !isAdmin) {
      // No crear cliente si no hay disponibilidad real
      throw new Error('No hay mesas disponibles para esta reserva.');
    }

    // PASO 6: Crear cliente en la base de datos
    const clientId = await addClient(clientData);

    // PASO 7: Crear la reserva final
    const finalReservationData = {
      clienteId: clientId,
      cliente: clientData,
      fecha: fechaString,
      turno: reservationData.turno,
      horario: reservationData.horario,
      personas: reservationData.personas,
      mesaAsignada: mesaAsignada || 'Sin asignar',
      status: 'active',
      estadoCheckIn: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const reservationId = await addReservation(finalReservationData);

    return {
      success: true,
      type: 'confirmed',
      reservationId: reservationId,
      mesaAsignada: mesaAsignada,
      clientId: clientId,
      message: mesaAsignada 
        ? `Reserva confirmada para la mesa ${mesaAsignada}` 
        : 'Reserva confirmada sin asignación de mesa'
    };

  } catch (error) {
    console.error('❌ Error en creación de reserva:', error);
    throw error;
  }
};

/**
 * 🎯 Crear reserva en lista de espera
 */
const createWaitingReservation = async ({ reservationData, clientId, clientData }) => {
  try {
    const waitingData = {
      clienteId: clientId,
      cliente: clientData,
      fecha: reservationData.fecha,
      turno: reservationData.turno,
      horario: reservationData.horario || null,
      personas: reservationData.personas,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const waitingId = await addWaitingReservation(waitingData);

    return {
      success: true,
      type: 'waiting',
      waitingId: waitingId,
      clientId: clientId,
      message: 'Solicitud agregada a la lista de espera. Te contactaremos si hay disponibilidad.'
    };

  } catch (error) {
    console.error('❌ Error en creación de reserva en lista de espera:', error);
    throw error;
  }
};

// =================== FUNCIONES AUXILIARES ===================

/**
 * Validar datos de reserva
 */
const validateReservationData = async (reservationData, getAvailableSlots, isAdmin) => {
  try {
    // Validación básica de campos
    if (!reservationData.cliente?.nombre) {
      return { isValid: false, error: 'El nombre del cliente es obligatorio.' };
    }

    if (!reservationData.cliente?.telefono) {
      return { isValid: false, error: 'El teléfono del cliente es obligatorio.' };
    }

    if (!reservationData.personas || reservationData.personas < 1) {
      return { isValid: false, error: 'Debe especificar la cantidad de personas.' };
    }

    if (!reservationData.turno) {
      return { isValid: false, error: 'Debe especificar el turno.' };
    }

    // Para clientes (no admin), validar horario específico
    if (!isAdmin && !reservationData.horario) {
      return { isValid: false, error: 'Debe especificar el horario.' };
    }

    // Validar teléfono de forma más permisiva
    if (reservationData.cliente.telefono) {
      try {
        // Intentar parsear el teléfono
        const phoneNumber = parsePhoneNumber(reservationData.cliente.telefono);
        if (phoneNumber && !phoneNumber.isValid()) {
          return { isValid: false, error: 'El formato del teléfono no es válido.' };
        }
        // Si parsePhoneNumber devuelve null/undefined, asumimos que es un formato local válido
      } catch (error) {
        // Si hay error en el parseo, verificar que al menos tenga números
        const hasNumbers = /\d{6,}/.test(reservationData.cliente.telefono);
        if (!hasNumbers) {
          return { isValid: false, error: 'El teléfono debe contener al menos 6 dígitos.' };
        }
      }
    }

    return { isValid: true };

  } catch (error) {
    console.error('Error en validación:', error);
    return { isValid: false, error: 'Error de validación interno.' };
  }
};

/**
 * Preparar datos del cliente
 */
const prepareClientData = async (clienteData) => {
  // Mantener el teléfono tal como viene desde el formulario
  // ya que el modal se encarga del formato correcto
  let formattedPhone = clienteData.telefono.trim();
  
  // Solo intentar formatear si realmente es necesario
  try {
    const phoneNumber = parsePhoneNumber(clienteData.telefono);
    if (phoneNumber && phoneNumber.isValid()) {
      formattedPhone = phoneNumber.formatInternational();
    }
  } catch (error) {
    // Si falla el formateo, usar el teléfono original
    console.info('Usando teléfono sin formatear:', clienteData.telefono);
  }

  return {
    nombre: clienteData.nombre.trim(),
    telefono: formattedPhone,
    email: clienteData.email?.trim() || null,
    comentarios: clienteData.comentarios?.trim() || null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// =================== LÓGICA DE DISPONIBILIDAD Y ASIGNACIONES ===================

export const DEFAULT_HORARIOS = {
  mediodia: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'],
  noche: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30']
};

export const calculateAvailableSlots = async (
  fecha,
  turno,
  personas = null,
  excludeReservationId = null,
  existingReservations = [],
  loadBlockedTables = null,
  isAdmin = false
) => {
  try {
    const fechaObj = new Date(fecha + 'T00:00:00');

    if (!isAdmin && isTurnoClosed(fechaObj.getDay(), turno)) {
      return [];
    }

    let blockedTables = new Set();
    if (loadBlockedTables) {
      try {
        const blockedTablesForDate = await loadBlockedTables(fecha, turno);
        blockedTables = new Set(blockedTablesForDate || []);
        if (blockedTables.size === 0) {
          Object.values(UNIFIED_DEFAULT_BLOCKED_TABLES).flat().forEach(id => blockedTables.add(id));
        }
      } catch (error) {
        console.error('Error al cargar bloqueos, usando predeterminados:', error);
        Object.values(UNIFIED_DEFAULT_BLOCKED_TABLES).flat().forEach(id => blockedTables.add(id));
      }
    }

    const reservasDelDia = existingReservations.filter(
      r => r.fecha === fecha && r.turno === turno && r.id !== excludeReservationId
    );

    const capacidadDisponible = calculateCapacityByTables(blockedTables);
    const reservasPorCategoria = countReservationsByCategory(reservasDelDia);

    const hayCapacidad = personas
      ? checkCapacityForSize(personas, reservasPorCategoria, capacidadDisponible)
      : true;

    if (isAdmin || hayCapacidad) {
      return DEFAULT_HORARIOS[turno].map(horario => {
        const reservasHorario = reservasDelDia.filter(r => r.horario === horario);
        const cuposOcupados = reservasHorario.reduce((t, r) => t + (r.personas || 0), 0);
        const maxCupos = calculateMaxCuposForHorario(capacidadDisponible);
        return {
          horario,
          cuposDisponibles: Math.max(0, maxCupos - cuposOcupados),
          disponible: isAdmin || maxCupos - cuposOcupados >= (personas || 1)
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error calculating available slots:', error);
    return [];
  }
};

export const assignTableAutomaticallyLegacy = (
  reservationData,
  existingReservations = [],
  blockedTables = new Set()
) => {
  try {
    return assignTableToNewReservation(reservationData, existingReservations, blockedTables);
  } catch (error) {
    console.error('Error en asignación automática:', error);
    return null;
  }
};

export const isValidReservationDate = (fecha, turno, isAdmin = false) => {
  if (isAdmin) return true;
  const fechaObj = new Date(fecha + 'T00:00:00');
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  return fechaObj >= today && fechaObj <= maxDate && !isTurnoClosed(fechaObj.getDay(), turno);
};

export const autoAssignAllPendingReservations = async (
  reservations,
  fecha,
  turno,
  blockedTables,
  onUpdateReservation,
  showNotification
) => {
  try {
    const reservasSinMesa = reservations.filter(
      r =>
        r.fecha === fecha &&
        r.turno === turno &&
        (!r.mesaAsignada || r.mesaAsignada === 'Sin asignar') &&
        r.estadoCheckIn !== 'confirmado'
    );

    if (reservasSinMesa.length === 0) {
      showNotification?.('info', 'No hay reservas pendientes de asignación');
      return;
    }

    let asignadas = 0;
    let noAsignadas = [];

    for (const reserva of reservasSinMesa) {
      const mesaAsignada = assignTableAutomaticallyLegacy(reserva, reservations, blockedTables);
      if (mesaAsignada) {
        await onUpdateReservation(reserva.id, { mesaAsignada }, true);
        asignadas++;
      } else {
        noAsignadas.push(reserva.cliente?.nombre || 'Sin nombre');
      }
    }

    if (asignadas > 0) {
      showNotification?.('success', `${asignadas} reservas asignadas automáticamente`);
    }
    if (noAsignadas.length > 0) {
      showNotification?.(
        'warning',
        `${noAsignadas.length} reservas no pudieron asignarse: ${noAsignadas.join(', ')}`
      );
    }
  } catch (error) {
    console.error('Error en autoasignación:', error);
    showNotification?.('error', 'Error al autoasignar reservas');
  }
};

export const clearAllTableAssignments = async (
  reservations,
  fecha,
  turno,
  onUpdateReservation,
  showNotification
) => {
  try {
    const reservasConMesa = reservations.filter(
      r =>
        r.fecha === fecha &&
        r.turno === turno &&
        r.mesaAsignada &&
        r.estadoCheckIn !== 'confirmado'
    );

    if (reservasConMesa.length === 0) {
      showNotification?.('info', 'No hay asignaciones para limpiar');
      return;
    }

    for (const reserva of reservasConMesa) {
      await onUpdateReservation(reserva.id, { mesaAsignada: null }, true);
    }

    showNotification?.('success', `${reservasConMesa.length} asignaciones limpiadas`);
  } catch (error) {
    console.error('Error al limpiar asignaciones:', error);
    showNotification?.('error', 'Error al limpiar asignaciones');
  }
};

function calculateCapacityByTables(blockedTables) {
  const capacidad = { pequena: 0, mediana: 0, grande: 0 };
  UNIFIED_TABLES_LAYOUT.forEach(mesa => {
    if (!blockedTables.has(mesa.id)) {
      if (mesa.capacity <= 2) capacidad.pequena++;
      else if (mesa.capacity <= 4) capacidad.mediana++;
      else capacidad.grande++;
    }
  });
  const mesa2Available = !blockedTables.has(2);
  const mesa3Available = !blockedTables.has(3);
  if (mesa2Available && mesa3Available) {
    capacidad.grande++;
  }
  return capacidad;
}

function countReservationsByCategory(reservas) {
  const count = { pequena: 0, mediana: 0, grande: 0 };
  reservas.forEach(reserva => {
    if (reserva.personas <= 2) count.pequena++;
    else if (reserva.personas <= 4) count.mediana++;
    else count.grande++;
  });
  return count;
}

function checkCapacityForSize(personas, reservasPorCategoria, capacidadDisponible) {
  if (personas <= 2) return reservasPorCategoria.pequena < capacidadDisponible.pequena;
  if (personas <= 4) return reservasPorCategoria.mediana < capacidadDisponible.mediana;
  return reservasPorCategoria.grande < capacidadDisponible.grande;
}

function calculateMaxCuposForHorario(capacidadDisponible) {
  return capacidadDisponible.pequena * 2 + capacidadDisponible.mediana * 4 + capacidadDisponible.grande * 6;
}

// =================== EXPORTS ===================

export default {
  createReservation,
  validateReservationData,
  prepareClientData,
  calculateAvailableSlots,
  assignTableAutomaticallyLegacy,
  isValidReservationDate,
  autoAssignAllPendingReservations,
  clearAllTableAssignments
};
