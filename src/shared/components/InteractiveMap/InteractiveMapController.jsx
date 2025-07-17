import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { UNIFIED_TABLES_LAYOUT as TABLES_LAYOUT, LAYOUT_DIMENSIONS } from '../../../utils/tablesLayout';
import { getTableVisualFeedback } from '../../services/tableManagementService';
import styles from './InteractiveMapController.module.css';

const InteractiveMapController = ({
  reservas = [],
  orders = [],
  blockedTables = new Set(),
  tableStates = null, // ✅ NUEVO: Estados unificados desde useTableStates
  tableAssignments = {},
  occupiedTables = new Set(),
  mode = 'view',
  onTableClick = null,
  onHover = null,
  findOccupantByTable = null,
  selectedReservationId = null,
  forcedTablePopup = null,
  reservationPopup = null,
  setReservationPopup = null,
  orderPopup = null,
  setOrderPopup = null,
  onEditReservation = null,
  onDeleteReservation = null,
  onContactClient = null,
  isOperationOpen = true,
  showNotification = null
}) => {
  const [hoveredTable, setHoveredTable] = useState(null);

  // Configuración de layout - FORZAR vista horizontal
  const useHorizontalLayout = true;
  const tablesLayout = TABLES_LAYOUT;
  const dimensions = LAYOUT_DIMENSIONS.horizontal; // Usar siempre horizontal
  const viewBox = `0 0 ${dimensions.width} ${dimensions.height}`;

  // Manejar popup forzado de mesa
  useEffect(() => {
    if (forcedTablePopup) {
      setOrderPopup(forcedTablePopup);
    }
  }, [forcedTablePopup]);
  
  // ✅ FUNCIÓN ACTUALIZADA: Obtener colores usando el servicio unificado
  const getTableVisualStyles = useCallback((tableId) => {
    if (tableStates) {
      // Usar el nuevo sistema unificado
      const feedback = getTableVisualFeedback(tableId, tableStates);
      return {
        fill: feedback.fill,
        stroke: feedback.stroke,
        strokeWidth: feedback.strokeWidth,
        textColor: feedback.textColor,
        description: feedback.description
      };
    }

    // Fallback para compatibilidad (sistema anterior)
    if (hoveredTable === tableId) {
      return {
        fill: '#34d399',
        stroke: '#059669',
        strokeWidth: 3,
        textColor: '#ffffff',
        description: 'Mesa seleccionada'
      };
    }

    if (blockedTables.has(tableId)) {
      return {
        fill: '#ffffff',
        stroke: '#dc2626',
        strokeWidth: 2,
        textColor: '#dc2626',
        description: 'Mesa bloqueada'
      };
    }

    if (occupiedTables.has(tableId)) {
      return {
        fill: '#2563eb',
        stroke: '#1d4ed8',
        strokeWidth: 3,
        textColor: '#ffffff',
        description: 'Mesa ocupada'
      };
    }

    return {
      fill: '#ffffff',
      stroke: '#10b981',
      strokeWidth: 2,
      textColor: '#0c4900',
      description: 'Mesa disponible'
    };
  }, [tableStates, hoveredTable, blockedTables, occupiedTables]);

  // Función para encontrar ocupante de mesa (mantenida para compatibilidad)
  const findOccupantByTableCallback = useCallback((tableId) => {
    if (tableStates) {
      return tableStates.get(tableId);
    }
    
    if (findOccupantByTable) {
      return findOccupantByTable(tableId);
    }
    
    // Fallback al método original
    if (reservas && reservas.length > 0) {
      const reservation = reservas.find(reserva => {
        if (!reserva.mesaReal) return false;
        
        if (typeof reserva.mesaReal === 'string' && reserva.mesaReal.includes('+')) {
          const tableIds = reserva.mesaReal.split('+').map(id => parseInt(id));
          return tableIds.includes(tableId);
        } else {
          return parseInt(reserva.mesaReal) === tableId;
        }
      });
      
      if (reservation) return reservation;
    }
    
    // Fallback a tableAssignments
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
    
    return null;
  }, [tableStates, findOccupantByTable, reservas, tableAssignments]);

  // Manejar click en mesa
  const handleTableClick = useCallback((tableId) => {
    console.log('🖱️ CLICK en mesa:', tableId);

    if (onTableClick) {
      const tableInfo = tableStates ? tableStates.get(tableId) : null;
      onTableClick(tableId, tableInfo);
    }
  }, [onTableClick, tableStates]);

  // Manejar hover en mesa
  const handleTableHover = useCallback((tableId) => {
    setHoveredTable(tableId);
    if (onHover) {
      onHover(tableId);
    }
  }, [onHover]);

  const handleTableLeave = useCallback(() => {
    setHoveredTable(null);
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);



  // Cerrar popup de pedido
  const handleCloseOrderPopup = useCallback(() => {
    if (setOrderPopup) {
      setOrderPopup(null);
    }
  }, [setOrderPopup]);
  
  // Renderizar mesa individual
  const renderTable = useCallback((table) => {
    const { fill, stroke, strokeWidth, textColor, description } = getTableVisualStyles(table.id);
    
    // Aplicar highlight para mesa seleccionada
    const isSelected = selectedReservationId && tableAssignments[selectedReservationId] === table.id;
    const finalStroke = isSelected ? '#f59e0b' : stroke;
    const finalStrokeWidth = isSelected ? 4 : strokeWidth;
    
    return (
      <g key={table.id}>
        {/* Rectángulo de la mesa */}
        <rect
          x={table.x}
          y={table.y}
          width={table.width}
          height={table.height}
          fill={fill}
          stroke={finalStroke}
          strokeWidth={finalStrokeWidth}
          rx="4"
          ry="4"
          className={styles.tableElement}
          onClick={() => handleTableClick(table.id)}
          onMouseEnter={() => handleTableHover(table.id)}
          onMouseLeave={handleTableLeave}
          style={{ cursor: 'pointer' }}
        >
          <title>{`Mesa ${table.id} - ${description}`}</title>
        </rect>

        {/* Número de mesa */}
        <text
          x={table.x + table.width / 2}
          y={table.y + table.height / 2 - 2}
          textAnchor="middle"
          className={styles.tableNumber}
          fill={textColor}
          fontSize="18"
          fontWeight="bold"
          pointerEvents="none"
        >
          {table.id}
        </text>

        {/* Capacidad de mesa o personas de reserva */}
        <text
          x={table.x + table.width / 2}
          y={table.y + table.height / 2 + 12}
          textAnchor="middle"
          className={styles.tableCapacity}
          fill={textColor}
          fontSize="12"
          pointerEvents="none"
        >
          {(() => {
            // Si hay un estado de mesa unificado, usarlo
            if (tableStates && tableStates.has(table.id)) {
              const state = tableStates.get(table.id);
              if (state.occupant && state.occupant.personas) {
                return `${state.occupant.personas}p`;
              }
            }
            
            // Fallback: buscar en reservas tradicionales
            const occupant = findOccupantByTable?.(table.id);
            if (occupant && occupant.personas) {
              return `${occupant.personas}p`;
            }
            
            // Si no hay reserva, mostrar capacidad de la mesa
            return `${table.capacity}p`;
          })()}
        </text>
      </g>
    );
  }, [getTableVisualStyles, selectedReservationId, tableAssignments, handleTableClick, handleTableHover, handleTableLeave]);

  // Renderizar todas las mesas
  const renderedTables = useMemo(() => {
    return tablesLayout.map(table => renderTable(table));
  }, [tablesLayout, renderTable]);
  
  return (
    <div className={styles.interactiveMapController}>
      <div className={styles.mapContainer}>
        <svg
          className={styles.mapSvg}
          viewBox={viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fondo del mapa */}
          <rect
            x="0"
            y="0"
            width={dimensions.width}
            height={dimensions.height}
            fill="#fafafa"
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Renderizar todas las mesas */}
          {renderedTables}
        </svg>
      </div>
      


      {/* Popup de pedidos (mantenido igual) */}
       {orderPopup && (
        <div className={styles.popupOverlay} onClick={handleCloseOrderPopup}>
           <div 
             className={styles.orderPopup} 
             onClick={(e) => e.stopPropagation()}
           >
             <div className={styles.popupHeader}>
               <div className={styles.popupTitle}>
                <span>🍽️</span>
                Mesa {orderPopup.tableId}
               </div>
              <button
                className={styles.popupCloseButton}
                onClick={handleCloseOrderPopup}
              >
                ✕
               </button>
             </div>
             
             <div className={styles.popupContent}>
              {/* Contenido del popup de pedidos mantenido igual */}
              <p>Información de pedidos para la mesa {orderPopup.tableId}</p>
               </div>
             </div>
           </div>
         )}
      </div>
    );
};

export default InteractiveMapController;