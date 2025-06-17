/**
 * tablesLayout.js - Layout unificado de mesas del restaurante
 * 
 * Este archivo contiene la única fuente de verdad para el layout de mesas.
 * Evita dependencias circulares al ser un archivo independiente.
 */

// Layout unificado de mesas - Versión optimizada
export const UNIFIED_TABLES_LAYOUT = [
  // Zona superior (mesas horizontales para 4 personas)
  { id: 12, x: 50, y: 30, width: 70, height: 40, capacity: 4 },
  { id: 13, x: 140, y: 30, width: 70, height: 40, capacity: 4 },

  // Zona superior-media (mesas cuadradas para 2 personas)
  { id: 21, x: 50, y: 85, width: 40, height: 40, capacity: 2 },
  { id: 11, x: 50, y: 135, width: 40, height: 40, capacity: 2 },
  { id: 24, x: 140, y: 85, width: 40, height: 40, capacity: 2 },
  { id: 14, x: 190, y: 85, width: 40, height: 40, capacity: 2 },

  // Zona central (mesas horizontales)
  { id: 10, x: 50, y: 190, width: 70, height: 35, capacity: 4 },
  { id: 9, x: 50, y: 235, width: 70, height: 35, capacity: 4 },
  { id: 8, x: 50, y: 280, width: 40, height: 40, capacity: 2 },

  // Columna central
  { id: 6, x: 140, y: 180, width: 35, height: 60, capacity: 4 },
  { id: 7, x: 140, y: 250, width: 50, height: 70, capacity: 6 },

  // Columna derecha
  { id: 5, x: 220, y: 155, width: 35, height: 60, capacity: 4 },
  { id: 4, x: 220, y: 225, width: 35, height: 60, capacity: 4 },
  { id: 3, x: 220, y: 295, width: 35, height: 60, capacity: 4 },
  { id: 2, x: 220, y: 365, width: 40, height: 40, capacity: 2 },

  // Zona inferior
  { id: 1, x: 125, y: 365, width: 40, height: 40, capacity: 2 },
  { id: 31, x: 170, y: 365, width: 40, height: 40, capacity: 2 },
];

// Orden de asignación de mesas optimizado
export const UNIFIED_RESERVATION_ORDER = {
  2: [8, 11, 21, 1, 31, 2, 14, 24], // Optimizado para preservar walk-ins
  4: [9, 10, 6, 12, 13, 3, 4, 5], // Optimizado para preservar walk-ins  
  6: [7]
};

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