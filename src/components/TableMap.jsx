import React, { useState } from 'react';
import { Printer, Download, Sun, Moon, X } from 'lucide-react';
import styles from './TableMap.module.css';
import { TABLES_LAYOUT, RESERVATION_ORDER, DEFAULT_BLOCKED_TABLES, calculateAutoAssignments, setsAreEqual } from '../utils/mesaLogic';

const TableMap = ({ reservations = [], formatDate, fixedDate = null, showDateSelector = true }) => {
  const [selectedTurno, setSelectedTurno] = useState('mediodia');
  const [tableAssignments, setTableAssignments] = useState({}); // {reservationId: tableId}
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState(false);
  const [blockedTables, setBlockedTables] = useState(() => {
    // Inicializar con bloqueos por defecto
    const defaultBlocked = new Set();
    Object.values(DEFAULT_BLOCKED_TABLES).flat().forEach(tableId => {
      defaultBlocked.add(tableId);
    });
    return defaultBlocked;
  });
  
  // Obtener fecha actual en formato local
  const getTodayString = () => {
    const today = new Date();
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0');
  };
  
  // Generar fechas disponibles (hoy + 7 días)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateString = date.getFullYear() + '-' + 
                        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(date.getDate()).padStart(2, '0');
      dates.push(dateString);
    }
    return dates;
  };

  const [selectedDate, setSelectedDate] = useState(fixedDate || getTodayString());

  const availableDates = React.useMemo(() => getAvailableDates(), []);
  const selectedDateReservations = React.useMemo(
    () => reservations.filter(r => r.fecha === selectedDate),
    [reservations, selectedDate]
  );

  // Si se proporciona fixedDate, usar esa fecha
  React.useEffect(() => {
    if (fixedDate) {
      setSelectedDate(fixedDate);
    }
  }, [fixedDate]);

  // Función para formatear fecha de manera amigable
  const formatDateLabel = (dateString) => {
    const todayString = getTodayString();
    
    // Calcular mañana
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowString = tomorrow.getFullYear() + '-' + 
                          String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(tomorrow.getDate()).padStart(2, '0');
    
    if (dateString === todayString) return 'Hoy';
    if (dateString === tomorrowString) return 'Mañana';
    
    // Para otros días, usar la fecha parseada
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayName = dayNames[date.getDay()];
    
    return `${dayName} ${day}/${month}`;
  };

  // Filtrar reservas por turno seleccionado
  const reservasTurnoSeleccionado = React.useMemo(
    () => selectedDateReservations.filter(r => r.turno === selectedTurno),
    [selectedDateReservations, selectedTurno]
  );

  // Auto-asignación de mesas basada en el orden de prioridad y bloqueos dinámicos
  const autoAssignTables = (reservations, currentBlockedTables) => {
    const { assignments, blockedTables: newBlocked } = calculateAutoAssignments(reservations, currentBlockedTables);
    if (!setsAreEqual(currentBlockedTables, newBlocked)) {
      setBlockedTables(newBlocked);
    }
    return assignments;
  };
  
  // Función para redistribuir bloqueos según ocupación
  const redistribuirBloqueos = (assignments, occupiedTables, blockedTables) => {
    // Contar mesas ocupadas por capacidad
    const occupiedCount = { 2: 0, 4: 0, 6: 0 };
    const availableCount = { 2: 0, 4: 0, 6: 0 };
    
    TABLES_LAYOUT.forEach(table => {
      if (occupiedTables.has(table.id)) {
        occupiedCount[table.capacity]++;
      } else if (!blockedTables.has(table.id)) {
        availableCount[table.capacity]++;
      }
    });
    
    // Lógica específica: Si se ocupa mesa 21 (última de 2 disponibles)
    if (occupiedTables.has(21) && availableCount[2] === 0) {
      // Bloquear mesa 3 y desbloquear mesas modulares 14 y 24
      blockedTables.add(3);
      blockedTables.delete(14);
      blockedTables.delete(24);
    }
    
    // Mantener siempre 12 cupos para walk-ins ajustando bloqueos según demanda
    const totalWalkInCupos = Array.from(blockedTables).reduce((total, tableId) => {
      const table = TABLES_LAYOUT.find(t => t.id === tableId);
      return total + (table ? table.capacity : 0);
    }, 0);
    
    // Si hay menos de 12 cupos, agregar más bloqueos
    if (totalWalkInCupos < 12) {
      // Intentar bloquear mesas según disponibilidad
      for (const tableId of [3, 12, 13]) {
        if (!occupiedTables.has(tableId) && !blockedTables.has(tableId)) {
          blockedTables.add(tableId);
          break;
        }
      }
    }
  };
  
  // Resetear modo de asignación cuando cambia la fecha
  React.useEffect(() => {
    setSelectedReservation(null);
    setAssignmentMode(false);
  }, [selectedDate]);

  // Calcular asignaciones automáticas cuando cambian las reservas o el turno
  React.useEffect(() => {
    const autoAssignments = autoAssignTables(reservasTurnoSeleccionado, blockedTables);
    setTableAssignments(autoAssignments);
  }, [reservasTurnoSeleccionado, blockedTables]);

  // Forzar aplicación de bloqueos por defecto al cambiar fecha/turno
  React.useEffect(() => {
    // Reinicializar bloqueos por defecto cuando no hay reservas
    if (reservasTurnoSeleccionado.length === 0) {
      const defaultBlocked = new Set();
      Object.values(DEFAULT_BLOCKED_TABLES).flat().forEach(tableId => {
        defaultBlocked.add(tableId);
      });
      setBlockedTables(defaultBlocked);
    }
  }, [selectedDate, selectedTurno, reservasTurnoSeleccionado.length]);

  // Función para determinar si una mesa está ocupada
  const isMesaOcupada = (mesaId) => {
    return Object.values(tableAssignments).includes(mesaId);
  };
  
  // Función para determinar si una mesa está bloqueada
  const isMesaBloqueada = (mesaId) => {
    return blockedTables.has(mesaId);
  };
  
  // Función para obtener el estado de una mesa
  const getMesaStatus = (mesaId) => {
    if (isMesaOcupada(mesaId)) return 'occupied';
    if (isMesaBloqueada(mesaId)) return 'blocked';
    return 'available';
  };

  // Función para obtener la reserva asignada a una mesa
  const getReservaForTable = (mesaId) => {
    const reservationId = Object.keys(tableAssignments).find(id => tableAssignments[id] === mesaId);
    return reservasTurnoSeleccionado.find(r => r.id === reservationId);
  };

  // Función para reasignar mesa manualmente
  const handleTableClick = (tableId) => {
    if (assignmentMode && selectedReservation) {
      const newAssignments = { ...tableAssignments };
      
      // Remover la reserva de su mesa actual
      Object.keys(newAssignments).forEach(resId => {
        if (resId === selectedReservation.id) {
          delete newAssignments[resId];
        }
      });
      
      // Remover cualquier reserva que esté en la mesa clickeada
      Object.keys(newAssignments).forEach(resId => {
        if (newAssignments[resId] === tableId) {
          delete newAssignments[resId];
        }
      });
      
      // Asignar la reserva seleccionada a la nueva mesa
      newAssignments[selectedReservation.id] = tableId;
      
      setTableAssignments(newAssignments);
      setSelectedReservation(null);
      setAssignmentMode(false);
    }
  };

  // Función para seleccionar una reserva para reasignación
  const handleReservationClick = (reserva) => {
    if (assignmentMode && selectedReservation?.id === reserva.id) {
      // Deseleccionar si se hace click en la misma reserva
      setSelectedReservation(null);
      setAssignmentMode(false);
    } else {
      setSelectedReservation(reserva);
      setAssignmentMode(true);
    }
  };

  // Función para cancelar el modo de asignación
  const cancelAssignment = () => {
    setSelectedReservation(null);
    setAssignmentMode(false);
  };

  // Función para reiniciar asignaciones automáticas
  const resetToAutoAssignment = () => {
    const autoAssignments = autoAssignTables(reservasTurnoSeleccionado, blockedTables);
    setTableAssignments(autoAssignments);
    cancelAssignment();
  };
  
  // Función para alternar bloqueo de una mesa
  const toggleTableBlock = (tableId) => {
    const newBlockedTables = new Set(blockedTables);
    if (newBlockedTables.has(tableId)) {
      newBlockedTables.delete(tableId);
    } else {
      // Solo bloquear si no está ocupada
      if (!isMesaOcupada(tableId)) {
        newBlockedTables.add(tableId);
      }
    }
    setBlockedTables(newBlockedTables);
  };
  
  // Función para resetear bloqueos a valores por defecto
  const resetToDefaultBlocks = () => {
    const defaultBlocked = new Set();
    Object.values(DEFAULT_BLOCKED_TABLES).flat().forEach(tableId => {
      defaultBlocked.add(tableId);
    });
    setBlockedTables(defaultBlocked);
    // Recalcular asignaciones con nuevos bloqueos
    const autoAssignments = autoAssignTables(reservasTurnoSeleccionado, defaultBlocked);
    setTableAssignments(autoAssignments);
  };
  
  // Función para calcular cupos disponibles para walk-ins
  const getWalkInCupos = () => {
    return Array.from(blockedTables).reduce((total, tableId) => {
      const table = TABLES_LAYOUT.find(t => t.id === tableId);
      return total + (table ? table.capacity : 0);
    }, 0);
  };

  // Función para imprimir/exportar
  const handlePrint = () => {
    window.print();
  };
  
  // Organizar reservas por turno
  const organizarReservasPorTurno = (reservations) => {
    const mediodia = reservations.filter(r => r.turno === 'mediodia').sort((a, b) => a.horario.localeCompare(b.horario));
    const noche = reservations.filter(r => r.turno === 'noche').sort((a, b) => a.horario.localeCompare(b.horario));
    
    return { mediodia, noche };
  };

  const reservasPorTurno = React.useMemo(
    () => organizarReservasPorTurno(selectedDateReservations),
    [selectedDateReservations]
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Mapa de Mesas - {formatDate(selectedDate)}</h2>
          <p className={styles.subtitle}>
            {selectedDate !== getTodayString() && (
              <span className={styles.futureIndicator}>📅 </span>
            )}
            {formatDateLabel(selectedDate)} • Turno {selectedTurno === 'mediodia' ? 'Mediodía' : 'Noche'} • {reservasTurnoSeleccionado.length} reservas
          </p>
        </div>
        <div className={styles.controls}>
          {showDateSelector && (
            <div className={styles.dateSelector}>
              <label className={styles.selectorLabel}>📅 Fecha:</label>
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.dateSelect}
              >
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {formatDateLabel(date)} ({formatDate(date)})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={styles.turnoSelector}>
            <button 
              onClick={() => setSelectedTurno('mediodia')}
              className={selectedTurno === 'mediodia' ? styles.turnoButtonActive : styles.turnoButtonInactive}
            >
              <Sun size={16} />
              Mediodía
            </button>
            <button 
              onClick={() => setSelectedTurno('noche')}
              className={selectedTurno === 'noche' ? styles.turnoButtonActive : styles.turnoButtonInactive}
            >
              <Moon size={16} />
              Noche
            </button>
          </div>
          <div className={styles.actions}>
            <button onClick={resetToAutoAssignment} className={styles.actionButton}>
              <span>🔄</span>
              Auto-Asignar
            </button>
            <button onClick={resetToDefaultBlocks} className={styles.actionButton}>
              <span>🔒</span>
              Reset Bloqueos
            </button>
            {assignmentMode && (
              <button onClick={cancelAssignment} className={styles.actionButtonCancel}>
                <span>✗</span>
                Cancelar
              </button>
            )}
            <button onClick={handlePrint} className={styles.actionButton}>
              <Printer size={18} />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Mapa de Mesas */}
        <div className={styles.mapSection}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={styles.sectionTitle}>Disposición de Mesas</h3>
            <div className="flex items-center gap-4">
              {/* Indicador de cupos walk-in */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                getWalkInCupos() < 8 ? 'bg-red-100 text-red-800' : 
                getWalkInCupos() < 10 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
              }`}>
                🚶 Walk-ins: {getWalkInCupos()} cupos
              </div>
              {assignmentMode && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  🎯 Modo Asignación
                </div>
              )}
            </div>
          </div>
          <div className={styles.mapContainer}>
            <svg 
              viewBox="0 0 350 600" 
              className={styles.mapSvg}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fondo del restaurante */}
              <rect x="0" y="0" width="350" height="600" fill="#fafafa" stroke="#e5e7eb" strokeWidth="2" />
              
              {/* Divisiones principales - Paredes */}
              {/* Línea horizontal entre mesa 14 y mesa 5 - paralela y centrada entre ellas */}
              <line x1="200" y1="177" x2="280" y2="177" stroke="#374151" strokeWidth="2" />
              
                             {/* Mesas */}
               {TABLES_LAYOUT.map(table => {
                 const status = getMesaStatus(table.id);
                 const isOcupada = status === 'occupied';
                 const isBloqueada = status === 'blocked';
                 
                 // Colores según estado
                 const getStrokeColor = () => {
                   if (isOcupada) return "#dc2626"; // Rojo para ocupadas
                   if (isBloqueada) return "#f59e0b"; // Naranja para bloqueadas
                   return "#0c4900"; // Verde para libres
                 };
                 
                 return (
                   <g key={table.id}>
                     {/* Mesa */}
                     <rect
                       x={table.x}
                       y={table.y}
                       width={table.width}
                       height={table.height}
                       fill="#ffffff"
                       stroke={getStrokeColor()}
                       strokeWidth="2"
                       rx="3"
                       className={`${styles.table} ${assignmentMode ? styles.mesaClickable : ''}`}
                       onClick={() => assignmentMode ? handleTableClick(table.id) : toggleTableBlock(table.id)}
                       style={{
                         cursor: assignmentMode ? 'pointer' : 'pointer'
                       }}
                     />
                     
                     {/* Número de mesa dentro del recuadro */}
                     <text
                       x={table.x + table.width / 2}
                       y={table.y + table.height / 2 + ((isOcupada || isBloqueada) ? -5 : 6)}
                       textAnchor="middle"
                       className={styles.tableNumberInside}
                       fontSize="16"
                       fontWeight="bold"
                       fill="#0c4900"
                     >
                       {table.id}
                     </text>
                     
                     {/* Símbolos según estado */}
                     {isOcupada && (
                       <text
                         x={table.x + table.width / 2}
                         y={table.y + table.height / 2 + 15}
                         textAnchor="middle"
                         fontSize="20"
                         fontWeight="bold"
                         fill="#dc2626"
                       >
                         ➕
                       </text>
                     )}
                     
                     {isBloqueada && (
                       <text
                         x={table.x + table.width / 2}
                         y={table.y + table.height / 2 + 15}
                         textAnchor="middle"
                         fontSize="20"
                         fontWeight="bold"
                         fill="#f59e0b"
                       >
                         ❌
                       </text>
                     )}

                   </g>
                 );
               })}
              
                             {/* Leyenda del mapa */}
               <g>
                 <rect x="30" y="575" width="15" height="12" fill="#ffffff" stroke="#0c4900" strokeWidth="1" rx="1" />
                 <text x="50" y="583" className={styles.legendText} fontSize="9">Libre</text>
                 <rect x="80" y="575" width="15" height="12" fill="#ffffff" stroke="#dc2626" strokeWidth="1" rx="1" />
                 <text x="100" y="583" className={styles.legendText} fontSize="9">➕ Reservada</text>
                 <rect x="150" y="575" width="15" height="12" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" rx="1" />
                 <text x="170" y="583" className={styles.legendText} fontSize="9">❌ Walk-in</text>
               </g>
            </svg>
          </div>
        </div>

        {/* Lista de Reservas del Turno */}
        <div className={styles.reservationsSection}>
          <h3 className={styles.sectionTitle}>
            {selectedTurno === 'mediodia' ? 'Mediodía' : 'Noche'} - {reservasTurnoSeleccionado.length} reservas
          </h3>
          
          {/* Modo de asignación */}
          {assignmentMode && (
            <div className={styles.assignmentMode}>
              <h4>🎯 Modo Asignación</h4>
              <p>Reserva seleccionada: <strong>{selectedReservation?.cliente?.nombre}</strong> ({selectedReservation?.personas} personas)</p>
              <p>Haz click en una mesa para asignar esta reserva</p>
            </div>
          )}
          
          {/* Información del sistema de cupos */}
          <div className={styles.orderSection}>
            <h4 className={styles.orderTitle}>Sistema de Gestión de Cupos</h4>
            <div className={styles.orderGrid}>
              <div className={styles.orderCategory}>
                <span className={styles.orderLabel}>Walk-ins:</span>
                <span className={styles.orderSequence}>
                  {getWalkInCupos()} cupos reservados (mesas: {Array.from(blockedTables).sort((a,b) => a-b).join(', ')})
                </span>
              </div>
              <div className={styles.orderCategory}>
                <span className={styles.orderLabel}>2 pers:</span>
                <span className={styles.orderSequence}>
                  {RESERVATION_ORDER[2].join(' → ')}
                </span>
              </div>
              <div className={styles.orderCategory}>
                <span className={styles.orderLabel}>4 pers:</span>
                <span className={styles.orderSequence}>
                  {RESERVATION_ORDER[4].join(' → ')}
                </span>
              </div>
              <div className={styles.orderCategory}>
                <span className={styles.orderLabel}>6 pers:</span>
                <span className={styles.orderSequence}>
                  {RESERVATION_ORDER[6].join(' → ')}
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              💡 Click en las mesas para bloquear/desbloquear. El sistema redistribuye automáticamente.
            </div>
          </div>
          
          {reservasTurnoSeleccionado.length === 0 ? (
            <div className={styles.noReservations}>
              <p>No hay reservas para este turno</p>
            </div>
          ) : (
            <div className={styles.reservationsList}>
              {/* Lista compacta para impresión */}
              <div className={styles.printReservationsList}>
                {reservasTurnoSeleccionado
                  .sort((a, b) => a.horario.localeCompare(b.horario))
                  .map((reserva, index) => (
                  <div key={reserva.id} className={styles.printReservationItem}>
                    {reserva.cliente.nombre} - x{reserva.personas} - {reserva.horario}
                    {tableAssignments[reserva.id] && ` Mesa ${tableAssignments[reserva.id]}`}
                  </div>
                ))}
              </div>
              
              {/* Vista detallada para pantalla */}
              <div className={styles.reservationGrid}>
                {reservasTurnoSeleccionado
                  .sort((a, b) => a.horario.localeCompare(b.horario))
                  .map((reserva, index) => (
                  <div 
                    key={reserva.id} 
                    className={`${styles.reservationCard} ${
                      selectedReservation?.id === reserva.id ? styles.reservationSelected : ''
                    } ${styles.reservationClickable}`}
                    onClick={() => handleReservationClick(reserva)}
                  >
                    <div className={styles.reservationTime}>{reserva.horario}</div>
                    <div className={styles.reservationDetails}>
                      <div className={styles.reservationName}>{reserva.cliente.nombre}</div>
                      <div className={styles.reservationInfo}>
                        {reserva.personas} personas • {reserva.reservationId}
                      </div>
                      {tableAssignments[reserva.id] && (
                        <div className={styles.assignedTable}>
                          📍 Mesa {tableAssignments[reserva.id]}
                        </div>
                      )}
                      {reserva.cliente.comentarios && (
                        <div className={styles.reservationComments}>
                          "{reserva.cliente.comentarios}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional para impresión */}
      <div className={styles.printInfo}>
        <p>Generado el {new Date().toLocaleString('es-AR')} | Rosaura - Sistema de Reservas</p>
      </div>
    </div>
  );
};

export default TableMap; 