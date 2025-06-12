import React, { useState } from 'react';
import { Printer, Download, Sun, Moon, X } from 'lucide-react';
import styles from './TableMap.module.css';

// Configuración del mapa de mesas - Layout real de Rosaura (comprimido)
const TABLES_LAYOUT = [
  // Zona superior (alineadas verticalmente - horizontales para 4 personas)
  { id: 12, x: 50, y: 40, width: 80, height: 50, capacity: 4 }, // rectangular horizontal
  { id: 13, x: 140, y: 40, width: 80, height: 50, capacity: 4 }, // rectangular horizontal
  
  // Zona superior-media (mesas modulares cuadradas para 2 personas)
  { id: 21, x: 50, y: 110, width: 50, height: 50, capacity: 2 }, // cuadrada
  { id: 11, x: 50, y: 170, width: 50, height: 50, capacity: 2 }, // cuadrada (alineada con 10)
  { id: 24, x: 140, y: 110, width: 50, height: 50, capacity: 2 }, // cuadrada
  { id: 14, x: 200, y: 110, width: 50, height: 50, capacity: 2 }, // cuadrada (a la derecha de 24)
  
  // Zona central (después de la división principal)
  // Columna izquierda: 10, 9, 8 alineadas verticalmente (rectangulares horizontales como 12 y 13)
  { id: 10, x: 50, y: 230, width: 80, height: 50, capacity: 4 }, // rectangular horizontal (igual que 12 y 13)
  { id: 9, x: 50, y: 290, width: 80, height: 50, capacity: 4 }, // rectangular horizontal (igual que 12 y 13)
  { id: 8, x: 50, y: 350, width: 50, height: 50, capacity: 2 }, // cuadrada (igual que 2)
  
  // Columna central: 6 y 7 verticales
  { id: 6, x: 150, y: 230, width: 50, height: 80, capacity: 4 }, // rectangular vertical (igual tamaño que 12 y 13 pero vertical)
  { id: 7, x: 150, y: 320, width: 60, height: 90, capacity: 6 }, // rectangular vertical más grande (sin cambios)
  
  // Columna derecha: 5, 4, 3, 2 alineadas verticalmente
  { id: 5, x: 230, y: 195, width: 50, height: 80, capacity: 4 }, // rectangular vertical (igual tamaño que 12 y 13 pero vertical)
  { id: 4, x: 230, y: 285, width: 50, height: 80, capacity: 4 }, // rectangular vertical (igual tamaño que 12 y 13 pero vertical)
  { id: 3, x: 230, y: 375, width: 50, height: 80, capacity: 4 }, // rectangular vertical (igual tamaño que 12 y 13 pero vertical)
  { id: 2, x: 230, y: 465, width: 50, height: 50, capacity: 2 }, // cuadrada (sin cambios)
  
  // Mesas inferiores a la misma altura que mesa 2 (más compacto)
  { id: 1, x: 120, y: 465, width: 50, height: 50, capacity: 2 }, // cuadrada (igual que 2) - reposicionada
  { id: 31, x: 180, y: 465, width: 50, height: 50, capacity: 2 }, // cuadrada (igual que 2) - reposicionada
];

// Reglas de orden de reserva de mesas
const RESERVATION_ORDER = {
  2: [1, 31, 2, 8], // Mesas para 2 personas
  4: [3, 4, 5, 6],  // Mesas para 4 personas
  6: [7]            // Mesa para 6 personas
};

const TableMap = ({ reservations = [], formatDate, fixedDate = null, showDateSelector = true }) => {
  const [selectedTurno, setSelectedTurno] = useState('mediodia');
  const [tableAssignments, setTableAssignments] = useState({}); // {reservationId: tableId}
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState(false);
  
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

  // Auto-asignación de mesas basada en el orden de prioridad
  const autoAssignTables = (reservations) => {
    const assignments = {};
    const occupiedTables = new Set();
    
    // Ordenar reservas por horario
    const sortedReservations = [...reservations].sort((a, b) => a.horario.localeCompare(b.horario));
    
    for (const reserva of sortedReservations) {
      const capacity = reserva.personas;
      let targetCapacity = capacity;
      
      // Si es para 5 personas, usar mesa de 6
      if (capacity === 5) targetCapacity = 6;
      
      // Si no hay mesas exactas, usar la siguiente capacidad disponible
      let availableOrder = RESERVATION_ORDER[targetCapacity];
      if (!availableOrder) {
        // Buscar en capacidades mayores
        for (const cap of [4, 6]) {
          if (cap >= capacity && RESERVATION_ORDER[cap]) {
            availableOrder = RESERVATION_ORDER[cap];
            break;
          }
        }
      }
      
      if (availableOrder) {
        // Buscar la primera mesa disponible en el orden
        for (const tableId of availableOrder) {
          if (!occupiedTables.has(tableId)) {
            assignments[reserva.id] = tableId;
            occupiedTables.add(tableId);
            break;
          }
        }
      }
    }
    
    return assignments;
  };

  // Resetear modo de asignación cuando cambia la fecha
  React.useEffect(() => {
    setSelectedReservation(null);
    setAssignmentMode(false);
  }, [selectedDate]);

  // Calcular asignaciones automáticas cuando cambian las reservas o el turno
  React.useEffect(() => {
    const autoAssignments = autoAssignTables(reservasTurnoSeleccionado);
    setTableAssignments(autoAssignments);
  }, [reservasTurnoSeleccionado]);

  // Función para determinar si una mesa está ocupada
  const isMesaOcupada = (mesaId) => {
    return Object.values(tableAssignments).includes(mesaId);
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
    const autoAssignments = autoAssignTables(reservasTurnoSeleccionado);
    setTableAssignments(autoAssignments);
    cancelAssignment();
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
          <h3 className={styles.sectionTitle}>Disposición de Mesas</h3>
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
                 const isOcupada = isMesaOcupada(table.id);
                 
                 return (
                   <g key={table.id}>
                     {/* Mesa */}
                     <rect
                       x={table.x}
                       y={table.y}
                       width={table.width}
                       height={table.height}
                       fill="#ffffff"
                       stroke={isOcupada ? "#dc2626" : "#0c4900"}
                       strokeWidth="2"
                       rx="3"
                       className={`${styles.table} ${assignmentMode ? styles.mesaClickable : ''}`}
                       onClick={() => handleTableClick(table.id)}
                       style={{
                         cursor: assignmentMode ? 'pointer' : 'default'
                       }}
                     />
                     
                     {/* Número de mesa dentro del recuadro */}
                     <text
                       x={table.x + table.width / 2}
                       y={table.y + table.height / 2 + (isOcupada ? -5 : 6)}
                       textAnchor="middle"
                       className={styles.tableNumberInside}
                       fontSize="16"
                       fontWeight="bold"
                       fill="#0c4900"
                     >
                       {table.id}
                     </text>
                     
                     {/* X para mesas ocupadas */}
                     {isOcupada && (
                       <text
                         x={table.x + table.width / 2}
                         y={table.y + table.height / 2 + 15}
                         textAnchor="middle"
                         fontSize="24"
                         fontWeight="bold"
                         fill="#dc2626"
                       >
                         ✗
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
                 <text x="100" y="583" className={styles.legendText} fontSize="9">Ocupada</text>
                 <text x="140" y="583" className={styles.legendText} fontSize="9">✗ = Reservada</text>
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
          
          {/* Orden de reserva de mesas */}
          <div className={styles.orderSection}>
            <h4 className={styles.orderTitle}>Orden de Reserva</h4>
            <div className={styles.orderGrid}>
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