import React, { useState, useMemo } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Edit3, Trash2, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import styles from './TurnPaymentsModal.module.css';

/**
 * Modal para revisar todos los pagos del turno antes del cierre de caja
 * Permite corregir, anular y ver detalles de cada pago procesado
 */
const TurnPaymentsModal = ({ 
  isOpen,
  turnData,
  onClose,
  onCorrectPayment,
  onVoidPayment,
  showNotification
}) => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [correctionData, setCorrectionData] = useState({});
  const [voidReason, setVoidReason] = useState('');

  // Formatear moneda
  const formatCurrency = (amount) => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `$${validAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Formatear tiempo
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Hora inválida';
    }
  };

  // Formatear turno
  const formatTurn = (turn) => {
    return turn === 'mediodia' ? 'Mediodía' : 'Noche';
  };

  // Obtener icono de método de pago
  const getPaymentIcon = (method) => {
    switch (method) {
      case 'efectivo':
        return <DollarSign size={16} />;
      case 'tarjeta':
        return <CreditCard size={16} />;
      case 'transferencia':
        return <Smartphone size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  // Obtener clase CSS para estado del pago
  const getPaymentStatusClass = (pago) => {
    if (pago.estado === 'anulado') return styles.statusVoided;
    if (pago.estado === 'corregido') return styles.statusCorrected;
    if (!pago.guardadoFirebase) return styles.statusUnsaved;
    return styles.statusProcessed;
  };

  // Obtener texto de estado
  const getStatusText = (pago) => {
    if (pago.estado === 'anulado') return 'Anulado';
    if (pago.estado === 'corregido') return 'Corregido';
    if (!pago.guardadoFirebase) return 'No guardado';
    return 'Procesado';
  };

  // Filtrar pagos (mostrar solo activos por defecto)
  const [showVoidedPayments, setShowVoidedPayments] = useState(false);
  const filteredPayments = useMemo(() => {
    if (showVoidedPayments) {
      return turnData.pagosProcesados || [];
    }
    return (turnData.pagosProcesados || []).filter(pago => pago.estado !== 'anulado');
  }, [turnData.pagosProcesados, showVoidedPayments]);

  // Manejar corrección de pago
  const handleCorrectPayment = () => {
    if (!selectedPayment || !correctionData.metodoPago || !correctionData.total) {
      showNotification('Complete todos los campos para corregir el pago', 'error');
      return;
    }

    const nuevosData = {
      metodoPago: correctionData.metodoPago,
      total: parseFloat(correctionData.total),
      montoRecibido: parseFloat(correctionData.montoRecibido) || parseFloat(correctionData.total),
      cambio: correctionData.metodoPago === 'efectivo' ? 
        Math.max(0, parseFloat(correctionData.montoRecibido || correctionData.total) - parseFloat(correctionData.total)) : 0
    };

    onCorrectPayment(selectedPayment.id, nuevosData);
    
    showNotification(
      `Pago corregido: Mesa ${selectedPayment.mesa} - ${correctionData.metodoPago} ${formatCurrency(nuevosData.total)}`,
      'success'
    );
    
    setShowCorrectModal(false);
    setSelectedPayment(null);
    setCorrectionData({});
  };

  // Manejar anulación de pago
  const handleVoidPayment = () => {
    if (!selectedPayment) return;
    
    if (!voidReason.trim()) {
      showNotification('Debe especificar una razón para anular el pago', 'error');
      return;
    }

    onVoidPayment(selectedPayment.id, voidReason);
    
    showNotification(
      `Pago anulado: Mesa ${selectedPayment.mesa} - ${formatCurrency(selectedPayment.total)} - Razón: ${voidReason}`,
      'warning'
    );
    
    setShowVoidModal(false);
    setSelectedPayment(null);
    setVoidReason('');
  };

  // Inicializar datos de corrección
  const startCorrection = (pago) => {
    setSelectedPayment(pago);
    setCorrectionData({
      metodoPago: pago.metodoPago,
      total: pago.total.toString(),
      montoRecibido: pago.montoRecibido?.toString() || pago.total.toString()
    });
    setShowCorrectModal(true);
  };

  // Inicializar anulación
  const startVoid = (pago) => {
    setSelectedPayment(pago);
    setVoidReason('');
    setShowVoidModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Clock size={24} />
            <div>
              <h2>Pagos del Turno</h2>
              <p>{formatTurn(turnData.turno)} - {new Date(turnData.fecha).toLocaleDateString('es-AR')}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Resumen rápido */}
          <div className={styles.quickSummary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total del turno:</span>
              <span className={styles.summaryValue}>{formatCurrency(turnData.totalesTurno.total)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pagos procesados:</span>
              <span className={styles.summaryValue}>{filteredPayments.length}</span>
            </div>
          </div>

          {/* Filtros */}
          <div className={styles.filters}>
            <label className={styles.filterCheckbox}>
              <input
                type="checkbox"
                checked={showVoidedPayments}
                onChange={(e) => setShowVoidedPayments(e.target.checked)}
              />
              <span>Mostrar pagos anulados</span>
            </label>
          </div>

          {/* Lista de pagos */}
          <div className={styles.paymentsList}>
            {filteredPayments.length === 0 ? (
              <div className={styles.emptyState}>
                <AlertCircle size={48} />
                <p>No hay pagos procesados en este turno</p>
              </div>
            ) : (
              filteredPayments.map(pago => (
                <div key={pago.id} className={`${styles.paymentItem} ${getPaymentStatusClass(pago)}`}>
                  <div className={styles.paymentInfo}>
                    <div className={styles.paymentMain}>
                      <div className={styles.paymentMesa}>Mesa {pago.mesa}</div>
                      <div className={styles.paymentMethod}>
                        {getPaymentIcon(pago.metodoPago)}
                        <span>{pago.metodoPago}</span>
                      </div>
                      <div className={styles.paymentAmount}>{formatCurrency(pago.total)}</div>
                    </div>
                    
                    <div className={styles.paymentDetails}>
                      <span className={styles.paymentTime}>
                        <Clock size={12} />
                        {formatTime(pago.timestamp)}
                      </span>
                      <span className={styles.paymentStatus}>
                        {getStatusText(pago)}
                      </span>
                      {pago.empleado && (
                        <span className={styles.paymentEmployee}>
                          {pago.empleado}
                        </span>
                      )}
                    </div>

                    {/* Información de corrección si aplica */}
                    {pago.estado === 'corregido' && pago.datosOriginales && (
                      <div className={styles.correctionInfo}>
                        <ArrowRight size={12} />
                        <span>Original: {pago.datosOriginales.metodoPago} {formatCurrency(pago.datosOriginales.total)}</span>
                      </div>
                    )}

                    {/* Información de anulación si aplica */}
                    {pago.estado === 'anulado' && pago.razonAnulacion && (
                      <div className={styles.voidInfo}>
                        <span>Razón: {pago.razonAnulacion}</span>
                      </div>
                    )}

                    {/* Alerta si no está guardado */}
                    {!pago.guardadoFirebase && (
                      <div className={styles.unsavedAlert}>
                        <AlertCircle size={12} />
                        <span>No guardado en servidor</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {pago.estado !== 'anulado' && (
                    <div className={styles.paymentActions}>
                      <button 
                        onClick={() => startCorrection(pago)}
                        className={styles.correctButton}
                        title="Corregir pago"
                      >
                        <Edit3 size={16} />
                        Corregir
                      </button>
                      
                      <button 
                        onClick={() => startVoid(pago)}
                        className={styles.voidButton}
                        title="Anular pago"
                      >
                        <Trash2 size={16} />
                        Anular
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Resumen de métodos de pago */}
          <div className={styles.methodSummary}>
            <h3>Resumen por método de pago</h3>
            <div className={styles.methodBreakdown}>
              <div className={styles.methodItem}>
                <DollarSign size={16} />
                <span>Efectivo: {formatCurrency(turnData.totalesTurno.efectivo)}</span>
              </div>
              <div className={styles.methodItem}>
                <CreditCard size={16} />
                <span>Tarjeta: {formatCurrency(turnData.totalesTurno.tarjeta)}</span>
              </div>
              <div className={styles.methodItem}>
                <Smartphone size={16} />
                <span>Transferencia: {formatCurrency(turnData.totalesTurno.transferencia)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de corrección */}
        {showCorrectModal && selectedPayment && (
          <div className={styles.subModalOverlay}>
            <div className={styles.subModal}>
              <div className={styles.subModalHeader}>
                <h3>Corregir Pago - Mesa {selectedPayment.mesa}</h3>
                <button onClick={() => setShowCorrectModal(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className={styles.subModalContent}>
                <div className={styles.formGroup}>
                  <label>Método de pago:</label>
                  <select
                    value={correctionData.metodoPago || ''}
                    onChange={(e) => setCorrectionData(prev => ({ ...prev, metodoPago: e.target.value }))}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Total:</label>
                  <input
                    type="number"
                    value={correctionData.total || ''}
                    onChange={(e) => setCorrectionData(prev => ({ ...prev, total: e.target.value }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                {correctionData.metodoPago === 'efectivo' && (
                  <div className={styles.formGroup}>
                    <label>Monto recibido:</label>
                    <input
                      type="number"
                      value={correctionData.montoRecibido || ''}
                      onChange={(e) => setCorrectionData(prev => ({ ...prev, montoRecibido: e.target.value }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
              
              <div className={styles.subModalActions}>
                <button onClick={() => setShowCorrectModal(false)} className={styles.cancelButton}>
                  Cancelar
                </button>
                <button onClick={handleCorrectPayment} className={styles.confirmButton}>
                  Corregir Pago
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de anulación */}
        {showVoidModal && selectedPayment && (
          <div className={styles.subModalOverlay}>
            <div className={styles.subModal}>
              <div className={styles.subModalHeader}>
                <h3>Anular Pago - Mesa {selectedPayment.mesa}</h3>
                <button onClick={() => setShowVoidModal(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className={styles.subModalContent}>
                <div className={styles.voidWarning}>
                  <AlertCircle size={20} />
                  <p>Está a punto de anular un pago de {formatCurrency(selectedPayment.total)}</p>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Razón de la anulación:</label>
                  <textarea
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Explique por qué se anula este pago..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className={styles.subModalActions}>
                <button onClick={() => setShowVoidModal(false)} className={styles.cancelButton}>
                  Cancelar
                </button>
                <button onClick={handleVoidPayment} className={styles.voidConfirmButton}>
                  Anular Pago
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnPaymentsModal; 