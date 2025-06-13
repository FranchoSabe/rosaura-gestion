/*
  Utilidades centralizadas para la lógica de mesas y cupos.
  Cualquier cambio sobre layout, bloqueos o auto-asignación se realiza aquí
  y queda compartido por todas las vistas.
*/

// Layout de mesas (coincide con el utilizado hasta ahora)
export const TABLES_LAYOUT = [
  // Zona superior (alineadas verticalmente - horizontales para 4 personas)
  { id: 12, x: 50, y: 40, width: 80, height: 50, capacity: 4 },
  { id: 13, x: 140, y: 40, width: 80, height: 50, capacity: 4 },

  // Zona superior-media (mesas modulares cuadradas para 2 personas)
  { id: 21, x: 50, y: 110, width: 50, height: 50, capacity: 2 },
  { id: 11, x: 50, y: 170, width: 50, height: 50, capacity: 2 },
  { id: 24, x: 140, y: 110, width: 50, height: 50, capacity: 2 },
  { id: 14, x: 200, y: 110, width: 50, height: 50, capacity: 2 },

  // Zona central (después de la división principal)
  { id: 10, x: 50, y: 230, width: 80, height: 50, capacity: 4 },
  { id: 9, x: 50, y: 290, width: 80, height: 50, capacity: 4 },
  { id: 8, x: 50, y: 350, width: 50, height: 50, capacity: 2 },

  // Columna central
  { id: 6, x: 150, y: 230, width: 50, height: 80, capacity: 4 },
  { id: 7, x: 150, y: 320, width: 60, height: 90, capacity: 6 },

  // Columna derecha
  { id: 5, x: 230, y: 195, width: 50, height: 80, capacity: 4 },
  { id: 4, x: 230, y: 285, width: 50, height: 80, capacity: 4 },
  { id: 3, x: 230, y: 375, width: 50, height: 80, capacity: 4 },
  { id: 2, x: 230, y: 465, width: 50, height: 50, capacity: 2 },

  // Inferior
  { id: 1, x: 120, y: 465, width: 50, height: 50, capacity: 2 },
  { id: 31, x: 180, y: 465, width: 50, height: 50, capacity: 2 },
];

// Orden de reserva de mesas por capacidad
export const RESERVATION_ORDER = {
  2: [2, 8, 11, 21, 1, 31],
  4: [9, 10, 6, 12, 13, 3],
  6: [7],
};

// Bloqueos por defecto para walk-ins (12 cupos)
export const DEFAULT_BLOCKED_TABLES = {
  2: [1, 31], // 4 cupos
  4: [4, 5],  // 8 cupos
};

export const setsAreEqual = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

// Lógica para redistribuir bloqueos dinámicamente (idéntica a la de TableMap original)
export const redistribuirBloqueos = (assignments, occupiedTables, blockedTables) => {
  const occupiedCount = { 2: 0, 4: 0, 6: 0 };
  const availableCount = { 2: 0, 4: 0, 6: 0 };

  TABLES_LAYOUT.forEach((mesa) => {
    if (occupiedTables.has(mesa.id)) {
      occupiedCount[mesa.capacity] += 1;
    } else if (!blockedTables.has(mesa.id)) {
      availableCount[mesa.capacity] += 1;
    }
  });

  // Ejemplo de regla: si se ocupa la mesa 21 y ya no quedan de 2 libres, bloquear 3 y desbloquear modulares
  if (occupiedTables.has(21) && availableCount[2] === 0) {
    blockedTables.add(3);
    blockedTables.delete(14);
    blockedTables.delete(24);
  }

  // Mantener al menos 12 cupos walk-in
  const totalWalkIn = [...blockedTables].reduce((acc, id) => {
    const mesa = TABLES_LAYOUT.find((t) => t.id === id);
    return acc + (mesa ? mesa.capacity : 0);
  }, 0);

  if (totalWalkIn < 12) {
    for (const id of [3, 12, 13]) {
      if (!occupiedTables.has(id) && !blockedTables.has(id)) {
        blockedTables.add(id);
        break;
      }
    }
  }
};

// Función principal de auto-asignación pura
export const calculateAutoAssignments = (reservas, currentBlocked) => {
  const assignments = {};
  const occupiedTables = new Set();
  const newBlocked = new Set(currentBlocked);

  // Orden cronológico
  const ordenadas = [...reservas].sort((a, b) => a.horario.localeCompare(b.horario));

  for (const reserva of ordenadas) {
    let capacidadObjetivo = reserva.personas === 5 ? 6 : reserva.personas;

    let posibleOrden = RESERVATION_ORDER[capacidadObjetivo];
    if (!posibleOrden) {
      for (const cap of [4, 6]) {
        if (cap >= reserva.personas && RESERVATION_ORDER[cap]) {
          posibleOrden = RESERVATION_ORDER[cap];
          break;
        }
      }
    }

    if (!posibleOrden) continue;

    // Priorizar mesas no bloqueadas
    let asignada = false;
    for (const id of posibleOrden) {
      if (!occupiedTables.has(id) && !newBlocked.has(id)) {
        assignments[reserva.id] = id;
        occupiedTables.add(id);
        asignada = true;
        break;
      }
    }

    // Si no se logró asignar, usar bloqueadas liberándolas
    if (!asignada) {
      for (const id of posibleOrden) {
        if (!occupiedTables.has(id) && newBlocked.has(id)) {
          assignments[reserva.id] = id;
          occupiedTables.add(id);
          newBlocked.delete(id);
          break;
        }
      }
    }
  }

  // Ajustar bloqueos dinámicos
  redistribuirBloqueos(assignments, occupiedTables, newBlocked);

  return {
    assignments,
    blockedTables: newBlocked,
  };
};

// Función para guardar asignaciones de mesas en las reservas
export const saveTableAssignments = async (assignments, onUpdateReservation, showNotification) => {
  try {
    const promises = Object.entries(assignments).map(([reservationId, tableId]) => {
      return onUpdateReservation(reservationId, { mesaAsignada: tableId }, true);
    });
    
    await Promise.all(promises);
    
    if (showNotification) {
      showNotification('success', 'Asignaciones de mesas guardadas correctamente');
    }
    
    return true;
  } catch (error) {
    console.error('Error al guardar asignaciones:', error);
    if (showNotification) {
      showNotification('error', 'Error al guardar las asignaciones de mesas');
    }
    throw error;
  }
};

// Función para guardar bloqueos de mesas
export const saveBlockedTables = async (blockedTables, fecha, turno, onSaveBlockedTables, showNotification) => {
  try {
    const blockedTablesArray = Array.from(blockedTables);
    await onSaveBlockedTables(fecha, turno, blockedTablesArray);
    
    if (showNotification) {
      showNotification('success', 'Bloqueos de mesas guardados correctamente');
    }
    
    return true;
  } catch (error) {
    console.error('Error al guardar bloqueos:', error);
    if (showNotification) {
      showNotification('error', 'Error al guardar los bloqueos de mesas');
    }
    throw error;
  }
};

// Función para cargar bloqueos guardados
export const loadBlockedTables = async (fecha, turno, onLoadBlockedTables) => {
  try {
    const savedBlocked = await onLoadBlockedTables(fecha, turno);
    return new Set(savedBlocked || []);
  } catch (error) {
    console.error('Error al cargar bloqueos:', error);
    // Retornar bloqueos por defecto si hay error
    const defaultBlocked = new Set();
    Object.values(DEFAULT_BLOCKED_TABLES).flat().forEach((id) => defaultBlocked.add(id));
    return defaultBlocked;
  }
};

// Función para asignar mesa automáticamente a una nueva reserva
export const assignTableToNewReservation = (newReservation, existingReservations, currentBlocked = new Set()) => {
  // Filtrar reservas del mismo turno y fecha
  const reservationsForTurno = existingReservations.filter(
    r => r.fecha === newReservation.fecha && r.turno === newReservation.turno
  );

  // Determinar capacidad objetivo
  let capacidadObjetivo = newReservation.personas === 5 ? 6 : newReservation.personas;
  
  // Obtener orden de mesas posibles
  let posibleOrden = RESERVATION_ORDER[capacidadObjetivo];
  if (!posibleOrden) {
    for (const cap of [4, 6]) {
      if (cap >= newReservation.personas && RESERVATION_ORDER[cap]) {
        posibleOrden = RESERVATION_ORDER[cap];
        break;
      }
    }
  }

  if (!posibleOrden) return null; // No hay mesas disponibles para esta capacidad

  // Obtener mesas ya ocupadas por otras reservas
  const occupiedTables = new Set();
  reservationsForTurno.forEach(reservation => {
    if (reservation.mesaAsignada) {
      occupiedTables.add(reservation.mesaAsignada);
    }
  });

  // Intentar asignar mesa priorizando no bloqueadas
  for (const tableId of posibleOrden) {
    if (!occupiedTables.has(tableId) && !currentBlocked.has(tableId)) {
      return tableId;
    }
  }

  // Si no hay mesas no bloqueadas, intentar con bloqueadas
  for (const tableId of posibleOrden) {
    if (!occupiedTables.has(tableId) && currentBlocked.has(tableId)) {
      return tableId;
    }
  }

  // No hay mesa disponible
  return null;
};

// Función para validar conflictos de mesa
export const validateTableAssignment = (reservationId, tableId, fecha, turno, existingReservations) => {
  const conflictingReservation = existingReservations.find(
    r => r.id !== reservationId && 
        r.fecha === fecha && 
        r.turno === turno && 
        r.mesaAsignada === tableId
  );

  return {
    hasConflict: !!conflictingReservation,
    conflictingReservation: conflictingReservation || null
  };
};

// Función para reasignación manual de mesas desde el admin panel
export const reassignTableManually = async (reservationId, newTableId, reservations, onUpdateReservation, showNotification, forceAssignment = false) => {
  try {
    // Buscar la reserva a reasignar
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    // Validar conflictos si no es una asignación forzada
    if (!forceAssignment) {
      const conflict = validateTableAssignment(reservationId, newTableId, reservation.fecha, reservation.turno, reservations);
      
      if (conflict.hasConflict) {
        // Retornar información del conflicto para que el admin pueda decidir
        return {
          success: false,
          hasConflict: true,
          conflictingReservation: conflict.conflictingReservation,
          message: `La mesa ${newTableId} ya está asignada a ${conflict.conflictingReservation.cliente.nombre} (${conflict.conflictingReservation.personas} personas)`
        };
      }
    }

    // Actualizar la reserva con la nueva mesa
    await onUpdateReservation(reservationId, { mesaAsignada: newTableId }, true);

    if (showNotification) {
      showNotification('success', `Mesa ${newTableId} asignada correctamente${forceAssignment ? ' (forzado)' : ''}`);
    }

    return {
      success: true,
      hasConflict: false,
      message: `Mesa ${newTableId} asignada correctamente`
    };

  } catch (error) {
    console.error('Error al reasignar mesa:', error);
    if (showNotification) {
      showNotification('error', 'Error al asignar la mesa');
    }
    throw error;
  }
}; 