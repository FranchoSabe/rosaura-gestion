import React, { useState, useCallback, useMemo } from 'react';
import { calculateWalkInQuotas } from '../utils/mesaLogic';
import { UNIFIED_TABLES_LAYOUT } from '../utils/tablesLayout';

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
  className = "w-full h-auto"
}) => {
  const [hoveredTable, setHoveredTable] = useState(null);
  
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
  
  // Estado visual de mesa
  const getTableState = useCallback((tableId) => {
    if (hoveredTable === tableId) return 'hovered';
    if (blockedTables.has(tableId)) return 'blocked';
    if (occupiedTables.has(tableId)) return 'occupied';
    return 'available';
  }, [hoveredTable, blockedTables, occupiedTables]);
  
  // Color de mesa según estado
  const getTableColor = useCallback((tableId) => {
    const state = getTableState(tableId);
    const colors = {
      available: '#e5e7eb',
      occupied: '#fca5a5', 
      blocked: '#fbbf24',
      hovered: '#34d399'
    };
    return colors[state] || colors.available;
  }, [getTableState]);
  
  // Manejar click en mesa
  const handleTableClick = useCallback((tableId, event) => {
    event?.stopPropagation();
    
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
  }, [onTableClick, getTableState, occupiedTables, blockedTables, mode, selectedReservation, onBlockedTablesChange]);
  
  // Renderizar mesa individual
  const renderTable = useCallback((table) => {
    const { id, x, y, width, height, capacity } = table;
    const color = getTableColor(id);
    
    return (
      <g key={`table-${id}`}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          stroke="#6b7280"
          strokeWidth={2}
          rx={4}
          className="cursor-pointer transition-all duration-200 hover:opacity-80"
          onClick={(e) => handleTableClick(id, e)}
          onMouseEnter={() => setHoveredTable(id)}
          onMouseLeave={() => setHoveredTable(null)}
        />
        
        <text
          x={x + width/2}
          y={y + height/2 - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-bold fill-gray-800 pointer-events-none"
        >
          {id}
        </text>
        
        <text
          x={x + width/2}
          y={y + height/2 + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-gray-600 pointer-events-none"
        >
          {capacity}p
        </text>
      </g>
    );
  }, [getTableColor, handleTableClick]);
  
  const currentWalkInQuotas = useMemo(() => {
    return calculateWalkInQuotas(blockedTables);
  }, [blockedTables]);
  
  return (
    <div className={`interactive-map-controller ${className}`}>
      {mode === 'cupos' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-blue-900">
              Cupos Walk-in: <span className="font-bold">{currentWalkInQuotas} personas</span>
            </span>
            <span className="text-blue-700">
              Mesas bloqueadas: {blockedTables.size}
            </span>
          </div>
        </div>
      )}
      
      <svg
        viewBox="0 0 320 420"
        className="border-2 border-gray-300 rounded-lg bg-gray-50 w-full h-auto"
        style={{ maxWidth: '400px' }}
      >
        <rect x="0" y="0" width="320" height="420" fill="#f9fafb" />
        
        <text x="160" y="15" textAnchor="middle" className="text-sm font-bold fill-gray-700">
          {turno} - {fecha}
        </text>
        
        {UNIFIED_TABLES_LAYOUT.map(renderTable)}
        
        {mode === 'cupos' && (
          <g transform="translate(10, 395)">
            <rect x="0" y="0" width="8" height="8" fill="#e5e7eb" />
            <text x="12" y="7" className="text-xs fill-gray-600">Disponible</text>
            
            <rect x="70" y="0" width="8" height="8" fill="#fbbf24" />
            <text x="82" y="7" className="text-xs fill-gray-600">Bloqueada</text>
            
            <rect x="140" y="0" width="8" height="8" fill="#fca5a5" />
            <text x="152" y="7" className="text-xs fill-gray-600">Ocupada</text>
          </g>
        )}
      </svg>
      
      {mode === 'assignment' && selectedReservation && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="text-sm">
            <div className="font-medium text-green-900">
              Asignando: {selectedReservation.cliente.nombre}
            </div>
            <div className="text-green-700">
              {selectedReservation.personas} personas - {selectedReservation.horario}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMapController;