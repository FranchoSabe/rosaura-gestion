/**
 * tablesLayout.js - Layout unificado de mesas del restaurante
 *
 * Este archivo contiene la única fuente de verdad para el layout de mesas.
 * Evita dependencias circulares al ser un archivo independiente.
 */

import reservationOrder from '../config/reservationOrder.json';

// Layout unificado de mesas - Versión con mesas más grandes
export const UNIFIED_TABLES_LAYOUT = [
  // Zona superior (mesas horizontales para 4 personas) - más grandes
  { id: 12, x: 15, y: 10, width: 85, height: 45, capacity: 4 },
  { id: 13, x: 110, y: 10, width: 85, height: 45, capacity: 4 },

  // Zona superior-media (mesas cuadradas para 2 personas) - más grandes
  { id: 21, x: 15, y: 65, width: 45, height: 45, capacity: 2 },
  { id: 11, x: 15, y: 120, width: 45, height: 45, capacity: 2 },
  { id: 24, x: 105, y: 65, width: 45, height: 45, capacity: 2 },
  { id: 14, x: 160, y: 65, width: 45, height: 45, capacity: 2 },

  // Zona central (mesas horizontales) - más grandes
  { id: 10, x: 15, y: 175, width: 85, height: 45, capacity: 4 },
  { id: 9, x: 15, y: 230, width: 85, height: 45, capacity: 4 },
  { id: 8, x: 15, y: 285, width: 45, height: 45, capacity: 2 },

  // Columna central - más grandes
  { id: 6, x: 110, y: 165, width: 45, height: 70, capacity: 4 },
  { id: 7, x: 110, y: 245, width: 55, height: 75, capacity: 6 },

  // Columna derecha - más grandes
  { id: 5, x: 175, y: 140, width: 45, height: 70, capacity: 4 },
  { id: 4, x: 175, y: 220, width: 45, height: 70, capacity: 4 },
  { id: 3, x: 175, y: 300, width: 45, height: 70, capacity: 4 },
  { id: 2, x: 175, y: 380, width: 45, height: 45, capacity: 2 },

  // Zona inferior - más grandes
  { id: 1, x: 65, y: 380, width: 45, height: 45, capacity: 2 },
  { id: 31, x: 120, y: 380, width: 45, height: 45, capacity: 2 },
];

/**
 * Función para rotar el layout 90 grados en sentido horario
 * Mantiene las posiciones relativas pero cambia la orientación
 */
export const rotateLayout90Degrees = (layout, originalWidth = 235, originalHeight = 520) => {
  return layout.map(table => ({
    ...table,
    // Rotar coordenadas: x' = y, y' = originalWidth - x - width
    x: table.y,
    y: originalWidth - table.x - table.width,
    // Intercambiar width y height
    width: table.height,
    height: table.width
  }));
};

// Layout horizontal: rotación del layout original
export const HORIZONTAL_TABLES_LAYOUT = rotateLayout90Degrees(UNIFIED_TABLES_LAYOUT);

// Dimensiones para el layout horizontal
export const LAYOUT_DIMENSIONS = {
  vertical: { width: 235, height: 520 },
  horizontal: { width: 450, height: 235 } // Reducido de 520 a 450 para eliminar espacio vacío derecho
};

// Orden de asignación de mesas optimizado
export const UNIFIED_RESERVATION_ORDER = reservationOrder;

// Combinaciones de mesas permitidas
export const UNIFIED_TABLE_COMBINATIONS = {
  joinableFor4: [
    { tables: [11, 21], combinedCapacity: 4, name: "Mesa 11+21" },
    { tables: [1, 31], combinedCapacity: 4, name: "Mesa 1+31" },
    { tables: [14, 24], combinedCapacity: 4, name: "Mesa 14+24" }
  ],
  joinableFor6: [
    { tables: [2, 3], combinedCapacity: 6, name: "Mesa 2+3" }
  ]
};

// Bloqueos por defecto
export const UNIFIED_DEFAULT_BLOCKED_TABLES = {
  4: [4, 5], // 8 cupos walk-in
  2: [14, 24], // 4 cupos walk-in
  // TOTAL: 12 cupos walk-in predeterminados
};

// Función helper para crear Set de bloqueos por defecto
export const getDefaultBlockedTablesSet = () => {
  const defaultBlocked = new Set();
  Object.values(UNIFIED_DEFAULT_BLOCKED_TABLES).flat().forEach(tableId => {
    defaultBlocked.add(tableId);
  });
  return defaultBlocked;
};

// Función helper para generar fechas disponibles (7 días desde hoy)
export const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dateString = date.getFullYear() + '-' + 
                      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(date.getDate()).padStart(2, '0');
    dates.push(dateString);
  }
  return dates;
};

// Función helper para obtener fecha de hoy como string
export const getTodayString = () => {
  const today = new Date();
  return today.getFullYear() + '-' + 
         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
         String(today.getDate()).padStart(2, '0');
};

// Función helper para formatear fecha de manera amigable
export const formatDateLabel = (dateString) => {
  const todayString = getTodayString();
  
  // Calcular mañana
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = tomorrow.getFullYear() + '-' + 
                        String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(tomorrow.getDate()).padStart(2, '0');
  
  if (dateString === todayString) return 'Hoy';
  if (dateString === tomorrowString) return 'Mañana';
  
  // Para otros días, usar la fecha parseada
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayName = dayNames[date.getDay()];
  
  return `${dayName} ${day}/${month}`;
}; 