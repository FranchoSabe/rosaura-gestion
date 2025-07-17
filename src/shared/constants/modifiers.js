/**
 * 🍽️ MODIFICADORES GLOBALES REUTILIZABLES
 * Sistema de modificadores predefinidos para productos del menú
 */

export const GLOBAL_MODIFIERS = {
  coccion: {
    id: 'coccion',
    name: 'Punto de Cocción',
    type: 'single_choice',
    required: true,
    options: [
      { id: 'vuelta_vuelta', name: 'Vuelta y vuelta', price: 0 },
      { id: 'jugoso', name: 'Jugoso', price: 0 },
      { id: 'a_punto', name: 'A punto', price: 0 },
      { id: 'bien_cocido', name: 'Bien cocido', price: 0 }
    ]
  },
  
  guarnicion: {
    id: 'guarnicion',
    name: 'Guarnición',
    type: 'single_choice',
    required: true,
    options: [
      { id: 'papas_fritas', name: 'Papas fritas', price: 0 },
      { id: 'pure_papas', name: 'Puré de papas', price: 0 },
      { id: 'verduras_grilladas', name: 'Verduras grilladas', price: 800 },
      { id: 'ensalada_personalizada', name: 'Ensalada personalizada', price: 500, hasIngredients: true }
    ]
  }
};

// 🥗 CONFIGURACIÓN DE INGREDIENTES DE ENSALADA
// Aquí puedes agregar, quitar o modificar ingredientes disponibles
export const ENSALADA_INGREDIENTS = {
  verduras: {
    id: 'verduras',
    name: 'Verduras',
    type: 'multiple_choice',
    required: true,
    minSelection: 2,
    options: [
      { id: 'lechuga', name: 'Lechuga', price: 0 },
      { id: 'tomate', name: 'Tomate', price: 0 },
      { id: 'cebolla', name: 'Cebolla', price: 0 },
      { id: 'pepino', name: 'Pepino', price: 0 },
      { id: 'zanahoria', name: 'Zanahoria', price: 0 },
      { id: 'pimiento', name: 'Pimiento', price: 0 },
      { id: 'apio', name: 'Apio', price: 0 },
      // Puedes agregar más ingredientes aquí:
      { id: 'rucula', name: 'Rúcula', price: 100 },
      { id: 'espinaca', name: 'Espinaca', price: 0 },
      { id: 'radicheta', name: 'Radicheta', price: 150 }
    ]
  },
  // Puedes agregar más categorías como proteínas, aderezos, etc.
  proteinas: {
    id: 'proteinas',
    name: 'Proteínas (Opcional)',
    type: 'multiple_choice',
    required: false,
    minSelection: 0,
    options: [
      { id: 'pollo', name: 'Pollo grillado', price: 1500 },
      { id: 'atun', name: 'Atún', price: 1200 },
      { id: 'queso', name: 'Queso', price: 800 },
      { id: 'huevo', name: 'Huevo duro', price: 600 }
    ]
  },
  extras: {
    id: 'extras',
    name: 'Extras (Opcional)',
    type: 'multiple_choice',
    required: false,
    minSelection: 0,
    options: [
      { id: 'aceitunas', name: 'Aceitunas', price: 400 },
      { id: 'nueces', name: 'Nueces', price: 600 },
      { id: 'semillas', name: 'Semillas de girasol', price: 300 },
      { id: 'crutones', name: 'Crutones', price: 400 }
    ]
  }
};

/**
 * Función para obtener todos los modificadores disponibles
 */
export const getAvailableModifiers = () => {
  return Object.values(GLOBAL_MODIFIERS);
};

/**
 * Función para obtener un modificador específico
 */
export const getModifierById = (id) => {
  return GLOBAL_MODIFIERS[id];
};

/**
 * Función para obtener ingredientes de ensalada
 */
export const getEnsaladaIngredients = () => {
  return Object.values(ENSALADA_INGREDIENTS);
};

/**
 * Función para verificar si un producto necesita ingredientes de ensalada
 */
export const needsEnsaladaIngredients = (modifiers) => {
  if (!modifiers) return false;
  
  return modifiers.some(modifier => 
    modifier.id === 'guarnicion' && 
    modifier.selectedOption?.id === 'ensalada_personalizada'
  );
};

/**
 * Función para calcular el precio total de una ensalada personalizada
 */
export const calculateEnsaladaPrice = (selectedIngredients) => {
  let totalPrice = 500; // precio base de ensalada
  
  // Solo verduras ahora, todas con precio 0
  Object.values(selectedIngredients).forEach(group => {
    if (group.selectedOptions) {
      group.selectedOptions.forEach(option => {
        totalPrice += option.price;
      });
    }
  });
  
  return totalPrice;
};

/**
 * Función para generar texto descriptivo de ensalada
 */
export const generateEnsaladaDisplayText = (selectedIngredients) => {
  const verduras = selectedIngredients.verduras?.selectedOptions || [];
  
  if (verduras.length === 0) {
    return 'Ensalada personalizada';
  }
  
  const verdurasText = verduras.map(verdura => verdura.name).join(', ');
  return `Ensalada (${verdurasText})`;
}; 