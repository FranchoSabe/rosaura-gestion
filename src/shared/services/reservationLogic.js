/**
 * reservationLogic.js - Lógica Unificada de Reservas
 * 
 * Este archivo contiene TODA la lógica relacionada con:
 * - Cálculo de disponibilidad de horarios
 * - Asignación automática de mesas
 * - Validaciones de reservas
 * - Gestión de turnos y capacidades
 * 
 * ELIMINA DUPLICACIONES y centraliza la lógica en un solo lugar.
 */

import { UNIFIED_TABLES_LAYOUT, UNIFIED_RESERVATION_ORDER, UNIFIED_DEFAULT_BLOCKED_TABLES } from '../../utils/tablesLayout';
import { assignTableToNewReservation } from '../../utils/mesaLogic';
import { isTurnoClosed } from '../constants/operatingDays';

// =================== CONFIGURACIÓN ===================

// Horarios por turno
export const DEFAULT_HORARIOS = {
  mediodia: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'],
  noche: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30']
};

// Capacidades máximas por turno (estimadas)
const CAPACIDAD_MAXIMA_POR_TURNO = {
  pequena: { max: 6, size: 2 },  // Mesas para 1-2 personas
  mediana: { max: 6, size: 4 },  // Mesas para 3-4 personas  
  grande: { max: 2, size: 6 }    // Mesas para 5-6 personas (Mesa 7 + combinación 2+3)
};

// =================== FUNCIONES PRINCIPALES ===================

/**
 * FUNCIÓN UNIFICADA: Calcular disponibilidad de horarios
 * Reemplaza: getAvailableSlots, getAvailableSlotsForEdit de App.jsx y Reservas.jsx
 */
export const calculateAvailableSlots = async (fecha, turno, personas = null, excludeReservationId = null, existingReservations = [], loadBlockedTables = null, isAdmin = false) => {
  try {
    // 1. Validar si el turno está cerrado
    const fechaObj = new Date(fecha + "T00:00:00");
    const dayOfWeek = fechaObj.getDay();
    
    if (!isAdmin && isTurnoClosed(dayOfWeek, turno)) {
      return []; // Día/turno cerrado según configuración
    }

    // 2. Obtener mesas bloqueadas para esta fecha/turno
    let blockedTables = new Set();
    if (loadBlockedTables) {
      try {
        const blockedTablesForDate = await loadBlockedTables(fecha, turno);
        blockedTables = new Set(blockedTablesForDate || []);
        
        // Si no hay bloqueos guardados, usar los predeterminados
        if (blockedTables.size === 0) {
          Object.values(UNIFIED_DEFAULT_BLOCKED_TABLES).flat().forEach(id => blockedTables.add(id));
        }
      } catch (error) {
        console.error('Error al cargar bloqueos, usando predeterminados:', error);
        Object.values(UNIFIED_DEFAULT_BLOCKED_TABLES).flat().forEach(id => blockedTables.add(id));
      }
    }

    // 3. Filtrar reservas del día/turno (excluyendo la reserva que se está editando)
    const dayReservations = existingReservations.filter(
      r => r.fecha === fecha && r.turno === turno && r.id !== excludeReservationId
    );

    // 4. Calcular capacidad disponible basada en mesas no bloqueadas
    const availableCapacity = calculateCapacityByTables(blockedTables);

    // 5. Contar reservas existentes por categoría
    const reservationsByCategory = countReservationsByCategory(dayReservations);

    // 6. Verificar si hay capacidad para el tamaño solicitado
    const hasCapacity = personas
      ? checkCapacityForSize(personas, reservationsByCategory, availableCapacity)
      : true; // Si no se especifica tamaño, mostrar todos los horarios

    // 7. Retornar horarios disponibles
    if (isAdmin || hasCapacity) {
      // Para admin o si hay capacidad, retornar todos los horarios con información de cupos
      return DEFAULT_HORARIOS[turno].map(horario => {
        const reservationsByHour = dayReservations.filter(r => r.horario === horario);
        const occupiedSlots = reservationsByHour.reduce(
          (total, r) => total + (r.personas || 0),
          0
        );
        const maxSlots = calculateMaxCuposForHorario(availableCapacity);
        
        return {
          horario,
          cuposDisponibles: Math.max(0, maxSlots - occupiedSlots),
          disponible: isAdmin || maxSlots - occupiedSlots >= (personas || 1)
        };
      });
    } else {
      return []; // No hay capacidad disponible
    }

  } catch (error) {
    console.error('Error calculating available slots:', error);
    return [];
  }
};

/**
 * FUNCIÓN UNIFICADA: Asignar mesa automáticamente
 * Reemplaza múltiples funciones en mesaLogic.js y App.jsx
 */
export const assignTableAutomatically = (reservationData, existingReservations = [], blockedTables = new Set()) => {
  try {
    // Usar la función existente que ya está bien optimizada
    return assignTableToNewReservation(reservationData, existingReservations, blockedTables);
  } catch (error) {
    console.error('Error en asignación automática:', error);
    return null;
  }
};

/**
 * FUNCIÓN UNIFICADA: Validar fechas
 */
export const isValidReservationDate = (fecha, turno, isAdmin = false) => {
  if (isAdmin) return true; // Admin puede reservar cualquier fecha
  
  const fechaObj = new Date(fecha + "T00:00:00");
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1); // Máximo 1 mes en el futuro
  
  // Debe ser desde hoy hasta 1 mes en el futuro
  return fechaObj >= today && fechaObj <= maxDate && !isTurnoClosed(fechaObj.getDay(), turno);
};

/**
 * FUNCIÓN UNIFICADA: Autoasignar todas las reservas pendientes
 */
export const autoAssignAllPendingReservations = async (
  reservations,
  fecha,
  turno,
  blockedTables,
  onUpdateReservation,
  showNotification
) => {
  try {
    const reservationsWithoutTable = reservations.filter(
      r =>
        r.fecha === fecha &&
        r.turno === turno &&
        (!r.mesaAsignada || r.mesaAsignada === 'Sin asignar') &&
        r.estadoCheckIn !== 'confirmado'
    );

    if (reservationsWithoutTable.length === 0) {
      showNotification?.('info', 'No hay reservas pendientes de asignación');
      return;
    }

    let assignedCount = 0;
    let unassigned = [];

    for (const reservation of reservationsWithoutTable) {
      const assignedTable = assignTableAutomatically(
        reservation,
        reservations,
        blockedTables
      );

      if (assignedTable) {
        await onUpdateReservation(reservation.id, { mesaAsignada: assignedTable }, true);
        assignedCount++;
      } else {
        unassigned.push(reservation.cliente?.nombre || 'Sin nombre');
      }
    }

    // Mostrar resultado
    if (assignedCount > 0) {
      showNotification?.('success', `${assignedCount} reservas asignadas automáticamente`);
    }

    if (unassigned.length > 0) {
      showNotification?.(
        'warning',
        `${unassigned.length} reservas no pudieron asignarse: ${unassigned.join(', ')}`
      );
    }

  } catch (error) {
    console.error('Error en autoasignación:', error);
    showNotification?.('error', 'Error al autoasignar reservas');
  }
};

/**
 * FUNCIÓN UNIFICADA: Limpiar todas las asignaciones
 */
export const clearAllTableAssignments = async (reservations, fecha, turno, onUpdateReservation, showNotification) => {
  try {
    const reservationsWithTable = reservations.filter(
      r =>
        r.fecha === fecha &&
        r.turno === turno &&
        r.mesaAsignada &&
        r.estadoCheckIn !== 'confirmado'
    );

    if (reservationsWithTable.length === 0) {
      showNotification?.('info', 'No hay asignaciones para limpiar');
      return;
    }

    for (const reservation of reservationsWithTable) {
      await onUpdateReservation(reservation.id, { mesaAsignada: null }, true);
    }

    showNotification?.(
      'success',
      `${reservationsWithTable.length} asignaciones limpiadas`
    );

  } catch (error) {
    console.error('Error al limpiar asignaciones:', error);
    showNotification?.('error', 'Error al limpiar asignaciones');
  }
};

// =================== FUNCIONES AUXILIARES ===================

/**
 * Calcular capacidad disponible basada en mesas no bloqueadas
 */
function calculateCapacityByTables(blockedTables) {
  const capacity = { pequena: 0, mediana: 0, grande: 0 };
  
  UNIFIED_TABLES_LAYOUT.forEach(mesa => {
    if (!blockedTables.has(mesa.id)) {
      if (mesa.capacity <= 2) capacity.pequena++;
      else if (mesa.capacity <= 4) capacity.mediana++;
      else capacity.grande++;
    }
  });
  
  // Verificar si la combinación Mesa 2+3 está disponible
  const table2Available = !blockedTables.has(2);
  const table3Available = !blockedTables.has(3);
  if (table2Available && table3Available) {
    capacity.grande++; // Añadir capacidad por la combinación 2+3
  }

  return capacity;
}

/**
 * Contar reservas existentes por categoría
 */
function countReservationsByCategory(reservations) {
  const count = { pequena: 0, mediana: 0, grande: 0 };

  reservations.forEach(reservation => {
    if (reservation.personas <= 2) count.pequena++;
    else if (reservation.personas <= 4) count.mediana++;
    else count.grande++;
  });
  
  return count;
}

/**
 * Verificar si hay capacidad para un tamaño específico
 */
function checkCapacityForSize(personas, reservationsByCategory, availableCapacity) {
  if (personas <= 2) {
    return reservationsByCategory.pequena < availableCapacity.pequena;
  } else if (personas <= 4) {
    return reservationsByCategory.mediana < availableCapacity.mediana;
  } else {
    return reservationsByCategory.grande < availableCapacity.grande;
  }
}

/**
 * Calcular cupos máximos para un horario específico
 */
function calculateMaxCuposForHorario(availableCapacity) {
  return (
    availableCapacity.pequena * 2 +
    availableCapacity.mediana * 4 +
    availableCapacity.grande * 6
  );
}

// =================== EXPORTS PARA COMPATIBILIDAD ===================

// Mantener compatibilidad con código existente
export const getAvailableSlots = calculateAvailableSlots;
export const getAvailableSlotsForEdit = calculateAvailableSlots;
export const isValidDate = isValidReservationDate; 