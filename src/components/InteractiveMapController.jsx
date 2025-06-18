import React, { useState, useCallback, useMemo } from 'react';
import { calculateWalkInQuotas } from '../utils/mesaLogic';
import { UNIFIED_TABLES_LAYOUT } from '../utils/tablesLayout';
import styles from './InteractiveMapController.module.css';
import { X, Edit2, MessageCircle, Trash2, Phone, Clock, Users, MapPin } from 'lucide-react';

const InteractiveMapController = ({
  fecha,
  turno, 
  reservas = [],
  mode = 'view',
  tableAssignments = {},
  blockedTables = new Set(),
  onTableClick = null,
  onBlockedTablesChange = null,
  selectedReservation = null,
  showNotification = null,
  className = "w-full h-auto",
  onEditReservation = null,
  onDeleteReservation = null,
  onContactClient = null,
  formatDate = null
}) => {
  const [hoveredTable, setHoveredTable] = useState(null);
  const [reservationPopup, setReservationPopup] = useState(null);
  
  // Calcular mesas ocupadas
  const occupiedTables = useMemo(() => {
    const occupied = new Set();
    Object.values(tableAssignments).forEach(assignment => {
      if (typeof assignment === 'string' && assignment.includes('+')) {
        assignment.split('+').forEach(id => occupied.add(parseInt(id)));
      } else if (assignment) {
        occupied.add(parseInt(assignment));
      }
    });
    return occupied;
  }, [tableAssignments]);
  
  // Función para encontrar la reserva asociada a una mesa
  const findReservationByTable = useCallback((tableId) => {
    if (!reservas || reservas.length === 0) return null;
    
    // Buscar en tableAssignments
    for (const [reservationId, assignment] of Object.entries(tableAssignments)) {
      if (typeof assignment === 'string' && assignment.includes('+')) {
        const tableIds = assignment.split('+').map(id => parseInt(id));
        if (tableIds.includes(tableId)) {
          return reservas.find(r => r.id === reservationId);
        }
      } else if (parseInt(assignment) === tableId) {
        return reservas.find(r => r.id === reservationId);
      }
    }
    
    // Fallback: buscar en las reservas directamente por mesaAsignada
    return reservas.find(reserva => {
      if (!reserva.mesaAsignada) return false;
      
      if (typeof reserva.mesaAsignada === 'string' && reserva.mesaAsignada.includes('+')) {
        const tableIds = reserva.mesaAsignada.split('+').map(id => parseInt(id));
        return tableIds.includes(tableId);
      } else {
        return parseInt(reserva.mesaAsignada) === tableId;
      }
    });
  }, [reservas, tableAssignments]);
  
  // Estado visual de mesa
  const getTableState = useCallback((tableId) => {
    if (hoveredTable === tableId) return 'hovered';
    if (blockedTables.has(tableId)) return 'blocked';
    if (occupiedTables.has(tableId)) return 'occupied';
    return 'available';
  }, [hoveredTable, blockedTables, occupiedTables]);
  
  // Manejar click en mesa
  const handleTableClick = useCallback((tableId, event) => {
    event?.stopPropagation();
    
    // Si la mesa está ocupada y estamos en modo view, mostrar popup de reserva
    if (mode === 'view' && occupiedTables.has(tableId)) {
      const reservation = findReservationByTable(tableId);
      if (reservation) {
        setReservationPopup({
          reservation,
          tableId,
          position: { x: event?.clientX || 0, y: event?.clientY || 0 }
        });
        return;
      }
    }
    
    if (onTableClick) {
      onTableClick(tableId, {
        state: getTableState(tableId),
        isOccupied: occupiedTables.has(tableId),
        isBlocked: blockedTables.has(tableId),
        mode,
        selectedReservation
      });
    }
    
    // En modo cupos, alternar bloqueo
    if (mode === 'cupos') {
      const newBlocked = new Set(blockedTables);
      if (newBlocked.has(tableId)) {
        newBlocked.delete(tableId);
      } else {
        newBlocked.add(tableId);
      }
      
      if (onBlockedTablesChange) {
        onBlockedTablesChange(newBlocked);
      }
    }
  }, [onTableClick, getTableState, occupiedTables, blockedTables, mode, selectedReservation, onBlockedTablesChange, findReservationByTable]);
  
  // Cerrar popup
  const closePopup = useCallback(() => {
    setReservationPopup(null);
  }, []);
  
  // Funciones para acciones del popup
  const handleEditReservation = useCallback(() => {
    if (reservationPopup && onEditReservation) {
      onEditReservation(reservationPopup.reservation);
      closePopup();
    }
  }, [reservationPopup, onEditReservation, closePopup]);
  
  const handleDeleteReservation = useCallback(() => {
    if (reservationPopup && onDeleteReservation) {
      onDeleteReservation(reservationPopup.reservation);
      closePopup();
    }
  }, [reservationPopup, onDeleteReservation, closePopup]);
  
  const handleContactClient = useCallback(() => {
    if (reservationPopup && onContactClient) {
      onContactClient(reservationPopup.reservation);
      closePopup();
    }
  }, [reservationPopup, onContactClient, closePopup]);
  
  // Renderizar mesa individual
  const renderTable = useCallback((table) => {
    const { id, x, y, width, height, capacity } = table;
    const state = getTableState(id);
    const isOccupied = occupiedTables.has(id);
    const isBlocked = blockedTables.has(id);
    
    // Definir colores según estado (similar al RestaurantTableMap)
    const fillColor = state === 'hovered' ? '#34d399' :
                     isOccupied ? '#ffffff' :
                     isBlocked ? '#ffffff' : '#ffffff';
    
    const strokeColor = state === 'hovered' ? '#059669' :
                       isOccupied ? '#dc2626' :
                       isBlocked ? '#f59e0b' : '#0c4900';
    
    const strokeWidth = state === 'hovered' ? 3 : 2;
    
    return (
      <g 
        key={`table-${id}-${mode}`}
        className="cursor-pointer"
        onClick={(e) => handleTableClick(id, e)}
        onMouseEnter={() => setHoveredTable(id)}
        onMouseLeave={() => setHoveredTable(null)}
        style={{ cursor: 'pointer' }}
      >
        {/* Mesa base */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          rx={3}
          className="transition-all duration-200"
        />
        
        {/* Número de mesa */}
        <text
          x={x + width/2}
          y={y + height/2 + (isOccupied || isBlocked ? -5 : 6)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fontWeight="bold"
          fill="#0c4900"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {id}
        </text>
        
        {/* Indicadores visuales para estados especiales */}
        {isOccupied && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Cruz azul para reservadas */}
            <line
              x1={x + width/2 - 5}
              y1={y + height/2 + 10}
              x2={x + width/2 + 5}
              y2={y + height/2 + 10}
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1={x + width/2}
              y1={y + height/2 + 5}
              x2={x + width/2}
              y2={y + height/2 + 15}
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}
        
        {isBlocked && (
          <g style={{ pointerEvents: 'none' }}>
            {/* X roja para bloqueadas */}
            <line
              x1={x + width/2 - 4}
              y1={y + height/2 + 6}
              x2={x + width/2 + 4}
              y2={y + height/2 + 14}
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1={x + width/2 + 4}
              y1={y + height/2 + 6}
              x2={x + width/2 - 4}
              y2={y + height/2 + 14}
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}

      </g>
    );
  }, [getTableState, occupiedTables, blockedTables, handleTableClick]);
  
  const currentWalkInQuotas = useMemo(() => {
    return calculateWalkInQuotas(blockedTables);
  }, [blockedTables]);
  
  return (
    <div className={styles.interactiveMapController}>
      <div className={styles.mapContainer}>
        <svg
          viewBox="0 0 230 450"
          className={styles.mapSvg}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="230" height="450" fill="#fafafa" stroke="#e5e7eb" strokeWidth="2" />
          
          {UNIFIED_TABLES_LAYOUT.map(renderTable)}
          
          {/* Info compacta solo cuando sea necesaria */}
          {mode === 'cupos' && (
            <text x="115" y="15" textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="500">
              Walk-in: {currentWalkInQuotas}p | Bloqueadas: {blockedTables.size}
            </text>
          )}
          
          {mode === 'assignment' && selectedReservation && (
            <text x="115" y="15" textAnchor="middle" fontSize="10" fill="#059669" fontWeight="500">
              Asignando: {selectedReservation.cliente.nombre} ({selectedReservation.personas}p)
            </text>
          )}
          

          
          {/* Leyenda simplificada cuando no hay modo especial */}
          {mode === 'view' && (
            <text x="115" y="435" textAnchor="middle" fontSize="8" fill="#6b7280">
              Verde: Libre | Azul: Reservada | Amarillo: Walk-in
            </text>
          )}
          

        </svg>
      </div>
      
      {/* Popup de detalles de reserva */}
      {reservationPopup && (
        <div className={styles.popupOverlay} onClick={closePopup}>
          <div 
            className={styles.reservationPopup} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.popupHeader}>
              <div className={styles.popupTitle}>
                <MapPin size={18} />
                <span>Mesa {reservationPopup.tableId}</span>
              </div>
              <button onClick={closePopup} className={styles.popupCloseButton}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.popupContent}>
              <div className={styles.reservationInfo}>
                <div className={styles.clientName}>
                  {reservationPopup.reservation.cliente?.nombre || 'Sin nombre'}
                </div>
                
                <div className={styles.reservationDetails}>
                  <div className={styles.detailRow}>
                    <Clock size={16} />
                    <span>{reservationPopup.reservation.horario}</span>
                  </div>
                  
                  <div className={styles.detailRow}>
                    <Users size={16} />
                    <span>{reservationPopup.reservation.personas} personas</span>
                  </div>
                  
                  {reservationPopup.reservation.cliente?.telefono && (
                    <div className={styles.detailRow}>
                      <Phone size={16} />
                      <span>{reservationPopup.reservation.cliente.telefono}</span>
                    </div>
                  )}
                  
                  {formatDate && (
                    <div className={styles.detailRow}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {formatDate(reservationPopup.reservation.fecha)}
                      </span>
                    </div>
                  )}
                  
                  {reservationPopup.reservation.cliente?.comentarios && (
                    <div className={styles.commentSection}>
                      <strong>Comentarios:</strong>
                      <p>{reservationPopup.reservation.cliente.comentarios}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.popupActions}>
                {onEditReservation && (
                  <button 
                    onClick={handleEditReservation}
                    className={`${styles.actionButton} ${styles.editButton}`}
                  >
                    <Edit2 size={16} />
                    Editar
                  </button>
                )}
                
                {onContactClient && (
                  <button 
                    onClick={handleContactClient}
                    className={`${styles.actionButton} ${styles.contactButton}`}
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </button>
                )}
                
                {onDeleteReservation && (
                  <button 
                    onClick={handleDeleteReservation}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    <Trash2 size={16} />
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMapController;