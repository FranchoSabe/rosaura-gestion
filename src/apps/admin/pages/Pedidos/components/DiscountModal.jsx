import React, { useState, useMemo } from 'react';
import { X, Percent, Gift, Calculator, Check } from 'lucide-react';
import styles from './DiscountModal.module.css';

/**
 * Modal para aplicar descuentos a una mesa
 * Permite elegir entre descuento por porcentaje o productos específicos a invitar
 */
const DiscountModal = ({ 
  isOpen, 
  onClose, 
  tableId, 
  deliveredOrders, 
  onApplyDiscount 
}) => {
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'products'
  const [percentageValue, setPercentageValue] = useState(10);
  const [customReason, setCustomReason] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  
  if (!isOpen || !deliveredOrders || deliveredOrders.length === 0) return null;

  // Consolidar productos de todos los pedidos
  const allProducts = useMemo(() => {
    const productMap = {};
    deliveredOrders.forEach(order => {
      order.productos?.forEach(product => {
        const key = `${product.nombre}-${product.precio}`;
        if (productMap[key]) {
          productMap[key].cantidad += product.cantidad;
          productMap[key].subtotal += product.subtotal || (product.cantidad * product.precio);
          productMap[key].orderIds.push(order.id);
        } else {
          productMap[key] = {
            id: key,
            nombre: product.nombre,
            cantidad: product.cantidad,
            precio: product.precio,
            subtotal: product.subtotal || (product.cantidad * product.precio),
            orderIds: [order.id]
          };
        }
      });
    });
    return Object.values(productMap);
  }, [deliveredOrders]);

  // Calcular totales
  const calculations = useMemo(() => {
    const totalOriginal = deliveredOrders.reduce((sum, order) => sum + (order.totales?.total || 0), 0);
    
    let discountAmount = 0;
    let discountReason = '';
    
    if (discountType === 'percentage') {
      discountAmount = (totalOriginal * percentageValue) / 100;
      discountReason = customReason || `Descuento ${percentageValue}%`;
    } else {
      // Calcular descuento por productos seleccionados
      const selectedProductsTotal = allProducts
        .filter(product => selectedProducts.has(product.id))
        .reduce((sum, product) => sum + product.subtotal, 0);
      
      discountAmount = selectedProductsTotal;
      discountReason = customReason || `Productos cortesía (${selectedProducts.size} items)`;
    }
    
    const totalWithDiscount = totalOriginal - discountAmount;
    
    return {
      totalOriginal,
      discountAmount,
      totalWithDiscount,
      discountReason
    };
  }, [deliveredOrders, discountType, percentageValue, customReason, selectedProducts, allProducts]);

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleApplyDiscount = () => {
    const discountData = {
      type: discountType,
      amount: calculations.discountAmount,
      reason: calculations.discountReason,
      originalTotal: calculations.totalOriginal,
      finalTotal: calculations.totalWithDiscount,
      percentage: discountType === 'percentage' ? percentageValue : null,
      selectedProducts: discountType === 'products' ? Array.from(selectedProducts) : null
    };
    
    onApplyDiscount(discountData);
  };

  const isValidDiscount = () => {
    if (discountType === 'percentage') {
      return percentageValue > 0 && percentageValue <= 100;
    } else {
      return selectedProducts.size > 0;
    }
  };

  return (
    <div className={styles.discountOverlay}>
      <div className={styles.discountModal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Percent size={24} />
            <div>
              <h2>Aplicar Descuento - Mesa {tableId}</h2>
              <p>Selecciona el tipo de descuento a aplicar</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Selector de tipo de descuento */}
          <div className={styles.discountTypeSelector}>
            <button
              className={`${styles.typeButton} ${discountType === 'percentage' ? styles.active : ''}`}
              onClick={() => setDiscountType('percentage')}
            >
              <Percent size={20} />
              <div>
                <h3>Descuento por Porcentaje</h3>
                <p>Aplicar un porcentaje de descuento al total</p>
              </div>
            </button>
            
            <button
              className={`${styles.typeButton} ${discountType === 'products' ? styles.active : ''}`}
              onClick={() => setDiscountType('products')}
            >
              <Gift size={20} />
              <div>
                <h3>Productos de Cortesía</h3>
                <p>Seleccionar productos específicos para invitar</p>
              </div>
            </button>
          </div>

          {/* Configuración según tipo */}
          {discountType === 'percentage' && (
            <div className={styles.percentageConfig}>
              <div className={styles.configGroup}>
                <label>Porcentaje de descuento:</label>
                <div className={styles.percentageInput}>
                  <input
                    type="number"
                    value={percentageValue}
                    onChange={(e) => setPercentageValue(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span>%</span>
                </div>
              </div>
              
              <div className={styles.configGroup}>
                <label>Razón del descuento (opcional):</label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={`Descuento ${percentageValue}%`}
                />
              </div>
            </div>
          )}

          {discountType === 'products' && (
            <div className={styles.productsConfig}>
              <div className={styles.configGroup}>
                <label>Selecciona productos para invitar:</label>
                <div className={styles.productsList}>
                  {allProducts.map(product => (
                    <div 
                      key={product.id} 
                      className={`${styles.productItem} ${selectedProducts.has(product.id) ? styles.selected : ''}`}
                      onClick={() => handleProductToggle(product.id)}
                    >
                      <div className={styles.productInfo}>
                        <span className={styles.productQuantity}>{product.cantidad}x</span>
                        <span className={styles.productName}>{product.nombre}</span>
                        <span className={styles.productPrice}>{formatCurrency(product.subtotal)}</span>
                      </div>
                      <div className={styles.productCheckbox}>
                        {selectedProducts.has(product.id) && <Check size={16} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.configGroup}>
                <label>Razón del descuento (opcional):</label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={`Productos cortesía (${selectedProducts.size} items)`}
                />
              </div>
            </div>
          )}

          {/* Resumen del descuento */}
          <div className={styles.discountSummary}>
            <div className={styles.summaryHeader}>
              <Calculator size={20} />
              <h3>Resumen del Descuento</h3>
            </div>
            
            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Total original:</span>
                <span>{formatCurrency(calculations.totalOriginal)}</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Descuento aplicado:</span>
                <span className={styles.discountAmount}>-{formatCurrency(calculations.discountAmount)}</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span>Razón:</span>
                <span className={styles.discountReason}>{calculations.discountReason}</span>
              </div>
              
              <div className={styles.summaryTotal}>
                <span>Total final:</span>
                <span>{formatCurrency(calculations.totalWithDiscount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className={styles.modalActions}>
          <button 
            onClick={onClose} 
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button 
            onClick={handleApplyDiscount}
            disabled={!isValidDiscount()}
            className={styles.applyButton}
          >
            <Check size={20} />
            Aplicar Descuento y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountModal; 