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
import { calculateRealTableStates, assignTableAutomatically, validateTableAvailability } from './tableManagementService';
import { parsePhoneNumber } from 'react-phone-number-input';
import { formatDateToString } from '../../utils';

// =================== CONFIGURACIÓN ===================

const DEFAULT_BLOCKED_TABLES = {
  mediodia: [1, 8, 9, 10],
  noche: [1, 8, 9, 10]
};

// =================== FUNCIÓN PRINCIPAL ===================

/**
 * FUNCIÓN PRINCIPAL: Crear reserva unificada
 * Usa el nuevo sistema de gestión de mesas para asignación automática
 */
export const createReservation = async (
  reservationData,
  {
    isAdmin = false,
    getAvailableSlots = null,
    existingReservations = [],
    loadBlockedTables = null,
    existingOrders = [],
    manualBlocks = new Set()
  }
) => {
  try {
    // Iniciando creación de reserva

    // PASO 1: Validaciones iniciales
    const validation = await validateReservationData(reservationData, getAvailableSlots, isAdmin);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // PASO 2: Preparar datos del cliente
    const clientData = await prepareClientData(reservationData.cliente);
    
    // PASO 3: Crear cliente en la base de datos
    const clientId = await addClient(clientData);

    // PASO 4: Verificar disponibilidad con el sistema unificado
    const fechaString = typeof reservationData.fecha === 'string' 
      ? reservationData.fecha 
      : formatDateToString(reservationData.fecha);

    // PASO 4.1: Calcular estado real de las mesas
    const realTableStates = calculateRealTableStates(
      existingReservations,
      existingOrders,
      manualBlocks,
      fechaString,
      reservationData.turno
    );

    // PASO 4.2: Validar disponibilidad antes de crear la reserva
    const availability = validateTableAvailability({
      personas: reservationData.personas,
      fecha: fechaString,
      turno: reservationData.turno
    }, realTableStates);

    // Validación de disponibilidad realizada

    // PASO 5: Decidir entre reserva confirmada o lista de espera
    const shouldGoToWaitingList = !isAdmin && (
      reservationData.willGoToWaitingList || 
      !availability.hasAvailability
    );

    if (shouldGoToWaitingList) {
      return await createWaitingReservation({
        reservationData: { ...reservationData, fecha: fechaString },
        clientId,
        clientData
      });
    }

    // PASO 6: Asignar mesa automáticamente usando el sistema unificado
    const tempReservation = {
      ...reservationData,
      fecha: fechaString,
      clienteId: clientId,
      cliente: clientData
    };

    const mesaAsignada = assignTableAutomatically(tempReservation, realTableStates);

    if (!mesaAsignada && !isAdmin) {
      throw new Error('No hay mesas disponibles para esta reserva.');
    }

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

    // Validar teléfono
    if (reservationData.cliente.telefono) {
      try {
        const phoneNumber = parsePhoneNumber(reservationData.cliente.telefono);
        if (!phoneNumber || !phoneNumber.isValid()) {
          return { isValid: false, error: 'El formato del teléfono no es válido.' };
        }
      } catch (error) {
        return { isValid: false, error: 'El formato del teléfono no es válido.' };
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
  let formattedPhone = clienteData.telefono;
  
  try {
    const phoneNumber = parsePhoneNumber(clienteData.telefono);
    if (phoneNumber && phoneNumber.isValid()) {
      formattedPhone = phoneNumber.formatInternational();
    }
  } catch (error) {
    console.warn('No se pudo formatear el teléfono:', error);
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

// =================== EXPORTS ===================

export default {
  createReservation,
  validateReservationData,
  prepareClientData
}; 