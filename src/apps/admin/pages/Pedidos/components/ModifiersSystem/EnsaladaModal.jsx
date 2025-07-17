import React, { useState, useMemo } from 'react';
import { X, Salad, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../../../../../../shared/components/ui/Modal';
import { 
  getEnsaladaIngredients, 
  calculateEnsaladaPrice, 
  generateEnsaladaDisplayText 
} from '../../../../../../shared/constants/modifiers';
import styles from './EnsaladaModal.module.css';

/**
 * Modal para configurar ensalada personalizada
 * Versión refactorizada y mejorada
 */
const EnsaladaModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  initialIngredients = {}
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState(initialIngredients);
  const [errors, setErrors] = useState({});
  
  const ingredientGroups = getEnsaladaIngredients();

  // Manejar selección de ingredientes
  const handleIngredientToggle = (groupId, optionId, option) => {
    setSelectedIngredients(prev => {
      const group = prev[groupId] || { selectedOptions: [] };
      const isSelected = group.selectedOptions?.some(selected => selected.id === optionId);
      
      if (isSelected) {
        // Quitar opción
        return {
          ...prev,
          [groupId]: {
            ...group,
            selectedOptions: group.selectedOptions.filter(selected => selected.id !== optionId)
          }
        };
      } else {
        // Agregar opción
        return {
          ...prev,
          [groupId]: {
            ...group,
            selectedOptions: [...(group.selectedOptions || []), option]
          }
        };
      }
    });
    
    // Limpiar errores cuando se selecciona algo
    if (errors[groupId]) {
      setErrors(prev => ({
        ...prev,
        [groupId]: null
      }));
    }
  };

  // Validar ingredientes
  const validateIngredients = () => {
    const newErrors = {};
    
    ingredientGroups.forEach(group => {
      const selectedOptions = selectedIngredients[group.id]?.selectedOptions || [];
      
      if (group.required && selectedOptions.length === 0) {
        newErrors[group.id] = `Debes seleccionar al menos una opción de ${group.name.toLowerCase()}`;
      }
      
      if (group.minSelection && selectedOptions.length < group.minSelection) {
        newErrors[group.id] = `Debes seleccionar al menos ${group.minSelection} opciones de ${group.name.toLowerCase()}`;
      }
      
      if (group.maxSelection && selectedOptions.length > group.maxSelection) {
        newErrors[group.id] = `Puedes seleccionar máximo ${group.maxSelection} opciones de ${group.name.toLowerCase()}`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verificar si es válido
  const isValid = useMemo(() => {
    // Verificar que se cumplan los requisitos mínimos
    return ingredientGroups.every(group => {
      const selectedOptions = selectedIngredients[group.id]?.selectedOptions || [];
      
      if (group.required && selectedOptions.length === 0) return false;
      if (group.minSelection && selectedOptions.length < group.minSelection) return false;
      if (group.maxSelection && selectedOptions.length > group.maxSelection) return false;
      
      return true;
    });
  }, [selectedIngredients, ingredientGroups]);

  // Calcular precio total
  const totalPrice = useMemo(() => {
    return calculateEnsaladaPrice(selectedIngredients);
  }, [selectedIngredients]);

  // Generar texto descriptivo
  const displayText = useMemo(() => {
    return generateEnsaladaDisplayText(selectedIngredients);
  }, [selectedIngredients]);

  // Manejar confirmación
  const handleConfirm = () => {
    if (!validateIngredients()) return;
    
    onConfirm({
      ingredients: selectedIngredients,
      totalPrice,
      displayText
    });
  };

  // Formatear precio
  const formatPrice = (price) => {
    return `$${price.toLocaleString('es-AR')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Personalizar Ensalada"
      size="large"
      closeOnOverlayClick={false}
      className={styles.touchOptimizedEnsaladaModal}
    >
      <div className={styles.ensaladaModal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerIcon}>
            <Salad size={24} />
          </div>
          <div className={styles.headerContent}>
            <h3>Personaliza tu ensalada</h3>
            <p>Selecciona los ingredientes para tu ensalada de guarnición</p>
          </div>
        </div>

        {/* Grupos de ingredientes */}
        <div className={styles.ingredientsSection}>
          {ingredientGroups.map(group => (
            <div key={group.id} className={styles.ingredientGroup}>
              {/* Header del grupo */}
              <div className={styles.groupHeader}>
                <h4 className={styles.groupTitle}>
                  {group.name}
                  {group.required && <span className={styles.requiredIndicator}>*</span>}
                </h4>
                <div className={styles.groupSubtitle}>
                  {group.minSelection && (
                    <span>Mínimo {group.minSelection} {group.minSelection === 1 ? 'opción' : 'opciones'}</span>
                  )}
                  {group.maxSelection && (
                    <span>Máximo {group.maxSelection} {group.maxSelection === 1 ? 'opción' : 'opciones'}</span>
                  )}
                </div>
              </div>

              {/* Error del grupo */}
              {errors[group.id] && (
                <div className={styles.groupError}>
                  <AlertCircle size={16} />
                  <span>{errors[group.id]}</span>
                </div>
              )}

              {/* Opciones del grupo */}
              <div className={styles.optionsGrid}>
                {group.options.map(option => {
                  const isSelected = selectedIngredients[group.id]?.selectedOptions?.some(
                    selected => selected.id === option.id
                  );
                  
                  return (
                    <div
                      key={option.id}
                      className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleIngredientToggle(group.id, option.id, option)}
                    >
                      <div className={styles.optionContent}>
                        {/* Checkbox indicator */}
                        <div className={styles.checkboxIndicator}>
                          {isSelected && <Check size={16} />}
                        </div>
                        
                        {/* Option info */}
                        <div className={styles.optionInfo}>
                          <div className={styles.optionName}>{option.name}</div>
                          {option.price > 0 && (
                            <div className={styles.optionPrice}>
                              +{formatPrice(option.price)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Preview y precio */}
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h4>Vista previa</h4>
          </div>
          <div className={styles.previewContent}>
            <div className={styles.previewText}>
              {displayText || 'Selecciona ingredientes para ver la preview'}
            </div>
            <div className={styles.previewPrice}>
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
            <Check size={20} />
            Confirmar ensalada
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EnsaladaModal; 