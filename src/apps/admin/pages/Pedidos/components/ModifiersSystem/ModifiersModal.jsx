import React, { useState } from 'react';
import { X, ChefHat, DollarSign } from 'lucide-react';
import { useModifiers } from '../../hooks/useModifiers';
import { Modal } from '../../../../../../shared/components/ui/Modal';
import EnsaladaModal from './EnsaladaModal';
import ModifierGroup from './ModifierGroup';
import styles from './ModifiersModal.module.css';

/**
 * Modal para seleccionar modificadores de producto
 * Versión refactorizada con hooks personalizados
 */
const ModifiersModal = ({ 
  isOpen,
  product, 
  onConfirm, 
  onClose 
}) => {
  const {
    selectedModifiers,
    ensaladaData,
    isValid,
    totalPrice,
    displayText,
    needsEnsaladaConfig,
    updateModifier,
    handleEnsaladaConfirm,
    handleEnsaladaCancel
  } = useModifiers(product);

  const [showEnsaladaModal, setShowEnsaladaModal] = useState(false);

  // Manejar selección de modificador
  const handleModifierSelect = (modifierId, value) => {
    if (value === 'ensalada_personalizada') {
      // Abrir modal de ensalada personalizada
      setShowEnsaladaModal(true);
    } else {
      // Selección normal
      updateModifier(modifierId, value);
    }
  };

  // Manejar confirmación de ensalada
  const handleEnsaladaConfirmInternal = (data) => {
    handleEnsaladaConfirm(data);
    setShowEnsaladaModal(false);
  };

  // Manejar cancelación de ensalada
  const handleEnsaladaCancelInternal = () => {
    handleEnsaladaCancel();
    setShowEnsaladaModal(false);
  };

  // Manejar confirmación del producto
  const handleConfirm = () => {
    if (!isValid) return;
    
    const modifiedProduct = {
      ...product,
      selectedModifiers,
      ensaladaData,
      precio: totalPrice,
      displayText,
      originalModifiers: product.modifiers
    };
    
    onConfirm(modifiedProduct);
  };

  // Formatear precio
  const formatPrice = (price) => {
    return `$${price.toLocaleString('es-AR')}`;
  };

  if (!product) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={product.nombre}
        size="large"
        closeOnOverlayClick={false}
        className={styles.touchOptimizedModal}
      >
        <div className={styles.modifiersModal}>
          {/* Header con producto */}
          <div className={styles.productHeader}>
            <div className={styles.productInfo}>
              <h3>{product.nombre}</h3>
              <p className={styles.productDescription}>{product.descripcion}</p>
            </div>
            <div className={styles.productPrice}>
              <span className={styles.basePrice}>Precio base: {formatPrice(product.precio)}</span>
              <span className={styles.totalPrice}>Total: {formatPrice(totalPrice)}</span>
            </div>
          </div>

          {/* Modificadores */}
          <div className={styles.modifiersSection}>
            {product.modifiers?.map(modifier => (
              <ModifierGroup
                key={modifier.id}
                modifier={modifier}
                selectedValue={selectedModifiers[modifier.id]}
                onSelect={(value) => handleModifierSelect(modifier.id, value)}
                ensaladaData={ensaladaData}
                needsEnsaladaConfig={needsEnsaladaConfig}
              />
            ))}
          </div>

          {/* Preview del producto */}
          <div className={styles.productPreview}>
            <div className={styles.previewHeader}>
              <ChefHat size={20} />
              <span>Vista previa del producto</span>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewText}>{displayText}</div>
              <div className={styles.previewPrice}>
                <DollarSign size={16} />
                {formatPrice(totalPrice)}
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
              onClick={handleConfirm}
              disabled={!isValid}
              className={`${styles.confirmButton} ${!isValid ? styles.disabled : ''}`}
            >
              Agregar al pedido
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de ensalada personalizada */}
      <EnsaladaModal
        isOpen={showEnsaladaModal}
        onClose={handleEnsaladaCancelInternal}
        onConfirm={handleEnsaladaConfirmInternal}
        initialIngredients={ensaladaData?.ingredients || {}}
      />
    </>
  );
};

export default ModifiersModal; 