import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  UNIFIED_TABLES_LAYOUT as VERTICAL_LAYOUT, 
  HORIZONTAL_TABLES_LAYOUT as HORIZONTAL_LAYOUT, 
  LAYOUT_DIMENSIONS 
} from '../../../utils/tablesLayout';
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
  onToggleTableBlock = null, // 🆕 Función para cambiar bloqueos desde modo dinámico
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
  onAddOrderToReservedTable = null, // ✅ AGREGADO: función para agregar pedidos a mesas ocupadas
  isOperationOpen = true,
  showNotification = null,
  tableManagementMode = false, // 🆕 Nuevo prop para el modo gestión
  // ✅ Props para botones de acción en popup de pedidos
  onViewTable = null,
  onCloseTable = null,
  onApplyDiscount = null,
  onReprintTicket = null,
  onRemoveOrderItem = null,
  permissions = {}
}) => {
  const [hoveredTable, setHoveredTable] = useState(null);
  const [internalOrderPopup, setInternalOrderPopup] = useState(null);
  
  // Usar solo el modo de gestión externo (eliminado el modo interno)
  const effectiveDynamicMode = tableManagementMode;

  // Configuración de layout - FORZAR vista horizontal
  const useHorizontalLayout = true;
  const tablesLayout = useHorizontalLayout ? HORIZONTAL_LAYOUT : VERTICAL_LAYOUT;
  const dimensions = useHorizontalLayout ? LAYOUT_DIMENSIONS.horizontal : LAYOUT_DIMENSIONS.vertical;
  const viewBox = `0 0 ${dimensions.width} ${dimensions.height}`;

  // SIMPLIFICAR: usar directamente forcedTablePopup como popup activo
  const activeOrderPopup = forcedTablePopup || orderPopup || internalOrderPopup;
  
  // Popup state tracking (solo para debugging específico)
  useEffect(() => {
    // Logging removido para evitar spam en consola
    // Solo mantener para debugging crítico si es necesario
  }, [forcedTablePopup, orderPopup, internalOrderPopup]);

  // Función toggleDynamicMode eliminada - Ahora controlado externamente desde Reservas.jsx

  // 🆕 FUNCIÓN MEJORADA: Obtener estado detallado de mesa
  const getDetailedTableState = useCallback((tableId) => {
    if (!tableStates) return null;

    const state = tableStates.get(tableId);
    if (!state) return null;

    return {
      ...state,
      canModify: !['occupied', 'reserved'].includes(state.state),
      actionHint: getActionHint(state.state, state.canReceiveReservations, state.canReceiveWalkins)
    };
  }, [tableStates]);

  // 🆕 FUNCIÓN: Obtener sugerencia de acción
  const getActionHint = (currentState, canReceiveReservations, canReceiveWalkins) => {
    switch (currentState) {
      case 'available':
        return 'Click: Bloquear mesa';
      case 'available-walkin':
        return 'Click: Liberar para reservas';
      case 'blocked':
        return 'Click: Desbloquear mesa';
      case 'occupied':
        return 'Mesa ocupada - No modificable';
      case 'reserved':
        return 'Mesa reservada - No modificable';
      default:
        return 'Click para cambiar estado';
    }
  };

  // ✅ FUNCIÓN ACTUALIZADA: Obtener colores usando el servicio unificado (optimizada)
  const getTableVisualStyles = useCallback((tableId) => {
    if (tableStates) {
      // Usar el nuevo sistema unificado
      const feedback = getTableVisualFeedback(tableId, tableStates);
      const detailedState = effectiveDynamicMode ? getDetailedTableState(tableId) : null;

      // 🔍 DEBUG: Log completamente deshabilitado para evitar spam
      if (false && process.env.NODE_ENV === 'development' && effectiveDynamicMode && hoveredTable === tableId) {
        console.log(`🎨 Mesa ${tableId}: ${tableStates.get(tableId)?.state} -> ${feedback.fill}`);
      }

      // 🆕 Mejoras visuales para modo dinámico
      const isHovered = hoveredTable === tableId;
      const isDynamic = effectiveDynamicMode && detailedState?.canModify;

      return {
        fill: isHovered && isDynamic ? '#fbbf24' : feedback.fill, // Amarillo al hover en modo dinámico
        stroke: feedback.stroke,
        strokeWidth: isDynamic ? 3 : feedback.strokeWidth, // Borde más grueso en modo dinámico
        textColor: feedback.textColor,
        description: isDynamic ? detailedState?.actionHint : feedback.description,
        cursor: isDynamic ? 'pointer' : feedback.cursor || 'default',
        opacity: (!isOperationOpen && !isDynamic) ? 0.6 : 1, // Opacidad reducida si está cerrado
        textSuffix: feedback.textSuffix // 🆕 Agregado para mostrar asterisco en mesas walk-in
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
  }, [tableStates, hoveredTable, blockedTables, occupiedTables, effectiveDynamicMode, getDetailedTableState, isOperationOpen]);

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
    // Solo logear en modo dinámico para depuración
    if (effectiveDynamicMode) {
      console.log(`🖱️ Click en mesa ${tableId} (modo dinámico)`);
    }

    // Si está en modo dinámico y se puede modificar la mesa, usar función de toggle
    if (effectiveDynamicMode && onToggleTableBlock) {
      const detailedState = getDetailedTableState(tableId);
      if (detailedState?.canModify) {
        onToggleTableBlock(tableId);
        return;
      } else {
        showNotification?.(detailedState?.actionHint || 'Mesa no modificable', 'warning');
        return;
      }
    }

    // Comportamiento normal
    if (onTableClick) {
      const tableInfo = tableStates ? tableStates.get(tableId) : null;
      onTableClick(tableId, tableInfo);
    }
  }, [onTableClick, onToggleTableBlock, tableStates, effectiveDynamicMode, getDetailedTableState, showNotification]);

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
    // Cerrar el popup activo (prioridad: forcedTablePopup > orderPopup > internal)
    if (forcedTablePopup && setOrderPopup) {
      setOrderPopup(null); // setOrderPopup es realmente setForcedTablePopup
    } else if (orderPopup && setOrderPopup) {
      setOrderPopup(null);
    } else {
      setInternalOrderPopup(null);
    }
  }, [setOrderPopup, forcedTablePopup, orderPopup]);

  // ✅ NUEVA FUNCIÓN: Unificar productos de todos los pedidos
  const getUnifiedProducts = useCallback((orders) => {
    if (!orders || orders.length === 0) return [];

    const productMap = {};
    
    orders.forEach(order => {
      order.productos?.forEach(producto => {
        // Crear clave única basada en nombre y precio para agrupar productos iguales
        const key = `${producto.nombre}-${producto.precio}`;
        
        if (productMap[key]) {
          // Si ya existe, sumar cantidad y subtotal
          productMap[key].cantidad += producto.cantidad;
          productMap[key].subtotal += (producto.subtotal || producto.precio * producto.cantidad);
          productMap[key].orderIds.push(order.id);
          productMap[key].orderNumbers.push(order.orderId);
        } else {
          // Crear nueva entrada
          productMap[key] = {
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: producto.cantidad,
            subtotal: producto.subtotal || producto.precio * producto.cantidad,
            notas: producto.notas || '',
            orderIds: [order.id],
            orderNumbers: [order.orderId]
          };
        }
      });
    });

    // Convertir a array y ordenar por nombre para consistencia
    return Object.values(productMap).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, []);

  // Renderizar mesa individual (memoizado por mesa)
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
          {table.id}{getTableVisualStyles(table.id).textSuffix || ''}
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
    const startTime = performance.now();
    const result = tablesLayout.map(table => renderTable(table));
    const renderTime = performance.now() - startTime;
    
    // Solo logear si el render es lento
    if (renderTime > 10) {
      console.log(`🎨 Tables render: ${renderTime.toFixed(2)}ms para ${tablesLayout.length} mesas`);
    }
    
    return result;
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

      {/* CONTROLES DINÁMICOS ELIMINADOS - Ahora controlado desde barra de navegación de Reservas */}
      
      {/* 📊 ESTADÍSTICAS DE MESAS - Siempre mostrar */}
      {tableStates && (
        <div className={styles.tableStats}>
          <div className={styles.statItem}>
            <span className={styles.statColor} style={{backgroundColor: '#10b981'}}></span>
            <span>Disponibles: {Array.from(tableStates.values()).filter(s => s.state === 'available').length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statColor} style={{backgroundColor: '#f59e0b'}}></span>
            <span>Solo Walk-in: {Array.from(tableStates.values()).filter(s => s.state === 'available-walkin').length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statColor} style={{backgroundColor: '#2563eb'}}></span>
            <span>Ocupadas: {Array.from(tableStates.values()).filter(s => ['occupied', 'reserved'].includes(s.state)).length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statColor} style={{backgroundColor: '#dc2626'}}></span>
            <span>Bloqueadas: {Array.from(tableStates.values()).filter(s => s.state === 'blocked').length}</span>
          </div>
        </div>
      )}

      {/* Popup de pedidos */}
      {activeOrderPopup && (
        <div className={styles.popupOverlay} onClick={handleCloseOrderPopup}>
          <div
            className={styles.orderPopup}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.popupHeader}>
              <div className={styles.popupTitle}>
                <span>🍽️</span>
                Mesa {activeOrderPopup.tableId}
              </div>
              <button
                className={styles.popupCloseButton}
                onClick={handleCloseOrderPopup}
              >
                ✕
              </button>
            </div>

            <div className={styles.popupContent}>
              {/* Información de pedidos de la mesa */}
              {activeOrderPopup.orders && activeOrderPopup.orders.length > 0 ? (
                <div>
                  {/* Header compacto con resumen de pedidos */}
                  <div className={styles.tableOrdersHeader}>
                    <h3>Mesa {activeOrderPopup.tableId} - {activeOrderPopup.orders.length} {activeOrderPopup.orders.length === 1 ? 'Pedido' : 'Pedidos'}</h3>
                    <div className={styles.tableOrdersStatus}>
                      {activeOrderPopup.orders.map(order => (
                        <span
                          key={order.id}
                          className={
                            order.estado === 'cocina' ? styles.cookingStatus :
                            order.estado === 'entregado' ? styles.deliveredStatus :
                            order.estado === 'pendiente_pago' ? styles.pendingPaymentStatus :
                            styles.cookingStatus
                          }
                        >
                          #{order.orderId}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Lista unificada de productos - SIN SCROLL */}
                  <div className={styles.unifiedProductsList}>
                    <h4>📋 Productos de la Mesa</h4>
                    <div className={styles.productsList}>
                      {getUnifiedProducts(activeOrderPopup.orders).map((producto, idx) => (
                        <div key={idx} className={styles.productItem}>
                          <span className={styles.productQuantity}>{producto.cantidad}x</span>
                          <div className={styles.productInfo}>
                            <span className={styles.productName}>{producto.nombre}</span>
                            {producto.orderNumbers.length > 1 && (
                              <span className={styles.productOrders}>
                                (Pedidos: {producto.orderNumbers.join(', ')})
                              </span>
                            )}
                            {producto.notas && (
                              <span className={styles.productNotes}>{producto.notas}</span>
                            )}
                          </div>
                          <span className={styles.productPrice}>
                            ${producto.subtotal.toLocaleString('es-AR')}
                          </span>
                          {/* Botón eliminar item - solo para estados que permiten edición */}
                          {onRemoveOrderItem && permissions.canEdit && activeOrderPopup.orders.some(order => 
                            producto.orderIds.includes(order.id) && (order.estado === 'cocina' || order.estado === 'entregado')
                          ) && (
                            <button
                              className={styles.removeItemButton}
                              onClick={() => {
                                // Encontrar el primer pedido que contenga este producto
                                const targetOrder = activeOrderPopup.orders.find(order => 
                                  producto.orderIds.includes(order.id) && 
                                  (order.estado === 'cocina' || order.estado === 'entregado')
                                );
                                if (targetOrder) {
                                  const originalProduct = targetOrder.productos.find(p => 
                                    p.nombre === producto.nombre && p.precio === producto.precio
                                  );
                                  if (originalProduct) {
                                    onRemoveOrderItem(targetOrder.id, originalProduct);
                                  }
                                }
                              }}
                              title={`Eliminar ${producto.nombre}`}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total de la mesa - Más prominente */}
                  <div className={styles.tableTotal}>
                    <strong>Total Mesa: ${activeOrderPopup.orders.reduce((total, order) => 
                      total + (order.totales?.total || 0), 0).toLocaleString('es-AR')}</strong>
                  </div>

                  {/* Botones de acción - Layout profesional reorganizado */}
                  <div className={styles.popupActions}>
                    {/* Primera fila: Botones principales */}
                    <div className={styles.primaryActions}>
                      {/* Botón Agregar más pedidos */}
                      {onAddOrderToReservedTable && permissions.canEdit && activeOrderPopup.orders.some(order => 
                        order.estado === 'cocina' || order.estado === 'entregado'
                      ) && (
                        <button
                          className={styles.addOrderButton}
                          onClick={() => {
                            onAddOrderToReservedTable(activeOrderPopup.tableId);
                            handleCloseOrderPopup();
                          }}
                        >
                          {(() => {
                            const hasKitchenOrders = activeOrderPopup.orders.some(order => order.estado === 'cocina');
                            const hasDeliveredOrders = activeOrderPopup.orders.some(order => order.estado === 'entregado');
                            
                            if (hasKitchenOrders && hasDeliveredOrders) {
                              return "➕ Agregar Productos";
                            } else if (hasKitchenOrders) {
                              return "➕ Agregar al Pedido";
                            } else {
                              return "➕ Nuevo Pedido";
                            }
                          })()}
                        </button>
                      )}

                      {/* Botón Procesar Pago - prominente si hay pedidos para cobrar */}
                      {onViewTable && permissions.canProcessPayment && activeOrderPopup.orders.some(order => order.estado === 'pendiente_pago') && (
                        <button
                          className={styles.processPaymentButton}
                          onClick={() => {
                            const payableOrders = activeOrderPopup.orders.filter(order => order.estado === 'pendiente_pago');
                            onViewTable(activeOrderPopup.tableId, payableOrders);
                            handleCloseOrderPopup();
                          }}
                        >
                          💰 Cobrar Mesa
                        </button>
                      )}

                      {/* Botón Cerrar Mesa - prominente si hay pedidos entregados */}
                      {onCloseTable && permissions.canCloseTable && activeOrderPopup.orders.some(order => order.estado === 'entregado') && (
                        <button
                          className={styles.closeTableButton}
                          onClick={() => {
                            const deliveredOrders = activeOrderPopup.orders.filter(order => order.estado === 'entregado');
                            onCloseTable(activeOrderPopup.tableId, deliveredOrders);
                            handleCloseOrderPopup();
                          }}
                        >
                          🏪 Cerrar Mesa
                        </button>
                      )}
                    </div>

                    {/* Segunda fila: Botones secundarios */}
                    <div className={styles.secondaryActions}>
                      {/* Botón Reimprimir Ticket */}
                      {onReprintTicket && permissions.canReprint && activeOrderPopup.orders.length > 0 && (
                        <button
                          className={styles.reprintButton}
                          onClick={() => {
                            onReprintTicket(activeOrderPopup.tableId, activeOrderPopup.orders);
                            handleCloseOrderPopup();
                          }}
                        >
                          🖨️ Reimprimir
                        </button>
                      )}

                      {/* Botón Aplicar Descuento */}
                      {onApplyDiscount && permissions.canDiscount && activeOrderPopup.orders.some(order => order.estado === 'entregado') && (
                        <button
                          className={styles.discountButton}
                          onClick={() => {
                            const deliveredOrders = activeOrderPopup.orders.filter(order => order.estado === 'entregado');
                            onApplyDiscount(activeOrderPopup.tableId, deliveredOrders);
                            handleCloseOrderPopup();
                          }}
                        >
                          💸 Descuento
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.orderInfo}>
                  <p>No hay pedidos activos para esta mesa.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMapController;