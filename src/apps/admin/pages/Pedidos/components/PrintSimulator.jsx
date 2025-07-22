import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import styles from './PrintSimulator.module.css';

/**
 * Simulador de impresión para testing sin impresora física
 * Muestra el contenido exacto del ticket que se imprimiría
 */
const PrintSimulator = ({ 
  isOpen, 
  onClose, 
  ticketData, 
  onConfirmPrint 
}) => {
  if (!isOpen || !ticketData) return null;

  const formatCurrency = (amount) => {
    // Validar que amount sea un número válido
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return `$${validAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date) => {
    // Validar que date sea una fecha válida
    const validDate = date instanceof Date ? date : (date ? new Date(date) : new Date());
    if (isNaN(validDate.getTime())) {
      return new Date().toLocaleDateString('es-AR');
    }
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(validDate);
  };

  const handlePrint = () => {
    // Simular impresión
    // console.log('🖨️ SIMULANDO IMPRESIÓN:', ticketData);
    onConfirmPrint();
  };

  const handleDownloadPDF = () => {
    // Simular descarga de PDF
    const content = generateTicketText();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-mesa-${ticketData.mesa}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateTicketText = () => {
    let content = '';
    content += '=============================\n';
    content += '      RESTAURANTE ROSAURA\n';
    content += '=============================\n';
    content += `Mesa: ${ticketData.mesa}\n`;
    content += `Fecha: ${formatDate(ticketData.fecha)}\n`;
    content += `Empleado: ${ticketData.empleado}\n`;
    content += `Tipo: ${ticketData.tipo}\n`;
    content += '-----------------------------\n';
    
    if (ticketData.productosConsolidados) {
      content += 'PRODUCTOS:\n';
      ticketData.productosConsolidados.forEach(product => {
        content += `${product.cantidad}x ${product.nombre}\n`;
        content += `    ${formatCurrency(product.subtotal)}\n`;
      });
    }
    
    content += '-----------------------------\n';
    content += `Subtotal: ${formatCurrency(ticketData.subtotal || ticketData.total)}\n`;
    
    if (ticketData.descuento) {
      content += `Descuento (${ticketData.descuento.porcentaje}%): -${formatCurrency(ticketData.descuento.monto)}\n`;
      content += `Razón: ${ticketData.descuento.razon}\n`;
    }
    
    content += `TOTAL: ${formatCurrency(ticketData.total)}\n`;
    content += '=============================\n';
    
    return content;
  };

  return (
    <div className={styles.simulatorOverlay}>
      <div className={styles.simulatorModal}>
        {/* Header */}
        <div className={styles.simulatorHeader}>
          <div className={styles.simulatorTitle}>
            <Printer size={24} />
            <div>
              <h2>Simulador de Impresión</h2>
              <p>Vista previa del ticket - Mesa {ticketData.mesa}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {/* Ticket Preview */}
        <div className={styles.ticketPreview}>
          <div className={styles.ticketContent}>
            <div className={styles.ticketHeader}>
              <h3>RESTAURANTE ROSAURA</h3>
              <div className={styles.ticketInfo}>
                <p><strong>Mesa:</strong> {ticketData.mesa}</p>
                <p><strong>Fecha:</strong> {formatDate(ticketData.fecha)}</p>
                <p><strong>Empleado:</strong> {ticketData.empleado}</p>
                <p><strong>Tipo:</strong> {ticketData.tipo}</p>
              </div>
            </div>

            <div className={styles.ticketDivider}></div>

            {ticketData.productosConsolidados && (
              <>
                <div className={styles.ticketProducts}>
                  <h4>PRODUCTOS:</h4>
                  {ticketData.productosConsolidados.map((product, index) => (
                    <div key={index} className={styles.ticketProduct}>
                      <div className={styles.productLine}>
                        <span>{product.cantidad}x {product.nombre}</span>
                        <span>{formatCurrency(product.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.ticketDivider}></div>
              </>
            )}

            <div className={styles.ticketTotals}>
              <div className={styles.totalLine}>
                <span>Subtotal:</span>
                <span>{formatCurrency(ticketData.subtotal || ticketData.total)}</span>
              </div>
              
              {ticketData.descuento && (
                <>
                  <div className={styles.totalLine}>
                    <span>Descuento ({ticketData.descuento.porcentaje}%):</span>
                    <span className={styles.discount}>-{formatCurrency(ticketData.descuento.monto)}</span>
                  </div>
                  <div className={styles.discountReason}>
                    <em>{ticketData.descuento.razon}</em>
                  </div>
                </>
              )}
              
              <div className={styles.totalLine} style={{ fontWeight: 'bold', fontSize: '1.2em', marginTop: '0.5rem' }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(ticketData.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.simulatorActions}>
          <button 
            onClick={onClose} 
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button 
            onClick={handleDownloadPDF} 
            className={styles.downloadButton}
          >
            <Download size={20} />
            Descargar TXT
          </button>
          <button 
            onClick={handlePrint} 
            className={styles.printButton}
          >
            <Printer size={20} />
            Simular Impresión
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintSimulator; 