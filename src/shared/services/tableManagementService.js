/**
 * tableManagementService.js - Servicio Unificado de Gestión de Mesas
 * 
 * FUENTE ÚNICA DE VERDAD para:
 * ✅ Estados de mesa (libre, libre-walkin, reservada, ocupada, bloqueada)
 * ✅ Disponibilidad para asignación automática  
 * ✅ Gestión de cupos y bloqueos
 * ✅ Validaciones de conflictos
 * ✅ Feedback visual para el mapa
 * 
 * ELIMINA la fragmentación de lógicas y centraliza en un solo lugar.
 */

import { UNIFIED_TABLES_LAYOUT } from '../../utils/tablesLayout';
import reservationOrderConfig from '../../config/reservationOrder.json';

let UNIFIED_RESERVATION_ORDER = reservationOrderConfig;

// Helper for debug logging
const debugLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

export const initTableManagementService = (customOrder = reservationOrderConfig) => {
  UNIFIED_RESERVATION_ORDER = customOrder;
};

// Cargar configuración por defecto al inicializar el módulo
initTableManagementService();

// =================== ESTADOS DE MESA ===================

/**
 * Estados posibles de una mesa:
 * - 'available': Libre para reservas y walk-ins
 * - 'available-walkin': Libre solo para walk-ins (bloqueada para reservas)
 * - 'reserved': Reservada pero sin check-in
 * - 'occupied': Ocupada (con check-in o pedido activo)
 * - 'blocked': Completamente bloqueada
 */
export const TABLE_STATES = {
  AVAILABLE: 'available',           // Verde - Libre total
  AVAILABLE_WALKIN: 'available-walkin', // Amarillo - Solo walk-ins
  RESERVED: 'reserved',             // Azul claro - Reservada sin check-in
  OCCUPIED: 'occupied',             // Azul sólido - Ocupada real
  BLOCKED: 'blocked'                // Rojo - Bloqueada total
};

// =================== CONFIGURACIÓN ===================

// Mesas bloqueadas para reservas (preservar para walk-ins)
export const DEFAULT_RESERVATION_BLOCKED = {
  mediodia: [1, 8, 9, 10],
  noche: [1, 8, 9, 10]
};

// =================== FUNCIONES PRINCIPALES ===================

/**
 * FUNCIÓN CENTRAL: Calcular estado real de todas las mesas
 * Esta es la ÚNICA fuente de verdad para el estado de las mesas
 */
export const calculateRealTableStates = (reservations = [], orders = [], manualBlocks = new Set(), selectedDate = null, selectedTurno = null, exceptions = new Set()) => {
  const tableStates = new Map();
  
  // 1. Inicializar todas las mesas como disponibles
  UNIFIED_TABLES_LAYOUT.forEach(table => {
    tableStates.set(table.id, {
      id: table.id,
      state: TABLE_STATES.AVAILABLE,
      capacity: table.capacity,
      occupant: null,
      type: null,
      canReceiveReservations: true,
      canReceiveWalkins: true,
      availableFor: ['reservations', 'walkins'],
      details: null
    });
  });
  
  // 2. Aplicar bloqueos manuales (del botón "Modificar Cupos")
  // 🔧 CORRECCIÓN: En modo gestión, los bloqueos manuales son solo para reservas (walk-in disponible)
  manualBlocks.forEach(tableId => {
    if (tableStates.has(tableId)) {
      tableStates.set(tableId, {
        ...tableStates.get(tableId),
        state: TABLE_STATES.AVAILABLE_WALKIN, // 🔧 Cambio: walk-in disponible en lugar de completamente bloqueada
        canReceiveReservations: false,
        canReceiveWalkins: true, // 🔧 Cambio: Permitir walk-ins
        availableFor: ['walkins'], // 🔧 Cambio: Solo walk-ins
        type: 'manual_block'
      });
    }
  });
  
  // 3. Aplicar bloqueos para reservas (preservar para walk-ins) - CON EXCEPCIONES
  if (selectedTurno && DEFAULT_RESERVATION_BLOCKED[selectedTurno]) {    
    DEFAULT_RESERVATION_BLOCKED[selectedTurno].forEach(tableId => {
      // 🆕 LÓGICA DE EXCEPCIONES: No aplicar bloqueo si está en excepciones
      if (tableStates.has(tableId) && !manualBlocks.has(tableId) && !exceptions.has(tableId)) {
        tableStates.set(tableId, {
          ...tableStates.get(tableId),
          state: TABLE_STATES.AVAILABLE_WALKIN,
          canReceiveReservations: false,  // ✅ NO pueden recibir reservas
          canReceiveWalkins: true,        // ✅ SÍ pueden recibir walk-ins
          availableFor: ['walkins'],      // ✅ Solo disponibles para walk-ins
          type: 'reservation_blocked'
        });
      }
    });
  }
  
  // 4. Aplicar reservas del día/turno seleccionado
  if (selectedDate && selectedTurno) {
    const dayReservations = reservations.filter(r => 
      r.fecha === selectedDate && 
      r.turno === selectedTurno &&
      r.estadoCheckIn !== 'completado'
    );
    
    dayReservations.forEach(reservation => {
      // Determinar qué mesa usar según el estado del check-in
      let mesaParaUsar;
      
      if (reservation.estadoCheckIn === 'confirmado') {
        // Check-in confirmado: usar mesaReal
        mesaParaUsar = reservation.mesaReal;
      } else {
        // Sin check-in: usar mesaAsignada
        mesaParaUsar = reservation.mesaAsignada;
      }
      
      if (mesaParaUsar) {
        // Manejar combinaciones de mesas (ej: "11+21")
        const tableIds = typeof mesaParaUsar === 'string' && mesaParaUsar.includes('+')
          ? mesaParaUsar.split('+').map(id => parseInt(id))
          : [parseInt(mesaParaUsar)];
        
        tableIds.forEach(tableId => {
          if (tableStates.has(tableId)) {
            const isCheckedIn = reservation.estadoCheckIn === 'confirmado';
            const state = isCheckedIn ? TABLE_STATES.OCCUPIED : TABLE_STATES.RESERVED;
            
            tableStates.set(tableId, {
              ...tableStates.get(tableId),
              state: state,
              occupant: reservation,
              type: 'reservation',
              canReceiveReservations: false,
              canReceiveWalkins: false,
              availableFor: [],
              details: {
                reservationId: reservation.id,
                clientName: reservation.cliente?.nombre,
                phone: reservation.cliente?.telefono,
                people: reservation.personas,
                time: reservation.horario,
                checkInStatus: reservation.estadoCheckIn,
                mesaAsignada: reservation.mesaAsignada,
                mesaReal: reservation.mesaReal
              }
            });
          }
        });
      }
    });
  }
  
  // 5. Aplicar pedidos activos (tienen prioridad total)
  const activeOrders = orders.filter(order => order.estado !== 'cerrado');
  activeOrders.forEach(order => {
    if (order.mesa) {
      const tableId = parseInt(order.mesa);
      if (tableStates.has(tableId)) {
        tableStates.set(tableId, {
          ...tableStates.get(tableId),
          state: TABLE_STATES.OCCUPIED,
          occupant: order,
          type: 'order',
          canReceiveReservations: false,
          canReceiveWalkins: false,
          availableFor: [],
          details: {
            orderId: order.orderId,
            status: order.estado,
            total: order.totales?.total || 0,
            products: order.productos?.length || 0
          }
        });
      }
    }
  });
  
  // 🔍 DEBUG: Log deshabilitado para evitar spam en consola
  // Solo se habilitará para debugging específico cambiando false a true
  if (false && process.env.NODE_ENV === 'development' && selectedDate && selectedTurno) {
    const summary = {
      available: Array.from(tableStates.values()).filter(s => s.state === 'available').length,
      reserved: Array.from(tableStates.values()).filter(s => s.state === 'reserved').length,
      occupied: Array.from(tableStates.values()).filter(s => s.state === 'occupied').length,
      walkinOnly: Array.from(tableStates.values()).filter(s => s.state === 'available-walkin').length,
      blocked: Array.from(tableStates.values()).filter(s => s.state === 'blocked').length
    };
    debugLog(`📊 Mesas: ${summary.available} libres | ${summary.walkinOnly} walk-in | ${summary.reserved} reservadas | ${summary.occupied} ocupadas | ${summary.blocked} bloqueadas`);
  }
  
  return tableStates;
};

/**
 * FUNCIÓN CENTRAL: Obtener mesas disponibles para asignación automática
 * Considera TODOS los factores: reservas, check-ins, pedidos, bloqueos
 */
export const getAvailableTablesForAssignment = (tableStates, requiredCapacity, excludeTableIds = []) => {
  const availableTables = [];
  
  // Obtener orden de preferencia según capacidad
  let preferenceOrder = UNIFIED_RESERVATION_ORDER[requiredCapacity];
  if (!preferenceOrder) {
    // Si no hay orden específico, buscar en capacidades mayores
    for (const cap of [4, 6]) {
      if (cap >= requiredCapacity && UNIFIED_RESERVATION_ORDER[cap]) {
        preferenceOrder = UNIFIED_RESERVATION_ORDER[cap];
        break;
      }
    }
  }
  
  if (preferenceOrder) {
    // Filtrar mesas disponibles para reservas
    for (const tableId of preferenceOrder) {
      if (excludeTableIds.includes(tableId)) continue;
      
      const tableState = tableStates.get(tableId);
      if (tableState && tableState.canReceiveReservations) {
        availableTables.push({
          id: tableId,
          capacity: tableState.capacity,
          state: tableState.state,
          priority: preferenceOrder.indexOf(tableId)
        });
      }
    }
  }
  
  return availableTables;
};

/**
 * FUNCIÓN CENTRAL: Asignación automática unificada
 * Reemplaza assignTableToNewReservation y usa el estado real
 */
export const assignTableAutomatically = (newReservation, tableStates, excludeReservationId = null) => {
  // Asignación automática iniciada
  
  // 1. Determinar capacidad objetivo
  let capacidadObjetivo = newReservation.personas === 5 ? 6 : newReservation.personas;
  
  // 2. Obtener mesas disponibles usando el estado real
  const availableTables = getAvailableTablesForAssignment(tableStates, capacidadObjetivo);
  
  // 3. Asignar primera mesa disponible (ya ordenada por prioridad)
  if (availableTables.length > 0) {
    const assignedTable = availableTables[0].id;
    return assignedTable;
  }
  
  // 4. Si no hay mesas individuales, intentar combinaciones para capacidad 4
  if (capacidadObjetivo === 4) {
    const combination = findAvailableTableCombination(tableStates, 4);
    if (combination) {
      return combination;
    }
  }
  
    // 5. Para capacidad 6, intentar combinación específica 2+3
  if (capacidadObjetivo === 6) {
    const mesa2 = tableStates.get(2);
    const mesa3 = tableStates.get(3);
    
    if (mesa2?.canReceiveReservations && mesa3?.canReceiveReservations) {
      return '2+3';
    }
  }

  return null;
};

/**
 * Buscar combinaciones disponibles de mesas
 */
export const findAvailableTableCombination = (tableStates, requiredCapacity) => {
  // Combinaciones predefinidas para 4 personas
  const combinations4 = [
    { tables: [11, 21], name: "11+21" },
    { tables: [1, 31], name: "1+31" },
    { tables: [14, 24], name: "14+24" }
  ];
  
  if (requiredCapacity === 4) {
    for (const combo of combinations4) {
      const allAvailable = combo.tables.every(tableId => {
        const tableState = tableStates.get(tableId);
        return tableState?.canReceiveReservations;
      });
      
      if (allAvailable) {
        return combo.name;
      }
    }
  }
  
  return null;
};

/**
 * FUNCIÓN CENTRAL: Validar disponibilidad para nueva reserva
 * Verificación completa antes de crear la reserva
 */
export const validateTableAvailability = (reservationData, tableStates) => {
  const availableTables = getAvailableTablesForAssignment(tableStates, reservationData.personas);
  
  return {
    hasAvailability: availableTables.length > 0,
    availableCount: availableTables.length,
    suggestedTable: availableTables.length > 0 ? availableTables[0].id : null,
    availableTables: availableTables.map(t => t.id)
  };
};

/**
 * FUNCIÓN CENTRAL: Obtener feedback visual para el mapa
 * Retorna colores y estilos según el estado real
 */
export const getTableVisualFeedback = (tableId, tableStates) => {
  const tableState = tableStates.get(tableId);
  if (!tableState) return { fill: '#ffffff', stroke: '#0c4900', strokeWidth: 2, textColor: '#0c4900' };
  
  switch (tableState.state) {
    case TABLE_STATES.AVAILABLE:
      return {
        fill: '#ffffff',
        stroke: '#10b981', // Verde
        strokeWidth: 2,
        textColor: '#0c4900',
        description: 'Disponible para reservas y walk-ins'
      };
      
    case TABLE_STATES.AVAILABLE_WALKIN:
      return {
        fill: '#fef3c7', // Amarillo claro
        stroke: '#f59e0b', // Amarillo
        strokeWidth: 2,
        textColor: '#92400e',
        description: 'Disponible solo para walk-ins'
      };
      
    case TABLE_STATES.RESERVED:
      return {
        fill: '#eff6ff', // Azul muy claro
        stroke: '#3b82f6', // Azul
        strokeWidth: 2,
        textColor: '#1d4ed8',
        description: 'Reservada (sin check-in)'
      };
      
    case TABLE_STATES.OCCUPIED:
      return {
        fill: '#2563eb', // Azul sólido
        stroke: '#1d4ed8', // Azul oscuro
        strokeWidth: 3,
        textColor: '#ffffff',
        description: 'Ocupada'
      };
      
    case TABLE_STATES.BLOCKED:
      return {
        fill: '#ffffff',
        stroke: '#dc2626', // Rojo
        strokeWidth: 2,
        textColor: '#dc2626',
        description: 'Bloqueada'
      };
      
    default:
      return {
        fill: '#ffffff',
        stroke: '#6b7280',
        strokeWidth: 2,
        textColor: '#6b7280',
        description: 'Estado desconocido'
      };
  }
};

/**
 * FUNCIÓN CENTRAL: Gestionar cambios de cupos/bloqueos
 * Integración con el botón "Modificar Cupos"
 */
export const toggleTableBlock = (tableId, currentBlocks, tableStates) => {
  const newBlocks = new Set(currentBlocks);
  const tableState = tableStates.get(tableId);
  
  if (!tableState) return { blocks: newBlocks, message: 'Mesa no encontrada' };
  
  // No permitir bloquear mesas ocupadas o reservadas
  if (tableState.state === TABLE_STATES.OCCUPIED || tableState.state === TABLE_STATES.RESERVED) {
    return { 
      blocks: newBlocks, 
      message: `No se puede bloquear la mesa ${tableId} porque está ${tableState.state === TABLE_STATES.OCCUPIED ? 'ocupada' : 'reservada'}`,
      success: false
    };
  }
  
  if (newBlocks.has(tableId)) {
    newBlocks.delete(tableId);
    return { 
      blocks: newBlocks, 
      message: `Mesa ${tableId} desbloqueada - Disponible para reservas y walk-ins`,
      success: true
    };
  } else {
    newBlocks.add(tableId);
    return { 
      blocks: newBlocks, 
      message: `Mesa ${tableId} bloqueada - No disponible`,
      success: true
    };
  }
};

/**
 * FUNCIÓN AUXILIAR: Obtener estadísticas de disponibilidad
 */
export const getTableAvailabilityStats = (tableStates) => {
  const stats = {
    total: tableStates.size,
    available: 0,
    availableWalkin: 0,
    reserved: 0,
    occupied: 0,
    blocked: 0,
    capacityAvailable: {
      small: 0,  // 1-2 personas
      medium: 0, // 3-4 personas
      large: 0   // 5-6 personas
    }
  };
  
  tableStates.forEach(tableState => {
    switch (tableState.state) {
      case TABLE_STATES.AVAILABLE:
        stats.available++;
        if (tableState.capacity <= 2) stats.capacityAvailable.small++;
        else if (tableState.capacity <= 4) stats.capacityAvailable.medium++;
        else stats.capacityAvailable.large++;
        break;
      case TABLE_STATES.AVAILABLE_WALKIN:
        stats.availableWalkin++;
        break;
      case TABLE_STATES.RESERVED:
        stats.reserved++;
        break;
      case TABLE_STATES.OCCUPIED:
        stats.occupied++;
        break;
      case TABLE_STATES.BLOCKED:
        stats.blocked++;
        break;
    }
  });
  
  return stats;
};

/**
 * 🎯 FUNCIÓN MASTER: Chequeo unificado de disponibilidad de mesas
 * Esta es la ÚNICA fuente de verdad para verificar disponibilidad
 * Centraliza TODA la lógica de estados, reservas, pedidos y bloqueos
 * 
 * @param {string} fecha - Fecha a consultar (YYYY-MM-DD)
 * @param {string} turno - Turno a consultar ('mediodia' | 'noche' | 'pedidos')
 * @param {Array} reservations - Reservas actuales
 * @param {Array} orders - Pedidos activos
 * @param {Set} manualBlocks - Mesas bloqueadas manualmente
 * @param {Object} options - Opciones adicionales
 * @returns {Map} Mapa con disponibilidad detallada por mesa
 */
export const checkTableAvailability = (fecha, turno, reservations = [], orders = [], manualBlocks = new Set(), options = {}) => {
  const {
    requireCapacity = null,         // Capacidad mínima requerida
    excludeTableIds = [],          // Mesas a excluir del análisis
    includeMetadata = true,        // Incluir metadatos detallados
    onlyAvailable = false          // Solo devolver mesas disponibles
  } = options;

  debugLog('🎯 checkTableAvailability - Master function ejecutándose:', {
    fecha, turno, 
    totalReservations: reservations.length,
    totalOrders: orders.length,
    manualBlocks: Array.from(manualBlocks),
    requireCapacity,
    excludeTableIds
  });

  // 1. Obtener estados reales de todas las mesas
  const tableStates = calculateRealTableStates(reservations, orders, manualBlocks, fecha, turno);
  
  // 2. Crear mapa de disponibilidad detallado
  const availability = new Map();
  
  UNIFIED_TABLES_LAYOUT.forEach(table => {
    const tableId = table.id;
    
    // Excluir mesas si se especifica
    if (excludeTableIds.includes(tableId)) {
      return;
    }
    
    // Obtener estado actual
    const currentState = tableStates.get(tableId);
    if (!currentState) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`🚨 Mesa ${tableId} no tiene estado definido`);
      }
      return;
    }
    
    // Verificar capacidad mínima si se requiere
    const meetsCapacity = !requireCapacity || table.capacity >= requireCapacity;
    
    // Determinar disponibilidad real
    const isAvailableForReservations = currentState.canReceiveReservations && meetsCapacity;
    const isAvailableForWalkins = currentState.canReceiveWalkins && meetsCapacity;
    const isCompletelyAvailable = isAvailableForReservations && isAvailableForWalkins;
    
    // Crear objeto de disponibilidad
    const availabilityInfo = {
      tableId,
      capacity: table.capacity,
      isAvailable: isCompletelyAvailable,
      isAvailableForReservations,
      isAvailableForWalkins,
      currentState: currentState.state,
      meetsCapacityRequirement: meetsCapacity,
      
      // Razones de no disponibilidad
      unavailableReasons: getUnavailableReasons(currentState, meetsCapacity),
      
      // Ocupante actual (si existe)
      currentOccupant: getCurrentOccupantInfo(currentState),
      
      // Estimaciones de disponibilidad
      estimatedAvailableAt: getEstimatedAvailability(currentState, turno),
      
      // Metadatos (si se requieren)
      ...(includeMetadata && {
        metadata: {
          position: { x: table.x, y: table.y },
          dimensions: { width: table.width, height: table.height },
          stateType: currentState.type,
          canModifyState: !['occupied', 'reserved'].includes(currentState.state),
          lastStateChange: new Date(),
          availabilityScore: calculateAvailabilityScore(currentState, table.capacity, requireCapacity)
        }
      })
    };
    
    // Filtrar solo disponibles si se especifica
    if (onlyAvailable && !isCompletelyAvailable) {
      return;
    }
    
    availability.set(tableId, availabilityInfo);
  });
  
  debugLog('✅ checkTableAvailability completado:', {
    totalTables: availability.size,
    available: Array.from(availability.values()).filter(a => a.isAvailable).length,
    onlyReservations: Array.from(availability.values()).filter(a => a.isAvailableForReservations && !a.isAvailableForWalkins).length,
    onlyWalkins: Array.from(availability.values()).filter(a => !a.isAvailableForReservations && a.isAvailableForWalkins).length,
    unavailable: Array.from(availability.values()).filter(a => !a.isAvailable).length
  });
  
  return availability;
};

/**
 * Obtener razones detalladas de no disponibilidad
 */
const getUnavailableReasons = (currentState, meetsCapacity) => {
  const reasons = [];
  
  if (!meetsCapacity) {
    reasons.push('CAPACITY_INSUFFICIENT');
  }
  
  switch (currentState.state) {
    case 'occupied':
      reasons.push(currentState.type === 'reservation' ? 'OCCUPIED_BY_RESERVATION' : 'OCCUPIED_BY_ORDER');
      break;
    case 'reserved':
      reasons.push('RESERVED_PENDING_CHECKIN');
      break;
    case 'blocked':
      reasons.push(currentState.type === 'manual_block' ? 'MANUALLY_BLOCKED' : 'SYSTEM_BLOCKED');
      break;
    case 'available-walkin':
      reasons.push('BLOCKED_FOR_RESERVATIONS');
      break;
  }
  
  return reasons;
};

/**
 * Obtener información del ocupante actual
 */
const getCurrentOccupantInfo = (currentState) => {
  if (!currentState.occupant) return null;
  
  if (currentState.type === 'reservation') {
    return {
      type: 'reservation',
      id: currentState.details?.reservationId,
      clientName: currentState.details?.clientName,
      people: currentState.details?.people,
      time: currentState.details?.time,
      checkInStatus: currentState.details?.checkInStatus
    };
  }
  
  if (currentState.type === 'order') {
    return {
      type: 'order',
      id: currentState.details?.orderId,
      status: currentState.details?.status,
      total: currentState.details?.total,
      products: currentState.details?.products
    };
  }
  
  return null;
};

/**
 * Estimar cuándo estará disponible la mesa
 */
const getEstimatedAvailability = (currentState, turno) => {
  if (['available', 'available-walkin'].includes(currentState.state)) {
    return 'now';
  }
  
  if (currentState.state === 'blocked') {
    return 'manual_unblock_required';
  }
  
  if (currentState.state === 'reserved') {
    // Las reservas sin check-in pueden cancelarse
    return 'cancellation_possible';
  }
  
  if (currentState.state === 'occupied') {
    // Estimar basado en promedio de estadía
    const avgDuration = turno === 'mediodia' ? 90 : 120; // minutos
    return `~${avgDuration} minutes`;
  }
  
  return 'unknown';
};

/**
 * Calcular score de disponibilidad (0-100)
 */
const calculateAvailabilityScore = (currentState, tableCapacity, requiredCapacity) => {
  let score = 0;
  
  // Puntos por estado
  switch (currentState.state) {
    case 'available': score += 100; break;
    case 'available-walkin': score += 70; break;
    case 'reserved': score += 30; break;
    case 'occupied': score += 0; break;
    case 'blocked': score += 0; break;
  }
  
  // Bonus por capacidad adecuada
  if (requiredCapacity && tableCapacity >= requiredCapacity) {
    score += 10;
  }
  
  // Penalty por capacidad excesiva (optimizar ocupación)
  if (requiredCapacity && tableCapacity > requiredCapacity * 2) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
};

// =================== UTILIDADES ADICIONALES ===================

// Alias para mantener compatibilidad con la antigua util "assignTableToNewReservation"
export const assignTableToNewReservation = assignTableAutomatically;

// Versión simplificada de auto-asignación masiva usada en vistas de preview
export const calculateAutoAssignments = (reservas, currentBlocked = new Set()) => {
  const assignments = {};
  const tableStates = calculateRealTableStates(reservas, [], currentBlocked);
  const sorted = [...reservas].sort((a, b) => a.horario.localeCompare(b.horario));

  sorted.forEach(reserva => {
    if (assignments[reserva.id]) return;
    const mesa = assignTableAutomatically(reserva, tableStates);
    if (mesa) {
      assignments[reserva.id] = mesa;
      const ids = typeof mesa === 'string' && mesa.includes('+') ? mesa.split('+') : [mesa];
      ids.forEach(id => {
        const ts = tableStates.get(parseInt(id));
        if (ts) {
          tableStates.set(parseInt(id), { ...ts, canReceiveReservations: false, state: TABLE_STATES.RESERVED });
        }
      });
    }
  });

  return { assignments, blockedTables: currentBlocked, quotaChanges: { hasChanges: false } };
};

// =================== EXPORTS ===================

export default {
  calculateRealTableStates,
  getAvailableTablesForAssignment,
  assignTableAutomatically,
  assignTableToNewReservation,
  calculateAutoAssignments,
  validateTableAvailability,
  getTableVisualFeedback,
  toggleTableBlock,
  getTableAvailabilityStats,
  TABLE_STATES,
  initTableManagementService
};
