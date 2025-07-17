import React, { useState, useMemo } from 'react';
import { X, DollarSign, CreditCard, Banknote, Smartphone, Calculator, TrendingUp, Package, Clock, CheckCircle, FileText, AlertCircle, Lock } from 'lucide-react';
import styles from './CashRegisterModal.module.css';

/**
 * Modal para arqueo de caja detallado - NUEVO: usa datos temporales
 * Muestra totales por método de pago basados en datos temporales del turno
 */
const CashRegisterModal = ({ 
  isOpen,
  turnData,
  hasUnsavedPayments,
  onClose,
  onCashRegisterClose,
  onOpenPaymentsReview,
  showNotification
}) => {
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Usar datos temporales como fuente de verdad
  const pagosProcesados = useMemo(() => {
    return (turnData.pagosProcesados || []).filter(pago => pago.estado !== 'anulado');
  }, [turnData.pagosProcesados]);

  // Calcular totales basados en datos temporales
  const paymentBreakdown = useMemo(() => {
    const breakdown = {
      efectivo: { count: 0, total: 0, payments: [] },
      tarjeta: { count: 0, total: 0, payments: [] },
      transferencia: { count: 0, total: 0, payments: [] }
    };

    pagosProcesados.forEach(pago => {
      const paymentMethod = pago.metodoPago || 'efectivo';
      const total = pago.total || 0;
      
      if (breakdown[paymentMethod]) {
        breakdown[paymentMethod].count++;
        breakdown[paymentMethod].total += total;
        breakdown[paymentMethod].payments.push(pago);
      }
    });

    return breakdown;
  }, [pagosProcesados]);

  // Totales generales desde datos temporales
  const totals = useMemo(() => {
    return {
      totalOrders: turnData.contadores?.cantidadPagos || 0,
      totalAmount: turnData.totalesTurno?.total || 0,
      averageOrder: turnData.contadores?.cantidadPagos > 0 ? 
        (turnData.totalesTurno?.total || 0) / turnData.contadores.cantidadPagos : 0
    };
  }, [turnData]);

  // Formatear moneda
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Formatear turno
  const formatTurn = (turn) => {
    return turn === 'mediodia' ? 'Mediodía' : 'Noche';
  };

  // Calcular descuentos aplicados desde los pagos procesados
  const discountSummary = useMemo(() => {
    const discounts = {
      totalDescuentos: 0,
      cantidadDescuentos: 0,
      descuentosPorRazon: {},
      descuentosPorMesa: []
    };

    pagosProcesados.forEach(pago => {
      if (pago.descuentoAplicado && pago.descuentoAplicado > 0) {
        discounts.totalDescuentos += pago.descuentoAplicado;
        discounts.cantidadDescuentos++;
        
        // Agrupar por razón
        const razon = pago.razonDescuento || 'Sin especificar';
        if (!discounts.descuentosPorRazon[razon]) {
          discounts.descuentosPorRazon[razon] = { cantidad: 0, monto: 0 };
        }
        discounts.descuentosPorRazon[razon].cantidad++;
        discounts.descuentosPorRazon[razon].monto += pago.descuentoAplicado;
        
        // Detalles por mesa
        discounts.descuentosPorMesa.push({
          mesa: pago.mesa,
          monto: pago.descuentoAplicado,
          razon: razon,
          timestamp: pago.timestamp
        });
      }
    });

    return discounts;
  }, [pagosProcesados]);

  // Manejar cierre de caja - MEJORADO: manejo de errores robusto
  const handleCashRegisterClose = async () => {
    setProcessing(true);
    
    try {
      console.log('🔒 Iniciando proceso de cierre de caja...');
      
      // Datos del arqueo basados en datos temporales
      const cashRegisterData = {
        fecha: turnData.fecha,
        turno: turnData.turno,
        pedidos: pagosProcesados.map(pago => ({
          id: pago.id,
          orderIds: pago.orderIds || [], 
          mesa: pago.mesa,
          metodoPago: pago.metodoPago,
          total: pago.total,
          montoRecibido: pago.montoRecibido,
          cambio: pago.cambio,
          descuentoAplicado: pago.descuentoAplicado || 0,
          razonDescuento: pago.razonDescuento || '',
          timestamp: pago.timestamp,
          empleado: pago.empleado,
          guardadoFirebase: pago.guardadoFirebase,
          estado: pago.estado
        })),
        totales: {
          efectivo: paymentBreakdown.efectivo.total,
          tarjeta: paymentBreakdown.tarjeta.total,
          transferencia: paymentBreakdown.transferencia.total,
          total: totals.totalAmount
        },
        contadores: {
          totalPedidos: totals.totalOrders,
          pedidosEfectivo: paymentBreakdown.efectivo.count,
          pedidosTarjeta: paymentBreakdown.tarjeta.count,
          pedidosTransferencia: paymentBreakdown.transferencia.count,
          promedioVenta: totals.averageOrder
        },
        // NUEVO: Información de descuentos
        descuentos: {
          totalDescuentos: discountSummary.totalDescuentos,
          cantidadDescuentos: discountSummary.cantidadDescuentos,
          descuentosPorRazon: discountSummary.descuentosPorRazon,
          descuentosPorMesa: discountSummary.descuentosPorMesa
        },
        timestamp: new Date(),
        empleado: 'admin',
        fuenteDatos: 'temporal',
        validado: true
      };

      console.log('📊 Datos del arqueo preparados:', {
        pedidos: cashRegisterData.pedidos.length,
        total: cashRegisterData.totales.total,
        descuentos: cashRegisterData.descuentos.totalDescuentos
      });

      // Llamar a la función de cierre de caja con manejo de errores mejorado
      await onCashRegisterClose(cashRegisterData);
      
      console.log('✅ Cierre de caja exitoso, cerrando modal...');
      
      // Cerrar modal solo si no hay errores
      onClose();
      
    } catch (error) {
      console.error('❌ Error detallado al cerrar caja:', error);
      
      // Mostrar error específico al usuario
      const errorMessage = error.message || 'Error desconocido al cerrar la caja';
      showNotification(`Error al cerrar caja: ${errorMessage}`, 'error');
      
      // No cerrar el modal si hay error para que el usuario pueda intentar de nuevo
      console.log('🔄 Modal permanece abierto para reintentar cierre');
      
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Calculator size={24} />
            <div>
              <h2>Arqueo de Caja</h2>
              <p>{formatTurn(turnData.turno)} - {new Date(turnData.fecha).toLocaleDateString('es-AR')}</p>
            </div>
          </div>
          
          {/* Botón para revisar pagos del turno */}
          <button 
            onClick={onOpenPaymentsReview}
            className={styles.reviewButton}
            title="Revisar pagos del turno"
          >
            <FileText size={18} />
            Ver Pagos ({pagosProcesados.length})
          </button>
          
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Resumen General */}
          <div className={styles.summarySection}>
            <h3>
              <TrendingUp size={18} />
              Resumen General
            </h3>
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.cardIcon}>
                  <Package size={20} />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardValue}>{totals.totalOrders}</span>
                  <span className={styles.cardLabel}>Pedidos</span>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.cardIcon}>
                  <DollarSign size={20} />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardValue}>{formatCurrency(totals.totalAmount)}</span>
                  <span className={styles.cardLabel}>Total Ventas</span>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.cardIcon}>
                  <TrendingUp size={20} />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardValue}>{formatCurrency(totals.averageOrder)}</span>
                  <span className={styles.cardLabel}>Promedio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas de pagos no guardados */}
          {hasUnsavedPayments && (
            <div className={styles.warningSection}>
              <div className={styles.warningCard}>
                <AlertCircle size={20} />
                <div className={styles.warningContent}>
                  <h4>⚠️ Pagos pendientes de guardar</h4>
                  <p>Hay pagos que no se han guardado correctamente en el servidor. No se puede cerrar la caja hasta resolver estos problemas.</p>
                </div>
              </div>
            </div>
          )}

          {/* Desglose por Método de Pago */}
          <div className={styles.paymentBreakdownSection}>
            <h3>
              <CreditCard size={18} />
              Desglose por Método de Pago
            </h3>
            <div className={styles.paymentMethods}>
              {/* Efectivo */}
              <div className={styles.paymentMethodCard}>
                <div className={styles.paymentMethodHeader}>
                  <div className={styles.paymentMethodIcon}>
                    <Banknote size={24} />
                  </div>
                  <div className={styles.paymentMethodInfo}>
                    <h4>Efectivo</h4>
                    <p>{paymentBreakdown.efectivo.count} pedidos</p>
                  </div>
                  <div className={styles.paymentMethodTotal}>
                    {formatCurrency(paymentBreakdown.efectivo.total)}
                  </div>
                </div>
                <div className={styles.paymentMethodPercentage}>
                  {totals.totalAmount > 0 ? 
                    ((paymentBreakdown.efectivo.total / totals.totalAmount) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* Tarjeta */}
              <div className={styles.paymentMethodCard}>
                <div className={styles.paymentMethodHeader}>
                  <div className={styles.paymentMethodIcon}>
                    <CreditCard size={24} />
                  </div>
                  <div className={styles.paymentMethodInfo}>
                    <h4>Tarjeta</h4>
                    <p>{paymentBreakdown.tarjeta.count} pedidos</p>
                  </div>
                  <div className={styles.paymentMethodTotal}>
                    {formatCurrency(paymentBreakdown.tarjeta.total)}
                  </div>
                </div>
                <div className={styles.paymentMethodPercentage}>
                  {totals.totalAmount > 0 ? 
                    ((paymentBreakdown.tarjeta.total / totals.totalAmount) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* Transferencia */}
              <div className={styles.paymentMethodCard}>
                <div className={styles.paymentMethodHeader}>
                  <div className={styles.paymentMethodIcon}>
                    <Smartphone size={24} />
                  </div>
                  <div className={styles.paymentMethodInfo}>
                    <h4>Transferencia</h4>
                    <p>{paymentBreakdown.transferencia.count} pedidos</p>
                  </div>
                  <div className={styles.paymentMethodTotal}>
                    {formatCurrency(paymentBreakdown.transferencia.total)}
                  </div>
                </div>
                <div className={styles.paymentMethodPercentage}>
                  {totals.totalAmount > 0 ? 
                    ((paymentBreakdown.transferencia.total / totals.totalAmount) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Descuentos Aplicados */}
          {discountSummary.cantidadDescuentos > 0 && (
            <div className={styles.discountSection}>
              <h3>
                <TrendingUp size={18} />
                Descuentos Aplicados
              </h3>
              
              {/* Resumen de descuentos */}
              <div className={styles.discountSummary}>
                <div className={styles.discountSummaryCard}>
                  <div className={styles.discountSummaryHeader}>
                    <span className={styles.discountSummaryLabel}>Total en Descuentos</span>
                    <span className={styles.discountSummaryValue}>
                      {formatCurrency(discountSummary.totalDescuentos)}
                    </span>
                  </div>
                  <div className={styles.discountSummarySubtext}>
                    {discountSummary.cantidadDescuentos} descuento{discountSummary.cantidadDescuentos !== 1 ? 's' : ''} aplicado{discountSummary.cantidadDescuentos !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              {/* Desglose por razón */}
              <div className={styles.discountBreakdown}>
                <h4>Desglose por Razón</h4>
                <div className={styles.discountReasons}>
                  {Object.entries(discountSummary.descuentosPorRazon).map(([razon, data]) => (
                    <div key={razon} className={styles.discountReasonItem}>
                      <div className={styles.discountReasonInfo}>
                        <span className={styles.discountReasonName}>{razon}</span>
                        <span className={styles.discountReasonCount}>
                          {data.cantidad} {data.cantidad === 1 ? 'vez' : 'veces'}
                        </span>
                      </div>
                      <div className={styles.discountReasonAmount}>
                        {formatCurrency(data.monto)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Detalles por mesa */}
              <div className={styles.discountDetails}>
                <h4>Detalle por Mesa</h4>
                <div className={styles.discountMesas}>
                  {discountSummary.descuentosPorMesa.map((descuento, index) => (
                    <div key={index} className={styles.discountMesaItem}>
                      <div className={styles.discountMesaInfo}>
                        <span className={styles.discountMesaNumber}>Mesa {descuento.mesa}</span>
                        <span className={styles.discountMesaReason}>{descuento.razon}</span>
                      </div>
                      <div className={styles.discountMesaAmount}>
                        -{formatCurrency(descuento.monto)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Información Adicional */}
          <div className={styles.additionalInfoSection}>
            <h3>
              <FileText size={18} />
              Información Adicional
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Clock size={16} />
                <span>Turno: {formatTurn(turnData.turno)}</span>
              </div>
              <div className={styles.infoItem}>
                <FileText size={16} />
                <span>Fecha: {new Date(turnData.fecha).toLocaleDateString('es-AR')}</span>
              </div>
              <div className={styles.infoItem}>
                <Calculator size={16} />
                <span>Empleado: admin</span>
              </div>
              {discountSummary.cantidadDescuentos > 0 && (
                <div className={styles.infoItem}>
                  <TrendingUp size={16} />
                  <span>Descuentos: {formatCurrency(discountSummary.totalDescuentos)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Confirmación de Cierre */}
          {showConfirmation && (
            <div className={styles.confirmationSection}>
              <div className={styles.confirmationAlert}>
                <AlertCircle size={20} />
                <div>
                  <h4>¿Confirmar cierre de caja?</h4>
                  <p>Esta acción guardará los datos del arqueo y reiniciará los contadores para el próximo turno.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className={styles.modalActions}>
          <button 
            onClick={onClose} 
            className={styles.cancelButton}
            disabled={processing}
          >
            {showConfirmation ? 'Cancelar' : 'Cerrar'}
          </button>
          
          {/* Botón de revisión de pagos */}
          {!showConfirmation && (
            <button 
              onClick={onOpenPaymentsReview}
              className={styles.reviewPaymentsButton}
              disabled={processing}
            >
              <FileText size={18} />
              Revisar Pagos
            </button>
          )}
          
          {!showConfirmation ? (
            <button 
              onClick={() => setShowConfirmation(true)}
              className={styles.confirmButton}
              disabled={processing || totals.totalOrders === 0 || hasUnsavedPayments}
              title={hasUnsavedPayments ? 'No se puede cerrar con pagos pendientes de guardar' : ''}
            >
              <Lock size={20} />
              {hasUnsavedPayments ? 'Pagos Pendientes' : 'Cerrar Caja'}
            </button>
          ) : (
            <button 
              onClick={handleCashRegisterClose}
              className={styles.finalizeButton}
              disabled={processing || hasUnsavedPayments}
            >
              {processing ? (
                'Procesando...'
              ) : (
                <>
                  <CheckCircle size={20} />
                  Confirmar Cierre
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashRegisterModal; 