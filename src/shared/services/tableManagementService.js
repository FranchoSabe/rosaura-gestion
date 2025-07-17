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

import { UNIFIED_TABLES_LAYOUT, UNIFIED_RESERVATION_ORDER } from '../../utils/tablesLayout';

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
const DEFAULT_RESERVATION_BLOCKED = {
  mediodia: [1, 8, 9, 10],
  noche: [1, 8, 9, 10]
};

// =================== FUNCIONES PRINCIPALES ===================

/**
 * FUNCIÓN CENTRAL: Calcular estado real de todas las mesas
 * Esta es la ÚNICA fuente de verdad para el estado de las mesas
 */
export const calculateRealTableStates = (reservations = [], orders = [], manualBlocks = new Set(), selectedDate = null, selectedTurno = null) => {
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
  manualBlocks.forEach(tableId => {
    if (tableStates.has(tableId)) {
      tableStates.set(tableId, {
        ...tableStates.get(tableId),
        state: TABLE_STATES.BLOCKED,
        canReceiveReservations: false,
        canReceiveWalkins: false,
        availableFor: [],
        type: 'manual_block'
      });
    }
  });
  
  // 3. Aplicar bloqueos para reservas (preservar para walk-ins)
  if (selectedTurno && DEFAULT_RESERVATION_BLOCKED[selectedTurno]) {
    DEFAULT_RESERVATION_BLOCKED[selectedTurno].forEach(tableId => {
      if (tableStates.has(tableId) && !manualBlocks.has(tableId)) {
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

// =================== EXPORTS ===================

export default {
  calculateRealTableStates,
  getAvailableTablesForAssignment,
  assignTableAutomatically,
  validateTableAvailability,
  getTableVisualFeedback,
  toggleTableBlock,
  getTableAvailabilityStats,
  TABLE_STATES
}; 