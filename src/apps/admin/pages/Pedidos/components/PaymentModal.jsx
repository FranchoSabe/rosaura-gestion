import React, { useState, useMemo } from 'react';
import { X, CreditCard, Banknote, Calculator, Check, Smartphone } from 'lucide-react';
import styles from './PaymentModal.module.css';

/**
 * Modal simplificado para cobro en 3 clicks
 * 1. Click "Procesar Pago" → Abrir modal
 * 2. Click método de pago → Seleccionar
 * 3. Click "Confirmar" → Procesar
 */
const PaymentModal = ({ 
  order, // Puede ser un array de pedidos o un pedido individual
  tableId, 
  onClose, 
  onPaymentComplete,
  showNotification,
  appliedDiscount = null // Descuento aplicado a la mesa
}) => {
  // Normalizar orden/órdenes a un array
  const orders = Array.isArray(order) ? order : [order];
  
  const [step, setStep] = useState(1); // 1: Seleccionar método, 2: Confirmar
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Calcular total con descuentos aplicados
  const calculations = useMemo(() => {
    const subtotal = orders.reduce((sum, order) => {
      return sum + (order.totales?.subtotal || order.totales?.total || 0);
    }, 0);
    
    const discountAmount = appliedDiscount?.amount || 0;
    const totalAmount = subtotal - discountAmount;
    
    return {
      subtotal,
      discountAmount,
      totalAmount,
      discountReason: appliedDiscount?.reason || ''
    };
  }, [orders, appliedDiscount]);

  // Formatear moneda
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Manejar selección de método de pago
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    
    // Si es efectivo, establecer monto automáticamente
    if (method === 'efectivo') {
      setReceivedAmount(calculations.totalAmount);
    }
    
    // Avanzar al paso de confirmación
    setStep(2);
  };

  // Procesar pago
  const handleConfirmPayment = async () => {
    // Validar monto para efectivo
    if (paymentMethod === 'efectivo' && receivedAmount < calculations.totalAmount) {
      showNotification('El monto recibido es insuficiente', 'error');
      return;
    }

    setProcessing(true);
    
    try {
      // Datos del pago con descuentos incluidos
      const paymentData = {
        orderIds: orders.map(o => o.id),
        tableId,
        paymentMethod,
        subtotal: calculations.subtotal,
        discount: calculations.discountAmount,
        discountReason: calculations.discountReason,
        total: calculations.totalAmount,
        receivedAmount: paymentMethod === 'efectivo' ? receivedAmount : calculations.totalAmount,
        change: paymentMethod === 'efectivo' ? Math.max(0, receivedAmount - calculations.totalAmount) : 0,
        printReceipt: true, // Siempre imprimir
        timestamp: new Date(),
        employee: 'admin',
        ordersCount: orders.length
      };

      await onPaymentComplete(paymentData);
      
      showNotification('Pago procesado exitosamente', 'success');
      onClose();
      
    } catch (error) {
      console.error('Error al procesar pago:', error);
      showNotification('Error al procesar el pago', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Volver al paso anterior
  const handleBack = () => {
    setStep(1);
    setPaymentMethod('');
    setReceivedAmount(0);
  };

  return (
    <div className={styles.paymentModalOverlay}>
      <div className={styles.paymentModal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Calculator size={24} />
            <div>
              <h2>Procesar Pago - Mesa {tableId}</h2>
              <p>Total: {formatCurrency(calculations.totalAmount)} • {orders.length === 1 ? `Pedido #${orders[0].orderId}` : `${orders.length} pedidos`}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalContent}>
          {step === 1 && (
            // PASO 1: Seleccionar método de pago
            <div className={styles.paymentMethodSelection}>
              <h3 className={styles.stepTitle}>Selecciona el método de pago</h3>
              
              <div className={styles.quickPaymentMethods}>
                <button
                  className={styles.quickPaymentButton}
                  onClick={() => handlePaymentMethodSelect('efectivo')}
                >
                  <Banknote size={32} />
                  <span className={styles.methodName}>Efectivo</span>
                  <span className={styles.methodAmount}>{formatCurrency(calculations.totalAmount)}</span>
                </button>
                
                <button
                  className={styles.quickPaymentButton}
                  onClick={() => handlePaymentMethodSelect('tarjeta')}
                >
                  <CreditCard size={32} />
                  <span className={styles.methodName}>Tarjeta</span>
                  <span className={styles.methodAmount}>{formatCurrency(calculations.totalAmount)}</span>
                </button>
                
                <button
                  className={styles.quickPaymentButton}
                  onClick={() => handlePaymentMethodSelect('transferencia')}
                >
                  <Smartphone size={32} />
                  <span className={styles.methodName}>Transferencia</span>
                  <span className={styles.methodAmount}>{formatCurrency(calculations.totalAmount)}</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            // PASO 2: Confirmar pago
            <div className={styles.paymentConfirmation}>
              <h3 className={styles.stepTitle}>Confirmar pago</h3>
              
              <div className={styles.confirmationDetails}>
                <div className={styles.selectedMethod}>
                  <div className={styles.methodIcon}>
                    {paymentMethod === 'efectivo' && <Banknote size={32} />}
                    {paymentMethod === 'tarjeta' && <CreditCard size={32} />}
                    {paymentMethod === 'transferencia' && <Smartphone size={32} />}
                  </div>
                  <div className={styles.methodInfo}>
                    <span className={styles.methodName}>
                      {paymentMethod === 'efectivo' && 'Efectivo'}
                      {paymentMethod === 'tarjeta' && 'Tarjeta'}
                      {paymentMethod === 'transferencia' && 'Transferencia'}
                    </span>
                    <span className={styles.methodAmount}>{formatCurrency(calculations.totalAmount)}</span>
                  </div>
                </div>

                {paymentMethod === 'efectivo' && (
                  <div className={styles.cashAdjustment}>
                    <label>Monto recibido:</label>
                    <input
                      type="number"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                      className={styles.cashInput}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {receivedAmount > calculations.totalAmount && (
                      <div className={styles.changeAmount}>
                        Cambio: {formatCurrency(receivedAmount - calculations.totalAmount)}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.orderSummary}>
                  <div className={styles.summaryRow}>
                    <span>Mesa {tableId}</span>
                    <span>{orders.length} pedido{orders.length > 1 ? 's' : ''}</span>
                  </div>
                  {calculations.discountAmount > 0 && (
                    <>
                      <div className={styles.summaryRow}>
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculations.subtotal)}</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>Descuento ({calculations.discountReason}):</span>
                        <span className={styles.discountAmount}>-{formatCurrency(calculations.discountAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className={styles.summaryTotal}>
                    <span>Total a pagar:</span>
                    <span>{formatCurrency(calculations.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className={styles.modalActions}>
          {step === 1 && (
            <button 
              onClick={onClose} 
              className={styles.cancelButton}
            >
              Cancelar
            </button>
          )}
          
          {step === 2 && (
            <>
              <button 
                onClick={handleBack} 
                className={styles.backButton}
              >
                Volver
              </button>
              <button 
                onClick={handleConfirmPayment}
                disabled={processing || (paymentMethod === 'efectivo' && receivedAmount < calculations.totalAmount)}
                className={styles.confirmButton}
              >
                {processing ? (
                  'Procesando...'
                ) : (
                  <>
                    <Check size={20} />
                    Confirmar Pago
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 