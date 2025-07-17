import { useState, useCallback, useMemo } from 'react';
import { calculateEnsaladaPrice, generateEnsaladaDisplayText } from '../../../../../shared/constants/modifiers';

/**
 * Hook personalizado para manejar modificadores de productos
 * Resuelve definitivamente el problema de la ensalada personalizada
 */
export const useModifiers = (product) => {
  // Estado para modificadores seleccionados - inicialización única
  const [selectedModifiers, setSelectedModifiers] = useState(() => {
    if (!product?.modifiers) return {};
    
    const initialModifiers = {};
    product.modifiers.forEach(modifier => {
      if (modifier.required && modifier.type === 'single_choice') {
        // Seleccionar primera opción por defecto para modificadores obligatorios
        initialModifiers[modifier.id] = modifier.options[0].id;
      } else if (modifier.type === 'multiple_choice') {
        initialModifiers[modifier.id] = [];
      }
    });
    
    return initialModifiers;
  });

  // Estado para datos de ensalada personalizada
  const [ensaladaData, setEnsaladaData] = useState(null);

  // Actualizar modificador individual
  const updateModifier = useCallback((modifierId, value) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [modifierId]: value
    }));
  }, []);

  // Actualizar múltiples modificadores
  const updateModifiers = useCallback((modifiers) => {
    setSelectedModifiers(prev => ({
      ...prev,
      ...modifiers
    }));
  }, []);

  // Manejar confirmación de ensalada personalizada
  const handleEnsaladaConfirm = useCallback((data) => {
    if (!data || !data.ingredients || !data.displayText) {
      console.error('Datos de ensalada incompletos:', data);
      return;
    }

    // Guardar datos de ensalada
    setEnsaladaData(data);

    // Asegurar que "ensalada_personalizada" permanezca seleccionada
    setSelectedModifiers(prev => ({
      ...prev,
      guarnicion: 'ensalada_personalizada' // Forzar selección
    }));
  }, []);

  // Cancelar ensalada personalizada
  const handleEnsaladaCancel = useCallback(() => {
    setEnsaladaData(null);
    
    // Volver a la primera opción del modificador de guarnición
    setSelectedModifiers(prev => {
      const newModifiers = { ...prev };
      
      if (product?.modifiers) {
        const guarnicionModifier = product.modifiers.find(mod => mod.id === 'guarnicion');
        if (guarnicionModifier && guarnicionModifier.options.length > 0) {
          newModifiers.guarnicion = guarnicionModifier.options[0].id;
        }
      }
      
      return newModifiers;
    });
  }, [product]);

  // Validar modificadores completos
  const isValid = useMemo(() => {
    if (!product?.modifiers) return true;
    
    return product.modifiers.every(modifier => {
      if (!modifier.required) return true;
      
      const selected = selectedModifiers[modifier.id];
      
      if (modifier.type === 'single_choice') {
        if (!selected) return false;
        
        // Validación especial para ensalada personalizada
        if (selected === 'ensalada_personalizada') {
          return ensaladaData && 
                 ensaladaData.ingredients && 
                 ensaladaData.displayText &&
                 ensaladaData.totalPrice !== undefined;
        }
        
        return true;
      }
      
      if (modifier.type === 'multiple_choice') {
        return selected && Array.isArray(selected) && selected.length > 0;
      }
      
      return true;
    });
  }, [product, selectedModifiers, ensaladaData]);

  // Calcular precio total con modificadores
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    
    let price = product.precio || 0;
    
    if (product.modifiers) {
      product.modifiers.forEach(modifier => {
        if (modifier.type === 'single_choice') {
          const selectedOptionId = selectedModifiers[modifier.id];
          if (selectedOptionId) {
            const selectedOption = modifier.options.find(opt => opt.id === selectedOptionId);
            if (selectedOption) {
              // Para ensalada personalizada, usar precio calculado
              if (selectedOptionId === 'ensalada_personalizada' && ensaladaData) {
                price += ensaladaData.totalPrice || 0;
              } else {
                price += selectedOption.price || 0;
              }
            }
          }
        } else if (modifier.type === 'multiple_choice') {
          const selectedOptions = selectedModifiers[modifier.id] || [];
          selectedOptions.forEach(optionId => {
            const selectedOption = modifier.options.find(opt => opt.id === optionId);
            if (selectedOption) {
              price += selectedOption.price || 0;
            }
          });
        }
      });
    }
    
    return price;
  }, [product, selectedModifiers, ensaladaData]);

  // Generar texto descriptivo del producto
  const displayText = useMemo(() => {
    if (!product) return '';
    
    let text = product.nombre;
    const modifierTexts = [];
    
    if (product.modifiers) {
      product.modifiers.forEach(modifier => {
        if (modifier.type === 'single_choice') {
          const selectedOptionId = selectedModifiers[modifier.id];
          if (selectedOptionId) {
            const selectedOption = modifier.options.find(opt => opt.id === selectedOptionId);
            if (selectedOption) {
              // Para ensalada personalizada, usar texto generado
              if (selectedOptionId === 'ensalada_personalizada' && ensaladaData) {
                modifierTexts.push(ensaladaData.displayText);
              } else if (selectedOption.price > 0) {
                modifierTexts.push(`${selectedOption.name} (+$${selectedOption.price})`);
              } else {
                modifierTexts.push(selectedOption.name);
              }
            }
          }
        } else if (modifier.type === 'multiple_choice') {
          const selectedOptions = selectedModifiers[modifier.id] || [];
          selectedOptions.forEach(optionId => {
            const selectedOption = modifier.options.find(opt => opt.id === optionId);
            if (selectedOption) {
              if (selectedOption.price > 0) {
                modifierTexts.push(`${selectedOption.name} (+$${selectedOption.price})`);
              } else {
                modifierTexts.push(selectedOption.name);
              }
            }
          });
        }
      });
    }
    
    if (modifierTexts.length > 0) {
      text += ` (${modifierTexts.join(', ')})`;
    }
    
    return text;
  }, [product, selectedModifiers, ensaladaData]);

  // Necesita configurar ensalada personalizada
  const needsEnsaladaConfig = useMemo(() => {
    return Object.values(selectedModifiers).some(value => value === 'ensalada_personalizada') && !ensaladaData;
  }, [selectedModifiers, ensaladaData]);

  // Resetear todo
  const reset = useCallback(() => {
    setSelectedModifiers(() => {
      if (!product?.modifiers) return {};
      
      const initialModifiers = {};
      product.modifiers.forEach(modifier => {
        if (modifier.required && modifier.type === 'single_choice') {
          initialModifiers[modifier.id] = modifier.options[0].id;
        } else if (modifier.type === 'multiple_choice') {
          initialModifiers[modifier.id] = [];
        }
      });
      
      return initialModifiers;
    });
    setEnsaladaData(null);
  }, [product]);

  return {
    // Estado
    selectedModifiers,
    ensaladaData,
    
    // Datos computados
    isValid,
    totalPrice,
    displayText,
    needsEnsaladaConfig,
    
    // Acciones
    updateModifier,
    updateModifiers,
    handleEnsaladaConfirm,
    handleEnsaladaCancel,
    reset
  };
};

export default useModifiers; 