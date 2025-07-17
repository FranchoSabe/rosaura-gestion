import { useMemo, useRef } from 'react';
import { calculateRealTableStates, getTableAvailabilityStats } from '../services/tableManagementService';

/**
 * Hook para obtener estados unificados de mesa usando el nuevo servicio
 * Reemplaza la lógica fragmentada por el sistema unificado de gestión de mesas
 * 
 * @param {Array} reservations - Array de reservas
 * @param {Array} orders - Array de pedidos
 * @param {Set} manualBlocks - Set de mesas bloqueadas manualmente
 * @param {string} selectedDate - Fecha seleccionada (YYYY-MM-DD)
 * @param {string} selectedTurno - Turno seleccionado ('mediodia' | 'noche' | 'pedidos')
 * @returns {Object} Estados y datos de mesa unificados
 */
export const useTableStates = (reservations = [], orders = [], manualBlocks = new Set(), selectedDate = null, selectedTurno = null) => {
  
  // Throttling para logging (solo mostrar cada 500ms)
  const lastLogTime = useRef(0);
  const logCounter = useRef(0);
  
  return useMemo(() => {
    // Calculando estados unificados

    // ✅ NUEVA LÓGICA: Usar el servicio unificado para calcular estados
    const tableStates = calculateRealTableStates(
      reservations,
      orders,
      manualBlocks,
      selectedDate,
      selectedTurno
    );

    // Estados calculados

    // Crear mapas de conveniencia para compatibilidad con código existente
    const occupiedTables = new Set();
    const reservedTables = new Set();
    const availableTables = new Set();
    const tableAssignments = {};

    tableStates.forEach((state, tableId) => {
      switch (state.state) {
        case 'occupied':
          occupiedTables.add(tableId);
          if (state.type === 'reservation' && state.details?.reservationId) {
            tableAssignments[state.details.reservationId] = tableId;
          }
          break;
        case 'reserved':
          reservedTables.add(tableId);
          occupiedTables.add(tableId); // También agregar a occupiedTables para evitar doble asignación
          if (state.type === 'reservation' && state.details?.reservationId) {
            tableAssignments[state.details.reservationId] = tableId;
          }
          break;
        case 'available':
        case 'available-walkin':
          availableTables.add(tableId);
          break;
        case 'blocked':
          // No agregar a ningún conjunto, están bloqueadas
          break;
      }
    });

    // Resumen calculado silenciosamente

    // Filtrar reservas y pedidos procesados
    let filteredReservations = [];
    let activeOrders = [];

    if (selectedTurno === 'pedidos') {
      // En el sistema de pedidos, solo mostrar reservas que hayan hecho check-in Y NO estén completadas
      filteredReservations = reservations.filter(r => {
        return r.estadoCheckIn === 'confirmado' && r.estadoCheckIn !== 'completado';
      });
      activeOrders = orders.filter(order => order.estado !== 'cerrado');
    } else if (selectedDate) {
      // En el sistema de reservas, mostrar todas las reservas del día/turno que NO estén completadas
      filteredReservations = reservations.filter(r => 
        r.fecha === selectedDate && 
        r.turno === selectedTurno && 
        (!r.estadoCheckIn || r.estadoCheckIn !== 'completado')
      );
      activeOrders = orders.filter(order => order.estado !== 'cerrado');
    }

    // Función helper para encontrar ocupante por mesa usando el estado unificado
    const findOccupantByTable = (tableId) => {
      return tableStates.get(tableId);
    };

    // Función helper para obtener estado de mesa usando el estado unificado
    const getTableState = (tableId) => {
      return tableStates.get(tableId)?.state || 'available';
    };

    // Función helper para verificar si mesa está ocupada usando el estado unificado
    const isTableOccupied = (tableId) => {
      const state = tableStates.get(tableId);
      return state ? ['occupied', 'reserved'].includes(state.state) : false;
    };

    // Obtener estadísticas usando el servicio unificado
    const stats = getTableAvailabilityStats(tableStates);

    // Logging inteligente con throttling
    const now = Date.now();
    logCounter.current += 1;
    
    // Solo mostrar log si han pasado 500ms desde el último O si es la primera ejecución
    if (now - lastLogTime.current > 500 || logCounter.current === 1) {
      console.log(`📈 ESTADÍSTICAS FINALES (ejecución #${logCounter.current}):`, stats);
      console.log(`🔄 Dependencias: reservas=${reservations.length}, pedidos=${orders.length}, fecha=${selectedDate}, turno=${selectedTurno}`);
      lastLogTime.current = now;
    }

    return {
      // Estados unificados (NUEVA API)
      tableStates,
      
      // Mapas de compatibilidad (MANTIENE COMPATIBILIDAD)
      occupiedTables,
      reservedTables,
      availableTables,
      tableAssignments,
      
      // Funciones helper (MANTIENE COMPATIBILIDAD)
      findOccupantByTable,
      getTableState,
      isTableOccupied,
      
      // Estadísticas unificadas
      stats,
      
      // Datos procesados para el mapa (MANTIENE COMPATIBILIDAD)
      mapData: {
        reservations: filteredReservations,
        orders: activeOrders,
        tableAssignments,
        occupiedTables,
        reservedTables,
        // NUEVO: Estados unificados para feedback visual
        unifiedStates: tableStates
      }
    };
  }, [reservations, orders, manualBlocks, selectedDate, selectedTurno]);
};

export default useTableStates; 