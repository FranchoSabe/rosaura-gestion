import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ClipboardList, Plus, Clock, CheckCircle, XCircle, AlertCircle, Users, DollarSign, ChefHat, MapPin, Sun, Moon, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import {
  subscribeToOrders,
  subscribeToProducts,
  subscribeToReservations,
  updateOrder,
  updateReservation,
  addCashRegister,
  updateTableStatus
} from '../../../../firebase.js';
import OrderService from '../../../../shared/services/OrderService';
import { Modal } from '../../../../shared/components/ui/Modal';
// Importaciones de initializeData removidas - no necesarias para sistema real
import InteractiveMapController from '../../../../shared/components/InteractiveMap/InteractiveMapController';
import { useTableStates } from '../../../../shared/hooks/useTableStates';
import useTurnData from '../../../../shared/hooks/useTurnData';
import PaymentModal from './components/PaymentModal';
import ModifiersModal from './components/ModifiersSystem/ModifiersModal';
import PrintSimulator from './components/PrintSimulator';
import DiscountModal from './components/DiscountModal';
import CashRegisterModal from './components/CashRegisterModal';
import TurnPaymentsModal from './components/TurnPaymentsModal';
import styles from './Pedidos.module.css';

/**
 * Página para gestión de pedidos del restaurante
 * Permite crear, editar, seguir estado y gestionar pedidos
 */
const Pedidos = ({ 
  showNotification, 
  showConfirmation 
}) => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [systemInitialized, setSystemInitialized] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [selectedTableForPayment, setSelectedTableForPayment] = useState(null);
  
  // Estado para controlar popup de mesa desde fuera del mapa
  const [forcedTablePopup, setForcedTablePopup] = useState(null);
  
  // Estados para simulador de impresión y descuentos
  const [showPrintSimulator, setShowPrintSimulator] = useState(false);
  const [printTicketData, setPrintTicketData] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountTableData, setDiscountTableData] = useState(null);
  const [appliedDiscounts, setAppliedDiscounts] = useState(new Map());
  
  // Estados para el sistema operativo simplificado
  const [isOperationOpen, setIsOperationOpen] = useState(true);
  
  // Estados para el modal de arqueo de caja
  const [showCashRegisterModal, setShowCashRegisterModal] = useState(false);
  const [showTurnPaymentsModal, setShowTurnPaymentsModal] = useState(false);

  // Hook para manejo de datos temporales del turno
  const {
    turnData,
    addPayment,
    correctPayment,
    voidPayment,
    closeTurn,
    getActivePayments,
    hasUnsavedPayments,
    isCurrentTurn,
    totalAmount,
    paymentCount
  } = useTurnData();

  // Estados de pedido simplificados
  const orderStatuses = [
    { value: 'cocina', label: 'En Cocina', color: '#ef4444', icon: ChefHat },
    { value: 'entregado', label: 'Entregado', color: '#10b981', icon: CheckCircle },
    { value: 'pendiente_pago', label: 'Pendiente Pago', color: '#8b5cf6', icon: DollarSign }
  ];

  // Función para cierre de caja con arqueo real
  // Abrir modal de arqueo de caja
  const openCashRegisterModal = () => {
    setShowCashRegisterModal(true);
  };

  // Manejar cierre de caja - MEJORADO: reseteo garantizado
  const handleCashRegisterClose = useCallback(async (cashRegisterData) => {
    console.log('🔒 INICIANDO CIERRE DE CAJA - Datos temporales:', {
      pedidos: cashRegisterData.pedidos?.length || 0,
      total: cashRegisterData.totales?.total || 0,
      descuentos: cashRegisterData.descuentos?.totalDescuentos || 0
    });
    
    try {
      // Verificar que no hay pagos pendientes de guardar
      if (hasUnsavedPayments()) {
        throw new Error('Hay pagos pendientes de guardar en el servidor. No se puede cerrar la caja.');
      }
      
      // Usar datos temporales como fuente de verdad para el arqueo
      const arqueoCompleto = {
        ...cashRegisterData,
        datosTemporales: {
          pagosProcesados: getActivePayments(),
          totalesTurno: turnData.totalesTurno,
          contadores: turnData.contadores,
          iniciadoEn: turnData.iniciado,
          cerradoEn: new Date().toISOString()
        },
        status: 'completed',
        validado: true
      };
      
      console.log('💾 GUARDANDO ARQUEO EN FIREBASE...', {
        firebase: 'en progreso',
        timestamp: new Date().toISOString()
      });

      // Guardar arqueo completo en Firebase
      await addCashRegister(arqueoCompleto);

      console.log('✅ ARQUEO GUARDADO EXITOSAMENTE EN FIREBASE');

      // RESETEO GARANTIZADO: Ejecutar todas las limpiezas
      console.log('🧹 EJECUTANDO RESETEO COMPLETO...');

      // 1. Limpiar datos temporales del turno (CRÍTICO)
      closeTurn();
      console.log('✅ Datos temporales del turno limpiados');
      
      // 2. Limpiar descuentos aplicados
      setAppliedDiscounts(new Map());
      console.log('✅ Descuentos aplicados limpiados');
      
      // 3. Cerrar operación temporalmente
      setIsOperationOpen(false);
      console.log('✅ Operación cerrada temporalmente');
      
      // 4. Notificar éxito
      const totalFormateado = (cashRegisterData.totales?.total || 0).toLocaleString('es-AR');
      showNotification(
        `🎉 Caja cerrada exitosamente - $${totalFormateado} procesados`,
        'success'
      );
      
      // 5. Auto-reabrir después de 3 segundos
      console.log('⏰ Programando reapertura en 3 segundos...');
      setTimeout(() => {
        setIsOperationOpen(true);
        showNotification('🔄 Sistema reiniciado para próximo turno', 'info');
        console.log('🚀 SISTEMA REINICIADO - Listo para próximo turno');
      }, 3000);
      
      console.log('🎊 CIERRE DE CAJA COMPLETADO EXITOSAMENTE');
      
    } catch (error) {
      console.error('❌ ERROR CRÍTICO AL CERRAR CAJA:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Mostrar error detallado al usuario
      const errorMessage = error.message || 'Error desconocido al cerrar la caja';
      showNotification(`❌ Error al cerrar caja: ${errorMessage}. Intenta nuevamente.`, 'error');
      
      // Re-lanzar error para que el modal no se cierre automáticamente
      throw error;
    }
  }, [hasUnsavedPayments, getActivePayments, turnData, closeTurn, showNotification]);

  // Función para reabrir operación
  const reopenOperation = () => {
    setIsOperationOpen(true);
    showNotification('Operación reabierta', 'success');
  };

  // Manejar corrección de pagos temporales
  const handleCorrectPayment = useCallback((pagoId, nuevosData) => {
    try {
      correctPayment(pagoId, nuevosData);
      console.log('✏️ Pago corregido en datos temporales:', { pagoId, nuevosData });
    } catch (error) {
      console.error('❌ Error al corregir pago:', error);
      showNotification('Error al corregir el pago', 'error');
    }
  }, [correctPayment, showNotification]);

  // Manejar anulación de pagos temporales
  const handleVoidPayment = useCallback((pagoId, razon) => {
    try {
      voidPayment(pagoId, razon);
      console.log('❌ Pago anulado en datos temporales:', { pagoId, razon });
    } catch (error) {
      console.error('❌ Error al anular pago:', error);
      showNotification('Error al anular el pago', 'error');
    }
  }, [voidPayment, showNotification]);

  // Abrir modal de revisión de pagos del turno
  const openTurnPaymentsModal = useCallback(() => {
    setShowTurnPaymentsModal(true);
  }, []);

  // Usar hook unificado para estados de mesa (sin modo testing)
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Memoizar dependencias para evitar recálculos innecesarios
  const emptyBlockedTables = useMemo(() => new Set(), []); // Set vacío memoizado
  
  // Memoizar filtros por mesa para performance
  const ordersByTable = useMemo(() => {
    const tableMap = new Map();
    orders.forEach(order => {
      const mesa = parseInt(order.mesa);
      if (!tableMap.has(mesa)) {
        tableMap.set(mesa, []);
      }
      tableMap.get(mesa).push(order);
    });
    return tableMap;
  }, [orders]);
  
  // Hook para estados de mesa unificados
  const { tableStates, occupiedTables, findOccupantByTable, isTableOccupied, getTableState, mapData } = useTableStates(
    reservations, 
    orders, 
    emptyBlockedTables, // Memoizado para evitar recreación
    todayDate, 
    'pedidos' // Usar turno especial para sistema de pedidos
  );

  // Función para mostrar popup de mesa (simula click en mesa ocupada)
  const showTablePopup = useCallback((tableId) => {
    // Encuentra todos los pedidos activos para esta mesa (optimizado)
    const allTableOrders = ordersByTable.get(parseInt(tableId)) || [];
    const tableOrders = allTableOrders.filter(order => 
      order.estado === 'cocina' || order.estado === 'entregado' || order.estado === 'pendiente_pago'
    );

    if (tableOrders.length === 0) {
      showNotification('No hay pedidos activos para esta mesa', 'info');
      return;
    }

    // Forzar mostrar popup mediante estado
    setForcedTablePopup({
      tableId: parseInt(tableId),
      orders: tableOrders,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 } // Centro de pantalla
    });
    
    // Popup mostrado correctamente
  }, [ordersByTable, showNotification]);

  // Manejar click en mesa del mapa
  const handleTableClick = useCallback((tableId, tableData) => {
    // Verificar si la operación está abierta
    if (!isOperationOpen) {
      showNotification('La operación está cerrada. No se pueden crear nuevos pedidos.', 'warning');
      return;
    }
    
    // Buscar pedidos activos para esta mesa (optimizado con memoización)
    const tableOrders = ordersByTable.get(parseInt(tableId)) || [];
    const activeOrdersForTable = tableOrders.filter(order => 
      order.estado === 'cocina' || order.estado === 'entregado' || order.estado === 'pendiente_pago'
    );
    
    const tableOccupant = findOccupantByTable(tableId);
    const tableState = getTableState(tableId);
    const isOccupied = isTableOccupied(tableId) || activeOrdersForTable.length > 0; // Incluir check de pedidos activos
    
    // Solo logear en caso de debugging específico
    if (process.env.NODE_ENV === 'development' && activeOrdersForTable.length === 0 && !isOccupied) {
      console.log(`🆕 Mesa ${tableId} libre - abriendo modal de pedido`);
    }
    
    if (!isOccupied && activeOrdersForTable.length === 0) {
      // Mesa libre - abrir modal de pedido directamente
      setSelectedTable(tableId);
      setEditingOrder(null);
      setShowOrderModal(true);
    } else {
      // Mesa ocupada o con pedidos - mostrar popup automáticamente
      if (activeOrdersForTable.length > 0) {
        // Si hay pedidos activos, mostrar popup con esos datos
        showTablePopup(tableId);
      } else {
        // Si no hay pedidos pero está ocupada por reserva, el InteractiveMapController manejará su popup
        // Operación silenciosa - reserva maneja su propio popup
      }
    }
  }, [findOccupantByTable, isTableOccupied, isOperationOpen, showNotification, ordersByTable, showTablePopup]);

  // Manejar "Agregar Pedido" desde popup de reserva
  const handleAddOrderToReservedTable = useCallback((tableId) => {
    // Verificar si la operación está abierta
    if (!isOperationOpen) {
      showNotification('La operación está cerrada. No se pueden crear nuevos pedidos.', 'warning');
      return;
    }
    
    // Abrir modal de pedido con mesa pre-seleccionada (forzar apertura)
    setSelectedTable(tableId);
    setEditingOrder(null);
    setShowOrderModal(true);
  }, [isOperationOpen, showNotification]);

  // Manejar "Ver Mesa" desde OrderModal - ahora muestra popup en lugar de PaymentModal
  const handleViewTable = useCallback((tableId, existingOrder) => {
    // En lugar de abrir PaymentModal directamente, mostramos el popup de mesa
    showTablePopup(tableId);
  }, [showTablePopup]);

  // Manejar "Cobrar Mesa" (método de pago) - ESTE sí abre PaymentModal
  const handleViewTableForPayment = useCallback((tableId, deliveredOrders) => {
    setSelectedTableForPayment(tableId);
    setSelectedOrderForPayment(deliveredOrders); // Array de pedidos entregados
    setShowPaymentModal(true);
  }, []);

  // Manejar cierre de mesa - CAMBIA ESTADO Y MUESTRA SIMULADOR DE IMPRESIÓN
  const handleCloseTable = useCallback(async (tableId, deliveredOrders) => {
    try {
      console.log('🏪 CERRAR MESA:', tableId, 'Pedidos entregados:', deliveredOrders.length);
      
      // Obtener descuento aplicado si existe
      const appliedDiscount = appliedDiscounts.get(tableId);
      
      // Calcular total de la mesa
      let totalOriginal = deliveredOrders.reduce((sum, order) => sum + (order.totales?.total || 0), 0);
      let totalFinal = totalOriginal;
      
      // Aplicar descuento si existe
      if (appliedDiscount) {
        totalFinal = appliedDiscount.finalTotal;
      }
      
      // Consolidar productos de todos los pedidos
      const allProducts = {};
      deliveredOrders.forEach(order => {
        order.productos?.forEach(product => {
          const key = `${product.nombre}-${product.precio}`;
          if (allProducts[key]) {
            allProducts[key].cantidad += product.cantidad;
            allProducts[key].subtotal += product.subtotal || (product.cantidad * product.precio);
          } else {
            allProducts[key] = {
              nombre: product.nombre,
              cantidad: product.cantidad,
              precio: product.precio,
              subtotal: product.subtotal || (product.cantidad * product.precio)
            };
          }
        });
      });
      
      // Datos del ticket de control (con descuento si se aplicó)
      const ticketData = {
        mesa: tableId,
        pedidos: deliveredOrders.map(o => ({
          id: o.orderId,
          productos: o.productos,
          total: o.totales?.total || 0
        })),
        productosConsolidados: Object.values(allProducts),
        subtotal: totalOriginal,
        descuento: appliedDiscount ? {
          porcentaje: appliedDiscount.percentage,
          monto: appliedDiscount.amount,
          razon: appliedDiscount.reason
        } : null,
        total: totalFinal,
        fecha: new Date(),
        tipo: appliedDiscount ? 'control_con_descuento' : 'control',
        empleado: 'admin' // TODO: obtener del contexto
      };
      
      // CAMBIAR ESTADOS DE PEDIDOS A 'pendiente_pago'
      for (const order of deliveredOrders) {
        await OrderService.changeOrderStatus(order.id, 'pendiente_pago');
      }
      
      // Mostrar simulador de impresión
      setPrintTicketData(ticketData);
      setShowPrintSimulator(true);
      
    } catch (error) {
      console.error('❌ Error al cerrar mesa:', error);
      showNotification('Error al cerrar mesa', 'error');
    }
  }, [appliedDiscounts, showNotification]);

  // Abrir modal de descuento - NUEVO FLUJO
  const handleApplyDiscount = useCallback((tableId, deliveredOrders) => {
    console.log('💸 Abriendo modal de descuento para Mesa:', tableId);
    setDiscountTableData({ tableId, deliveredOrders });
    setShowDiscountModal(true);
  }, []);

  // Aplicar descuento y cerrar mesa (imprimir ticket) - NUEVO FLUJO
  const handleDiscountConfirm = useCallback(async (discountData) => {
    try {
      const tableId = discountTableData.tableId;
      const deliveredOrders = discountTableData.deliveredOrders;
      console.log('💸 APLICANDO DESCUENTO Y CERRANDO Mesa:', tableId, discountData);
      
      // Guardar descuento aplicado para esta mesa
      setAppliedDiscounts(prev => {
        const newMap = new Map(prev);
        newMap.set(tableId, discountData);
        return newMap;
      });
      
      // Preparar datos del ticket con descuento aplicado
      const ticketData = {
        mesa: tableId,
        pedidos: deliveredOrders || [],
        descuento: discountData,
        total: discountData.finalTotal || 0, // Validar que el total sea un número
        fechaImpresion: new Date(),
        tipo: 'control_con_descuento'
      };
      
      // Actualizar estado de pedidos a "pendiente_pago" con descuento aplicado - USANDO Promise.all
      console.log('📝 Actualizando pedidos con descuento...');
      const descuentoPorPedido = deliveredOrders.length > 0 ? (discountData.amount || 0) / deliveredOrders.length : 0;
      const totalPorPedido = deliveredOrders.length > 0 ? (discountData.finalTotal || 0) / deliveredOrders.length : 0;
      
      await Promise.all(
        deliveredOrders.map(order =>
          OrderService.changeOrderStatus(order.id, 'pendiente_pago', {
            descuentoAplicado: descuentoPorPedido,
            razonDescuento: discountData.reason || '',
            totalConDescuento: totalPorPedido
          })
        )
      );
      console.log('✅ Pedidos actualizados correctamente');
      
      // Abrir simulador de impresión
      setPrintTicketData(ticketData);
      setShowPrintSimulator(true);
      
      showNotification(`Descuento aplicado y mesa cerrada: ${discountData.reason}`, 'success');
      
      // Cerrar modal de descuento
      setShowDiscountModal(false);
      setDiscountTableData(null);
      
    } catch (error) {
      console.error('❌ Error al aplicar descuento y cerrar mesa:', error);
      showNotification('Error al aplicar descuento', 'error');
    }
  }, [discountTableData, showNotification]);

   // Manejar confirmación de impresión
   const handlePrintConfirm = useCallback(() => {
     try {
       const tableId = printTicketData.mesa;
       console.log('🖨️ CONFIRMANDO IMPRESIÓN Mesa:', tableId);
       
       showNotification(`Mesa ${tableId} cerrada - Lista para cobrar`, 'success');
       
       // Cerrar simulador
       setShowPrintSimulator(false);
       setPrintTicketData(null);
       
     } catch (error) {
       console.error('❌ Error al confirmar impresión:', error);
       showNotification('Error al confirmar impresión', 'error');
     }
   }, [printTicketData, showNotification]);

  // Manejar reimpresión de ticket
  const handleReprintTicket = useCallback((ticketData) => {
    try {
      console.log('🖨️ REIMPRIMIENDO TICKET Mesa:', ticketData.mesa);
      
      // Abrir simulador de impresión con datos del ticket
      setPrintTicketData(ticketData);
      setShowPrintSimulator(true);
      
    } catch (error) {
      console.error('❌ Error al reimprimir ticket:', error);
      showNotification('Error al reimprimir ticket', 'error');
    }
  }, [showNotification]);

  // Manejar eliminación de item de pedido
  const handleRemoveOrderItem = useCallback(async (tableId, orderId, productIndex, productData) => {
    try {
      console.log('🗑️ ELIMINANDO ITEM:', productData.nombre, 'del pedido:', orderId);
      
      // Buscar el pedido en el estado actual
      const orderToUpdate = orders.find(order => order.id === orderId);
      if (!orderToUpdate) {
        throw new Error('Pedido no encontrado');
      }

      // Crear nueva lista de productos sin el item eliminado
      const updatedProducts = [...orderToUpdate.productos];
      const productToRemove = updatedProducts[productIndex];
      
      if (!productToRemove) {
        throw new Error('Producto no encontrado en el pedido');
      }

      // Si hay más de 1 cantidad, reducir la cantidad
      if (productToRemove.cantidad > 1) {
        updatedProducts[productIndex] = {
          ...productToRemove,
          cantidad: productToRemove.cantidad - 1,
          subtotal: productToRemove.precio * (productToRemove.cantidad - 1)
        };
      } else {
        // Si solo hay 1, eliminar el producto completamente
        updatedProducts.splice(productIndex, 1);
      }

      // Recalcular totales
      const newSubtotal = updatedProducts.reduce((sum, product) => sum + (product.subtotal || 0), 0);
      
      // Crear pedido actualizado
      const updatedOrder = {
        ...orderToUpdate,
        productos: updatedProducts,
        totales: {
          subtotal: newSubtotal,
          total: newSubtotal
        },
        fechaActualizacion: new Date()
      };

      // Si no quedan productos, cambiar estado a cancelado
      if (updatedProducts.length === 0) {
        const shouldCancel = window.confirm(
          'No quedan productos en el pedido. ¿Desea cancelar el pedido completo?'
        );
        
        if (shouldCancel) {
          await OrderService.changeOrderStatus(orderId, 'cancelado');
          showNotification(`Pedido ${orderToUpdate.orderId} cancelado`, 'warning');
          return;
        } else {
          // No hacer nada si el usuario no quiere cancelar
          return;
        }
      }

      // Actualizar el pedido en Firebase
      await updateOrder(orderId, updatedOrder);
      
      showNotification(
        `${productData.nombre} eliminado del pedido ${orderToUpdate.orderId}`, 
        'success'
      );
      
    } catch (error) {
      console.error('❌ Error al eliminar item:', error);
      showNotification('Error al eliminar producto del pedido', 'error');
    }
  }, [orders, showNotification]);

  // Configuración de permisos (preparado para sistema futuro)
  const userPermissions = useMemo(() => ({
    canEdit: true,           // Puede editar pedidos (agregar/eliminar items)
    canDelete: true,         // Puede eliminar pedidos completos
    canReprint: true,        // Puede reimprimir tickets
    canDiscount: true,       // Puede aplicar descuentos
    canCloseTable: true,     // Puede cerrar mesas
    canProcessPayment: true, // Puede procesar pagos
    canViewReports: true,    // Puede ver reportes (futuro)
    canManageMenu: true      // Puede gestionar menú (futuro)
  }), []); // En el futuro esto dependería del usuario logueado

  // Manejar procesamiento de pago (cobrar) - SISTEMA DUAL: Firebase + Temporal
  const handlePaymentComplete = useCallback(async (paymentData) => {
    try {
      await OrderService.processPayment(paymentData, { reservations });

      addPayment({
        mesa: paymentData.tableId,
        metodoPago: paymentData.paymentMethod,
        total: paymentData.total,
        montoRecibido: paymentData.receivedAmount,
        cambio: paymentData.change,
        descuentoAplicado: paymentData.discount,
        razonDescuento: paymentData.discountReason,
        orderIds: paymentData.orderIds,
        empleado: paymentData.employee,
        guardadoFirebase: false
      });

      showNotification(
        `Pago procesado y guardado en caja temporal - Mesa ${paymentData.tableId} - $${paymentData.total.toLocaleString('es-AR')}`,
        'success'
      );
      
      // Limpiar descuento aplicado para esta mesa
      setAppliedDiscounts(prev => {
        const newMap = new Map(prev);
        newMap.delete(paymentData.tableId);
        return newMap;
      });
      
      // Cerrar modal
      setShowPaymentModal(false);
      setSelectedOrderForPayment(null);
      setSelectedTableForPayment(null);
      
    } catch (error) {
      console.error('❌ Error al procesar pago:', error);
      showNotification('Error al procesar pago', 'error');
    }
  }, [showNotification, reservations, addPayment]);

  // Sistema siempre inicializado para operación real
  useEffect(() => {
    setSystemInitialized(true);
  }, []);

  // Suscripciones
  useEffect(() => {
    const unsubscribeOrders = subscribeToOrders(
      (ordersData) => {
        const startTime = performance.now();
        
        // Solo logear cambios significativos en cantidad de pedidos
        const cocinaPedidos = ordersData.filter(o => o.estado === 'cocina').length;
        const lastCount = window.lastOrdersCount || 0;
        
        if (Math.abs(cocinaPedidos - lastCount) > 0 || ordersData.length !== (window.lastTotalOrders || 0)) {
          const processingTime = performance.now() - startTime;
          console.log(`📥 Orders actualizado: ${processingTime.toFixed(2)}ms | Total: ${ordersData.length} | Cocina: ${cocinaPedidos} (${cocinaPedidos - lastCount >= 0 ? '+' : ''}${cocinaPedidos - lastCount})`);
          window.lastOrdersCount = cocinaPedidos;
          window.lastTotalOrders = ordersData.length;
        }
        
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar pedidos:', error);
        showNotification('Error al cargar pedidos', 'error');
        setLoading(false);
      }
    );

    const unsubscribeProducts = subscribeToProducts(
      (productsData) => {
        setProducts(productsData.filter(p => p.disponible));
      },
      (error) => {
        console.error('Error al cargar productos:', error);
      }
    );

    // subscribeToTableStatuses removido - no necesario con sistema unificado

    const unsubscribeReservations = subscribeToReservations(
      (reservationsData) => {
        setReservations(reservationsData);
      },
      (error) => {
        console.error('Error al cargar reservas:', error);
      }
    );

    return () => {
      unsubscribeOrders && unsubscribeOrders();
      unsubscribeProducts && unsubscribeProducts();
      unsubscribeReservations && unsubscribeReservations();
    };
  }, [showNotification]);

  // Filtrar pedidos - Solo mostrar pedidos en cocina (pendientes de preparar)
  const filteredOrders = useMemo(() => {
    const startTime = performance.now();
    
    const uniqueOrders = new Map();
    
    const result = orders.filter(order => {
      // Solo mostrar pedidos en estado "cocina" (los que están siendo preparados)
      if (order.estado !== 'cocina') return false;
      
      // Prevenir duplicación usando Map con ID único
      if (uniqueOrders.has(order.id)) {
        console.log('⚠️ Pedido duplicado encontrado y filtrado:', order.id, order.orderId);
        return false;
      }
      uniqueOrders.set(order.id, true);
      
      // Manejo robusto de fechas - soportar tanto Firebase Timestamp como Date
      let orderDate;
      try {
        if (order.fechaCreacion?.seconds) {
          // Firebase Timestamp
          orderDate = new Date(order.fechaCreacion.seconds * 1000);
        } else if (order.fechaCreacion?.toDate) {
          // Firebase Timestamp con método toDate
          orderDate = order.fechaCreacion.toDate();
        } else if (order.fechaCreacion instanceof Date) {
          // Date normal
          orderDate = order.fechaCreacion;
        } else if (typeof order.fechaCreacion === 'string') {
          // String de fecha
          orderDate = new Date(order.fechaCreacion);
        } else {
          console.warn('Formato de fecha no reconocido:', order.fechaCreacion);
          return true; // Mostrar el pedido si no podemos determinar la fecha
        }
        
        const now = new Date();
        const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
        
        // Solo excluir si tiene más de 1 día
        if (daysDiff > 1) {
          console.log('🗑️ Pedido excluido por antigüedad:', order.orderId, 'días:', daysDiff);
          return false;
        }
        
      } catch (error) {
        console.error('Error procesando fecha del pedido:', order.orderId, error);
        return true; // En caso de error, mostrar el pedido
      }
      
      return true;
    });
    
    // Log de performance: solo si es lento o si hay cambios significativos
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    const cocinaPedidos = result.length;
    
    if (executionTime > 5 || cocinaPedidos !== (window.lastKitchenOrdersCount || 0)) {
      console.log(`⚡ filteredOrders: ${executionTime.toFixed(2)}ms | Total: ${orders.length} → Cocina: ${cocinaPedidos}`);
      window.lastKitchenOrdersCount = cocinaPedidos;
    }
    
    return result;
  }, [orders]);

  // Estadísticas rápidas (solo pedidos activos)
  const getOrderStats = () => {
    const activeOrders = orders.filter(order => {
      if (order.estado === 'cerrado') return false;
      const orderDate = order.fechaCreacion?.toDate ? order.fechaCreacion.toDate() : new Date(order.fechaCreacion);
      const now = new Date();
      const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 1;
    });
    
    const stats = {
      total: activeOrders.length,
      pendientes: activeOrders.filter(o => o.estado === 'pendiente').length,
      cocina: activeOrders.filter(o => o.estado === 'cocina').length,
      listos: activeOrders.filter(o => o.estado === 'listo').length,
      entregados: activeOrders.filter(o => o.estado === 'entregado').length,
      pendientePago: activeOrders.filter(o => o.estado === 'pendiente_pago').length,
      totalVentas: activeOrders.reduce((sum, o) => sum + (o.totales?.total || 0), 0)
    };
    return stats;
  };

  // Manejar cambio de estado automatizado
  const handleStatusChange = async (orderId, newStatus, context = {}) => {
    try {
      await OrderService.changeOrderStatus(orderId, newStatus);

      // Automatización de estados siguientes
      if (context.autoProgress) {
        setTimeout(async () => {
          try {
            switch (newStatus) {
              case 'cocina':
                // Mostrar notificación de que se envió a cocina
                showNotification('✅ Pedido enviado a cocina', 'success');
                break;
              case 'listo':
                // Notificar que el pedido está listo
                showNotification('🔔 Pedido listo para servir', 'info');
                break;
              case 'entregado':
                console.log('🎯 Pedido entregado, programando cambio automático a pendiente_pago en 5 min');
                // Automáticamente pasar a pendiente_pago después de 5 minutos
                setTimeout(async () => {
                  try {
                    await OrderService.changeOrderStatus(orderId, 'pendiente_pago');
                    showNotification('💰 Mesa lista para cobrar', 'warning');
                  } catch (error) {
                    console.error('Error al actualizar estado automático:', error);
                  }
                }, 5 * 60 * 1000); // 5 minutos
                break;
            }
          } catch (error) {
            console.error('Error en automatización:', error);
          }
        }, 100);
      }
      
      // Notificación eliminada - demasiado frecuente
      // showNotification('Estado actualizado exitosamente', 'success');
      
      // Si el pedido se cierra, liberar la mesa
      if (newStatus === 'cerrado') {
        const order = orders.find(o => o.id === orderId);
        if (order?.mesa) {
          await updateTableStatus(order.mesa, 'libre');
        }
      }
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      showNotification('Error al actualizar estado', 'error');
    }
  };

  // Abrir modal para nuevo pedido (mantener para compatibilidad)
  const handleNewOrder = (tableNumber = null) => {
    setSelectedTable(tableNumber);
    setEditingOrder(null);
    setShowOrderModal(true);
  };

  // Manejar creación de pedido
  const handleCreateOrder = async (orderData) => {
    try {
      await OrderService.createOrder(orderData);

      setShowOrderModal(false);
      setSelectedTable(null);
      setEditingOrder(null);

      showNotification('✅ Pedido enviado a cocina', 'success');

      setTimeout(() => {
        console.log('🔄 Mostrando popup automático para mesa:', orderData.mesa);
        showTablePopup(orderData.mesa);
      }, 500);

    } catch (error) {
      console.error('Error al crear pedido:', error);
      showNotification('Error al crear pedido: ' + error.message, 'error');
    }
  };

  // Manejar inicialización del sistema
  const handleInitializeSystem = async () => {
    setIsInitializing(true);
    try {
      const success = await initializeSystemData();
      if (success) {
        showNotification('Sistema inicializado exitosamente con datos de ejemplo', 'success');
        setSystemInitialized(true);
      } else {
        showNotification('Error al inicializar el sistema', 'error');
      }
    } catch (error) {
      console.error('Error al inicializar:', error);
      showNotification('Error al inicializar el sistema', 'error');
    } finally {
      setIsInitializing(false);
    }
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div className={styles.pedidosPage}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <ClipboardList className={styles.titleIcon} />
            <div>
              <h1 className={styles.title}>Gestión de Pedidos</h1>
              <p className={styles.subtitle}>
                {isOperationOpen 
                  ? 'Operación Abierta - Sistema siempre disponible'
                  : 'Operación Cerrada - Solo visualización'
                }
              </p>
            </div>
          </div>
          
          {/* Controles de operación */}
          <div className={styles.operationControls}>
            {/* Solo botón de arqueo de caja */}
            <button
              onClick={openCashRegisterModal}
              className={styles.cashCountButton}
              title="Realizar arqueo de caja"
            >
              <DollarSign size={20} />
              💰 Arqueo de Caja
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={styles.mainContent}>
        {/* Mapa de Mesas - Lado Izquierdo */}
        <div className={styles.mapSection}>
          <InteractiveMapController
            fecha={todayDate}
            turno={'pedidos'}
            reservas={mapData.reservations}
            orders={mapData.orders}
            tableStates={tableStates}
            mode="view"
            tableAssignments={mapData.tableAssignments}
            blockedTables={new Set()}
            onTableClick={isOperationOpen ? handleTableClick : null}
            onAddOrderToReservedTable={isOperationOpen ? handleAddOrderToReservedTable : null}
            selectedReservation={null}
            showNotification={showNotification}
            className="w-full h-auto"
            onViewTable={handleViewTableForPayment}
            onCloseTable={handleCloseTable}
            onApplyDiscount={handleApplyDiscount}
            appliedDiscounts={appliedDiscounts} // Pasar descuentos aplicados
            disabled={!isOperationOpen}
            useHorizontalLayout={true}
            forcedTablePopup={forcedTablePopup}
            setOrderPopup={setForcedTablePopup}
            onReprintTicket={handleReprintTicket}
            onRemoveOrderItem={handleRemoveOrderItem}
            permissions={userPermissions}
          />
          
          <div className={styles.mapLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendColor} style={{ backgroundColor: '#ffffff', border: '2px solid #0c4900' }}></span>
              <span>Mesa libre</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendColor} style={{ backgroundColor: '#ffffff', border: '2px solid #2563eb' }}></span>
              <span>Mesa con reserva</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendColor} style={{ backgroundColor: '#2563eb', border: '2px solid #2563eb' }}></span>
              <span>Mesa con pedido</span>
            </div>

          </div>
        </div>

        {/* Lista de Pedidos - Lado Derecho */}
        <div className={styles.ordersSection}>
          <div className={styles.sectionHeader}>
            <h2>Pedidos en Cocina ({filteredOrders.length})</h2>
            <div className={styles.kitchenInfo}>
              <ChefHat size={20} />
              <span>Lista de pedidos listos para preparar</span>
            </div>
          </div>

          {/* Lista de pedidos */}
          <div className={styles.ordersList}>
            {filteredOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <ChefHat size={48} className={styles.emptyIcon} />
                <h4>No hay pedidos en cocina</h4>
                <p>
                  Los pedidos aparecerán aquí cuando se envíen a cocina para preparar
                </p>
              </div>
            ) : (
              <div className={styles.kitchenOrdersList}>
                {filteredOrders.map(order => (
                  <KitchenOrderCard 
                    key={order.id} 
                    order={order}
                    onMarkAsDelivered={handleStatusChange}
                    showNotification={showNotification}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de pedido */}
      {showOrderModal && (
        <OrderModal
          products={products}
          selectedTable={selectedTable}
          order={editingOrder}
          onSave={handleCreateOrder}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedTable(null);
            setEditingOrder(null);
          }}
          onViewTable={handleViewTable}
          existingOrder={selectedTable ? orders.find(o => o.mesa === selectedTable && o.estado !== 'cerrado') : null}
          disabled={!isOperationOpen}
          operationStatus={{
            isOpen: isOperationOpen,
            mode: 'normal'
          }}
        />
      )}

      {/* Modal de pago */}
      {showPaymentModal && selectedOrderForPayment && (
        <PaymentModal
          order={selectedOrderForPayment}
          tableId={selectedTableForPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrderForPayment(null);
            setSelectedTableForPayment(null);
          }}
          onPaymentComplete={handlePaymentComplete}
          showNotification={showNotification}
          appliedDiscount={appliedDiscounts.get(selectedTableForPayment)}
        />
      )}

      {/* Simulador de impresión */}
      {showPrintSimulator && printTicketData && (
        <PrintSimulator
          isOpen={showPrintSimulator}
          ticketData={printTicketData}
          onClose={() => {
            setShowPrintSimulator(false);
            setPrintTicketData(null);
          }}
          onConfirmPrint={handlePrintConfirm}
        />
      )}

      {/* Modal de descuento */}
      {showDiscountModal && discountTableData && (
        <DiscountModal
          isOpen={showDiscountModal}
          tableId={discountTableData.tableId}
          deliveredOrders={discountTableData.deliveredOrders}
          onClose={() => {
            setShowDiscountModal(false);
            setDiscountTableData(null);
          }}
          onApplyDiscount={handleDiscountConfirm}
        />
      )}

      {/* Modal de arqueo de caja - NUEVO: usa datos temporales */}
      {showCashRegisterModal && (
        <CashRegisterModal
          isOpen={showCashRegisterModal}
          turnData={turnData}
          hasUnsavedPayments={hasUnsavedPayments()}
          onClose={() => setShowCashRegisterModal(false)}
          onCashRegisterClose={handleCashRegisterClose}
          onOpenPaymentsReview={openTurnPaymentsModal}
          showNotification={showNotification}
        />
      )}

      {/* Modal de revisión de pagos del turno */}
      {showTurnPaymentsModal && (
        <TurnPaymentsModal
          isOpen={showTurnPaymentsModal}
          turnData={turnData}
          onClose={() => setShowTurnPaymentsModal(false)}
          onCorrectPayment={handleCorrectPayment}
          onVoidPayment={handleVoidPayment}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

/**
 * Componente compacto para pedidos en cocina
 */
const KitchenOrderCard = ({ order, onMarkAsDelivered, showNotification }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState('');
  
  const formatTime = (date) => {
    return new Date(date.seconds * 1000).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular tiempo transcurrido desde que se envió a cocina
  const calculateTimeElapsed = useCallback(() => {
    if (!order.fechaCreacion) return '';
    
    const createdTime = order.fechaCreacion.seconds ? 
      new Date(order.fechaCreacion.seconds * 1000) : 
      new Date(order.fechaCreacion);
    
    const now = new Date();
    const diffMs = now - createdTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Recién enviado';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    
    if (diffHours < 24) {
      return remainingMinutes > 0 ? `${diffHours}h ${remainingMinutes}m` : `${diffHours}h`;
    }
    
    return formatTime(order.fechaCreacion);
  }, [order.fechaCreacion]);

  // Actualizar timer cada minuto (optimizado)
  useEffect(() => {
    const updateTimer = () => {
      const newTime = calculateTimeElapsed();
      // Solo actualizar si realmente cambió para evitar re-renders innecesarios
      setTimeElapsed(prev => prev !== newTime ? newTime : prev);
    };
    
    updateTimer(); // Actualizar inmediatamente
    const interval = setInterval(updateTimer, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, [calculateTimeElapsed]);

  const handleMarkAsDelivered = async () => {
    try {
      console.log('🍽️ INICIO - Marcando pedido como entregado:', order.orderId, 'Mesa:', order.mesa, 'ID:', order.id);
      console.log('📋 Estado actual antes del cambio:', order.estado);
      
      await onMarkAsDelivered(order.id, 'entregado', { autoProgress: true });
      
      console.log('✅ FUNCIÓN COMPLETADA - Pedido marcado como entregado:', order.orderId);
      showNotification(`Mesa ${order.mesa} - Pedido entregado`, 'success');
    } catch (error) {
      console.error('❌ ERROR COMPLETO al marcar como entregado:', error);
      showNotification('Error al marcar como entregado', 'error');
    }
  };

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.kitchenOrderCard}>
      {/* Header principal - Mesa prominente y botón entregado */}
      <div className={styles.kitchenOrderMainHeader}>
        <div className={styles.kitchenOrderTablePrimary}>
          <h3 className={styles.kitchenOrderMesaText}>
            Mesa {order.mesa || 'N/A'}
          </h3>
          <button
            onClick={handleMarkAsDelivered}
            className={styles.deliveredButton}
            title="Marcar como entregado"
          >
            <CheckCircle size={18} />
            Entregado
          </button>
        </div>
        
        {/* Segunda línea - Timer y detalles */}
        <div className={styles.kitchenOrderSecondaryInfo}>
          <div className={styles.kitchenOrderTimer}>
            <Clock size={16} />
            <span className={styles.timerText}>{timeElapsed}</span>
          </div>
          <div className={styles.kitchenOrderDetails}>
            <span className={styles.itemCount}>
              {order.productos?.length || 0} productos
            </span>
            <span className={styles.orderIdSecondary}>#{order.orderId}</span>
          </div>
          <button
            onClick={toggleExpansion}
            className={styles.expandButton}
            title={isExpanded ? "Contraer" : "Ver detalles"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Detalles expandibles */}
      {isExpanded && (
        <div className={styles.kitchenOrderDetails}>
          <div className={styles.kitchenOrderProducts}>
            {order.productos?.map((producto, index) => (
              <div key={index} className={styles.kitchenProductItem}>
                <span className={styles.productQuantity}>{producto.cantidad}x</span>
                <span className={styles.productName}>{producto.nombre}</span>
              </div>
            ))}
          </div>

          {order.notas && (
            <div className={styles.kitchenOrderNotes}>
              <strong>Notas:</strong> {order.notas}
            </div>
          )}
          
          <div className={styles.kitchenOrderTotal}>
            Total: ${order.totales?.total?.toLocaleString('es-AR') || 0}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Modal para crear/editar pedidos - Optimizado para tablets y pantallas táctiles
 */
const OrderModal = ({ products, selectedTable, order, onSave, onClose, onViewTable, existingOrder }) => {
  const [formData, setFormData] = useState({
    mesa: selectedTable || order?.mesa || '',
    productos: order?.productos || []
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState({});
  const [modifiedProducts, setModifiedProducts] = useState({});
  const [itemNotes, setItemNotes] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState(null);
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedProductForModifiers, setSelectedProductForModifiers] = useState(null);

  // Categorías de productos
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach(product => {
      if (product.categoria) {
        cats.add(product.categoria);
      }
    });
    return [{ id: 'all', name: 'Todos' }, ...Array.from(cats).map(cat => ({ id: cat, name: cat }))];
  }, [products]);

  // Filtrar productos por categoría
  const filteredProducts = useMemo(() => {
    return selectedCategory === 'all' 
      ? products 
      : products.filter(p => p.categoria === selectedCategory);
  }, [products, selectedCategory]);

  // Agregar producto al carrito
  const addToCart = (product) => {
    // Verificar si el producto tiene modificadores
    if (product.modifiers && product.modifiers.length > 0) {
      setSelectedProductForModifiers(product);
      setShowModifiersModal(true);
    } else {
      // Agregar directamente si no tiene modificadores
      const quantity = (cart[product.id] || 0) + 1;
      setCart(prev => ({
        ...prev,
        [product.id]: quantity
      }));
    }
  };

  // Manejar confirmación de modificadores
  const handleModifiersConfirm = (modifiedProduct) => {
    // Crear un ID único para el producto con modificadores
    const modifiedProductId = `${modifiedProduct.id}_${Date.now()}`;
    
    // Agregar al carrito con modificadores
    setCart(prev => ({
      ...prev,
      [modifiedProductId]: 1
    }));
    
    // Almacenar el producto modificado
    setModifiedProducts(prev => ({
      ...prev,
      [modifiedProductId]: {
        ...modifiedProduct,
        id: modifiedProductId,
        nombre: modifiedProduct.displayText,
        precio: modifiedProduct.precio,
        originalModifiers: modifiedProduct.selectedModifiers
      }
    }));
    
    setShowModifiersModal(false);
    setSelectedProductForModifiers(null);
  };

  // Remover producto del carrito
  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
        // También eliminar el producto modificado si existe
        if (modifiedProducts[productId]) {
          setModifiedProducts(prevModified => {
            const newModified = { ...prevModified };
            delete newModified[productId];
            return newModified;
          });
        }
      }
      return newCart;
    });
  };

  // Calcular productos del carrito
  const cartProducts = useMemo(() => {
    return Object.entries(cart).map(([productId, quantity]) => {
      // Verificar si es un producto modificado
      const modifiedProduct = modifiedProducts[productId];
      if (modifiedProduct) {
        return {
          id: productId,
          nombre: modifiedProduct.nombre,
          cantidad: quantity,
          precio: modifiedProduct.precio,
          subtotal: modifiedProduct.precio * quantity,
          notas: itemNotes[productId] || '',
          originalModifiers: modifiedProduct.originalModifiers
        };
      }
      
      // Producto normal sin modificadores
      const product = products.find(p => p.id === productId);
      return {
        id: productId,
        nombre: product.nombre,
        cantidad: quantity,
        precio: product.precio,
        subtotal: product.precio * quantity,
        notas: itemNotes[productId] || ''
      };
    });
  }, [cart, products, itemNotes, modifiedProducts]);

  // Calcular total
  const calculateTotal = () => {
    return cartProducts.reduce((sum, p) => sum + p.subtotal, 0);
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cartProducts.length === 0) {
      return;
    }

    const orderData = {
      mesa: parseInt(formData.mesa) || null,
      productos: cartProducts,
      totales: {
        subtotal: calculateTotal(),
        total: calculateTotal()
      },
      empleado: 'admin',
      estado: 'cocina', // Crear pedidos directamente en cocina
      mozoId: order?.mozoId || null,
      reservaId: order?.reservaId || null
    };

    onSave(orderData);
  };

  return (
    <div className={styles.fullscreenOrderModal}>
      {/* Header con información de mesa y cerrar */}
      <div className={styles.orderHeader}>
        <div className={styles.orderHeaderLeft}>
          <div className={styles.tableInfo}>
            <MapPin size={24} />
            <span>Mesa {selectedTable || 'No asignada'}</span>
          </div>
          <div className={styles.orderTotal}>
            Total: ${calculateTotal().toLocaleString('es-AR')}
          </div>
        </div>
        <button 
          onClick={onClose}
          className={styles.closeButton}
        >
          ×
        </button>
      </div>

      {/* Contenido principal: Productos + Carrito */}
      <div className={styles.orderMainContent}>
        {/* Columna izquierda: Productos */}
        <div className={styles.productsSection}>
          <div className={styles.productsSectionHeader}>
            <h3 className={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'Todos los productos' : selectedCategory}
            </h3>
            {/* Filtros de categoría integrados */}
            <div className={styles.integratedCategoryFilters}>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`${styles.integratedCategoryButton} ${
                    selectedCategory === category.id ? styles.integratedCategoryButtonActive : ''
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.productsGrid}>
            {filteredProducts.map(product => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productInfo}>
                  <h4 className={styles.productName}>{product.nombre}</h4>
                  <div className={styles.productPrice}>
                    ${product.precio.toLocaleString('es-AR')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  className={styles.addToCartButton}
                >
                  <Plus size={20} />
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha: Pedido pendiente */}
        <div className={styles.orderSection}>
          <div className={styles.orderSectionHeader}>
            <h3 className={styles.sectionTitle}>Pedido pendiente</h3>
            <div className={styles.productCount}>
              {cartProducts.length} {cartProducts.length === 1 ? 'producto' : 'productos'}
            </div>
          </div>

          <div className={styles.orderContent}>
            {cartProducts.length === 0 ? (
              <div className={styles.emptyOrder}>
                <ChefHat size={48} />
                <p>Selecciona productos para agregar al pedido</p>
              </div>
            ) : (
              <div className={styles.orderItems}>
                {cartProducts.map((product, index) => (
                  <div key={index} className={styles.orderItem}>
                    <div className={styles.orderItemDetails}>
                      <span className={styles.orderItemName}>{product.nombre}</span>
                      {product.notas && (
                        <span className={styles.itemNotes}>{product.notas}</span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItemForNotes(product.id);
                        setShowNotesModal(true);
                      }}
                      className={styles.standaloneNotesButton}
                      title="Agregar notas"
                    >
                      <FileText size={16} />
                    </button>
                    
                    <div className={styles.orderItemControls}>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className={styles.quantityControlButton}
                      >
                        -
                      </button>
                      <span className={styles.itemQuantity}>{product.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => addToCart({ id: product.id, precio: product.precio })}
                        className={styles.quantityControlButton}
                      >
                        +
                      </button>
                    </div>
                    <div className={styles.orderItemPrice}>
                      ${product.subtotal.toLocaleString('es-AR')}
                    </div>
                  </div>
                ))}
              </div>
            )}



            {/* Total */}
            <div className={styles.orderTotalSection}>
              <div className={styles.totalAmount}>
                Total: ${calculateTotal().toLocaleString('es-AR')}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className={styles.orderActions}>
            <button 
              type="button" 
              onClick={onClose} 
              className={styles.cancelOrderButton}
            >
              Cancelar
            </button>
            
            {/* Botón Ver Mesa - Solo mostrar si existe un pedido para esta mesa */}
            {existingOrder && onViewTable && (
              <button 
                type="button"
                onClick={() => {
                  onViewTable(selectedTable, existingOrder);
                }}
                className={styles.viewTableButton}
              >
                <ClipboardList size={20} />
                Ver Mesa
              </button>
            )}
            
            <button 
              type="button"
              onClick={() => {
                // Lógica para enviar a cocina
                const orderData = {
                  mesa: parseInt(formData.mesa) || parseInt(selectedTable),
                  productos: cartProducts,
                  totales: {
                    subtotal: calculateTotal(),
                    total: calculateTotal()
                  },
                  empleado: 'admin',
                  estado: 'cocina', // Enviar directo a cocina
                  mozoId: order?.mozoId || null,
                  reservaId: order?.reservaId || null
                };
                onSave(orderData);
              }}
              className={styles.sendToKitchenButton}
              disabled={cartProducts.length === 0}
            >
              <ChefHat size={20} />
              Enviar a Cocina
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              className={styles.saveOrderButton}
              disabled={cartProducts.length === 0}
            >
              Guardar Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Modal para notas del item */}
      {showNotesModal && selectedItemForNotes && (
        <div className={styles.notesModalOverlay}>
          <div className={styles.notesModal}>
            <h4>Notas para {products.find(p => p.id === selectedItemForNotes)?.nombre}</h4>
            <textarea
              value={itemNotes[selectedItemForNotes] || ''}
              onChange={(e) => setItemNotes(prev => ({
                ...prev,
                [selectedItemForNotes]: e.target.value
              }))}
              className={styles.notesModalInput}
              rows={3}
              placeholder="Ej: Sin cebolla, extra queso, punto jugoso..."
            />
            <div className={styles.notesModalActions}>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className={styles.notesModalCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedItemForNotes(null);
                }}
                className={styles.notesModalSave}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modificadores */}
      {showModifiersModal && selectedProductForModifiers && (
        <ModifiersModal
          isOpen={showModifiersModal}
          product={selectedProductForModifiers}
          onConfirm={handleModifiersConfirm}
          onClose={() => {
            setShowModifiersModal(false);
            setSelectedProductForModifiers(null);
          }}
        />
      )}
    </div>
  );
};

export default Pedidos; 