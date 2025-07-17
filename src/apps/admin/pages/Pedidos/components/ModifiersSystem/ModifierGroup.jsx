import React from 'react';
import { Check, AlertCircle, Settings } from 'lucide-react';
import styles from './ModifierGroup.module.css';

/**
 * Componente para grupo de modificadores
 * Maneja tanto single_choice como multiple_choice
 */
const ModifierGroup = ({ 
  modifier, 
  selectedValue, 
  onSelect,
  ensaladaData,
  needsEnsaladaConfig
}) => {
  // Formatear precio
  const formatPrice = (price) => {
    return price > 0 ? `+$${price.toLocaleString('es-AR')}` : '';
  };

  // Renderizar opciones para single_choice
  const renderSingleChoice = () => {
    return (
      <div className={styles.optionsGrid}>
        {modifier.options.map(option => {
          const isSelected = selectedValue === option.id;
          const isEnsaladaPersonalizada = option.id === 'ensalada_personalizada';
          const needsConfig = isEnsaladaPersonalizada && needsEnsaladaConfig;
          const isConfigured = isEnsaladaPersonalizada && ensaladaData;
          
          return (
            <div
              key={option.id}
              className={`${styles.option} ${isSelected ? styles.selected : ''} ${needsConfig ? styles.needsConfig : ''}`}
              onClick={() => onSelect(option.id)}
            >
              <div className={styles.optionContent}>
                {/* Radio button indicator */}
                <div className={styles.radioIndicator}>
                  {isSelected && <Check size={16} />}
                </div>
                
                {/* Option info */}
                <div className={styles.optionInfo}>
                  <div className={styles.optionName}>{option.name}</div>
                  {option.price > 0 && (
                    <div className={styles.optionPrice}>{formatPrice(option.price)}</div>
                  )}
                  
                  {/* Ensalada personalizada status */}
                  {isEnsaladaPersonalizada && (
                    <div className={styles.ensaladaStatus}>
                      {needsConfig && (
                        <div className={styles.needsConfigLabel}>
                          <Settings size={14} />
                          <span>Configurar ingredientes</span>
                        </div>
                      )}
                      {isConfigured && (
                        <div className={styles.configuredLabel}>
                          <Check size={14} />
                          <span>{ensaladaData.displayText}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar opciones para multiple_choice
  const renderMultipleChoice = () => {
    const selectedOptions = selectedValue || [];
    
    return (
      <div className={styles.optionsGrid}>
        {modifier.options.map(option => {
          const isSelected = selectedOptions.includes(option.id);
          
          return (
            <div
              key={option.id}
              className={`${styles.option} ${isSelected ? styles.selected : ''}`}
              onClick={() => {
                const newSelection = isSelected 
                  ? selectedOptions.filter(id => id !== option.id)
                  : [...selectedOptions, option.id];
                onSelect(newSelection);
              }}
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
                    <div className={styles.optionPrice}>{formatPrice(option.price)}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.modifierGroup}>
      {/* Header del grupo */}
      <div className={styles.groupHeader}>
        <h4 className={styles.groupTitle}>
          {modifier.name}
          {modifier.required && <span className={styles.requiredIndicator}>*</span>}
        </h4>
        <div className={styles.groupSubtitle}>
          {modifier.type === 'single_choice' ? 'Selecciona una opción' : 'Selecciona múltiples opciones'}
        </div>
      </div>

      {/* Validación */}
      {modifier.required && !selectedValue && (
        <div className={styles.validationError}>
          <AlertCircle size={16} />
          <span>Este campo es obligatorio</span>
        </div>
      )}

      {/* Opciones */}
      {modifier.type === 'single_choice' ? renderSingleChoice() : renderMultipleChoice()}
    </div>
  );
};

export default ModifierGroup; 