# 🚀 ROSAURA GESTIÓN - PLAN DE DESARROLLO 2025

## 🎯 **ESTADO ACTUAL DEL SISTEMA**
**Fecha**: 25 de Enero 2025  
**Servidor**: http://localhost:5173/
**Sistema**: 100% funcional y operativo

### ✅ **FUNCIONALIDADES OPERATIVAS COMPLETADAS**
- **Sistema de Reservas Avanzado**: Check-in, reasignación, popup unificado
- **Sistema de Pedidos Completo**: Toma de pedidos, modificadores, facturación
- **Gestión de Mesas Unificada**: Estados en tiempo real, bloqueos manuales  
- **Arqueo de Caja**: Métodos de pago reales, descuentos, estadísticas
- **Notificaciones Inteligentes**: Categorización automática, reducción 70% interrupciones
- **UI/UX Optimizada**: Responsive, tablets, componentes modulares

---

## 🔥 **PRÓXIMAS FASES DE DESARROLLO**

### **FASE 6: SISTEMA DE GESTIÓN DE MESAS AVANZADO**
*Prioridad: ALTA - Innovación operativa crítica*

#### 🪑 **6.1 Sistema de Unir Mesas**
**Objetivo**: Flexibilidad total en distribución de mesas para eventos especiales

**Funcionalidades**:
- Botón "Unir Mesas" en mapa interactivo
- Selección múltiple de mesas adyacentes
- Suma automática de capacidades (Mesa 1: 4 + Mesa 2: 6 = 10 personas)
- Vista unificada en mapa (mesas agrupadas visualmente)
- Reservas asignadas al "grupo de mesas" temporal
- Desunir automático al final del turno

**Arquitectura Técnica**:
```
src/shared/services/tableGroupService.js
├── createTableGroup()      → Unir mesas seleccionadas
├── disbandTableGroup()     → Separar mesas al final del turno
├── validateGrouping()      → Verificar mesas compatibles (adyacentes)
└── calculateGroupCapacity() → Sumar capacidades individuales
```

**Estados de Mesa Extendidos**:
- `grouped`: Mesa parte de un grupo temporal
- `group-leader`: Mesa principal del grupo (muestra info total)
- `group-member`: Mesa secundaria (referencia al líder)

#### 🚶‍♂️ **6.2 Walk-in Directo desde Reservas**
**Objetivo**: Gestión inmediata de clientes sin reserva

**Funcionalidades**:
- Botón "Agregar Walk-in" en vista de reservas
- Check-in automático sin datos de reserva previa
- Asignación inteligente de mesa disponible
- Cliente temporal: "Walk-in Mesa X - [Timestamp]"
- Seguimiento de ocupación real tiempo real

---

### **FASE 7: SISTEMA DE GESTIÓN DE MOZOS**
*Prioridad: ALTA - Control operativo de personal*

#### 👨‍🍳 **7.1 Selección de Mozos por Turno**
**Objetivo**: Configuración flexible de personal por día

**Funcionalidades**:
- Modal "Configurar Mozos del Turno" al iniciar día
- Lista de mozos predeterminados: Mozo 1, Mozo 2, Mozo 3, Mozo 4
- Asignación de nombres reales: Mateo, Biancu, etc.
- Persistencia por fecha para estadísticas históricas
- Vista previa de horarios y turnos trabajados

**Datos a Persistir**:
```javascript
{
  fecha: "2025-01-25",
  turno: "mediodia", 
  mozos: {
    mozo1: { nombre: "Mateo", activo: true },
    mozo2: { nombre: "Biancu", activo: true },
    mozo3: { nombre: "Sofia", activo: false },
    mozo4: { nombre: "", activo: false }
  }
}
```

#### 🍽️ **7.2 Asignación de Mozo a Mesa**
**Objetivo**: Control de responsabilidades por mesa

**Funcionalidades**:
- Dropdown de mozo al abrir mesa en Pedidos
- Solo mozos activos del turno visible
- Asignación automática/manual configurable
- Vista "Mesas por Mozo" en dashboard
- Estadísticas de performance por mozo

**Integración con Pedidos**:
- Campo `mozosAsignado` en cada pedido
- Filtros por mozo en vista de cocina
- Estadísticas de tiempo de atención por mozo

---

### **FASE 8: ANALYTICS Y ESTADÍSTICAS AVANZADAS**
*Prioridad: MEDIA - Optimización de negocio*

#### 📊 **8.1 Dashboard Analítico**
- Métricas por mozo: tiempo promedio, pedidos atendidos, propinas
- Análisis de mesas unidas: eventos especiales, frecuencia de uso
- Ocupación walk-in vs reservas: optimización de cupos
- Predicciones de demanda usando ML básico

#### 📈 **8.2 Reportes Avanzados**
- Exports PDF/Excel por período
- Comparativas mes anterior, mismo día semana pasada
- Análisis de productos más vendidos por mozo
- ROI de estrategias (mesas unidas, walk-ins)

---

### **FASE 9: SISTEMA DE IMPRESIÓN Y HARDWARE**
*Prioridad: MEDIA - Integración física*

#### 🖨️ **9.1 Integración con Impresoras Térmicas**
- Tickets de cocina automáticos con mozo asignado
- Facturas de cliente con desglose de propinas
- Impresión de reportes de turno y arqueo

#### 📱 **9.2 Optimización Tablet/Touch**
- Gestos para unir mesas (drag & drop)
- Interface de mozos simplificada
- Modo kiosko para dispositivos dedicados

---

## 🏗️ **ARQUITECTURA DE DESARROLLO**

## 🏗️ **ARQUITECTURA UNIFICADA - SIN NUEVAS COLECCIONES**

### **📋 FILOSOFÍA: USAR COLECCIONES EXISTENTES**
**Todas las funcionalidades nuevas se implementan extendiendo las colecciones actuales, NO creando nuevas:**

### **🪑 SISTEMA DE UNIR MESAS** 
**Usando colección `reservas` existente**:

```javascript
// Esquema extendido para reservas unidas:
{
  // ... campos existentes ...
  mesaAsignada: "2+3+4",           // Mesas unidas temporalmente
  esGrupoMesas: true,              // Flag: es grupo de mesas
  mesasIndividuales: [2, 3, 4],   // Array de mesas que componen el grupo
  capacidadTotal: 12,              // Suma de capacidades individuales
  tipoReserva: "grupo_mesas",      // Para filtros y estadísticas
  mesaLider: 2                     // Mesa principal (muestra la info)
}
```

### **👨‍🍳 SISTEMA DE MOZOS POR TURNO**
**Usando colección `reservas` existente**:

```javascript
// Campos adicionales en reservas:
{
  // ... campos existentes ...
  mozosAsignado: "Mateo",          // Nombre del mozo asignado
  mozosId: "mozo1",                // ID interno del mozo (mozo1, mozo2, etc.)
  
  // Configuración de mozos se guarda una sola vez por día:
  fecha: "2025-01-25",
  turno: "mediodia",
  configMozos: {                   // Solo en una reserva "especial" del día
    mozo1: { nombre: "Mateo", activo: true },
    mozo2: { nombre: "Biancu", activo: true },
    mozo3: { nombre: "", activo: false }
  }
}
```

### **🚶‍♂️ SISTEMA WALK-IN DIRECTO**
**Usando colección `reservas` existente**:

```javascript
// Walk-in se crea como reserva normal:
{
  // ... campos normales de reserva ...
  cliente: {
    nombre: "Walk-in Mesa 5",      // Nombre temporal
    telefono: "000-000-0000",      // Placeholder
    email: null
  },
  esWalkIn: true,                  // Flag identificador
  horaLlegada: new Date(),         // Timestamp de llegada directa
  estadoCheckIn: "confirmado",     // Confirmado automáticamente
  mesaReal: 5,                     // Mesa asignada directamente
  mesaAsignada: null               // No hay preasignación
}
```

### **🛠️ SERVICIOS OPTIMIZADOS**:
```
src/shared/services/
├── tableGroupService.js     → Gestión de unión de mesas (extiende reservas)
├── staffManagementService.js → Gestión de mozos (extiende reservas) 
├── walkInService.js         → Walk-in directo (extiende reservas)
└── analyticsService.js      → Métricas usando datos existentes
```

### **🎨 COMPONENTES UI NUEVOS**:
```
src/shared/components/
├── TableGroupManager/       → Interface para unir/separar mesas
├── StaffSelector/          → Configuración de mozos del turno
├── WalkInButton/           → Botón de walk-in directo
└── AnalyticsDashboard/     → Métricas usando reservas + pedidos
```

### **🗃️ COLECCIONES FIREBASE - CERO NUEVAS**:
```
Firestore Collections (SIN CAMBIOS):
├── reservas                 → Extiende campos para todas las funcionalidades
├── pedidos                 → Sistema de pedidos (existente)
├── mesas                   → Estados temporales (existente)
├── clientes                → Base de clientes (existente)
└── lista_espera            → Lista de espera (existente)
```

### **🔄 VENTAJAS DE LA ARQUITECTURA UNIFICADA**:
1. **Cero nuevas colecciones** → Menos complejidad de Firebase
2. **Menos consultas** → Mejor performance
3. **Datos centralizados** → Más fácil de mantener
4. **Costos reducidos** → Menos reads/writes de Firestore
5. **Funcionalidad completa** → Sin perder características

---

## 🎯 **PRIORIDADES DE IMPLEMENTACIÓN**

### **INMEDIATO (1-2 semanas)**:
1. ✅ Sistema de Unir Mesas (Flexibilidad operativa crítica)
2. ✅ Walk-in Directo (Gestión de ocupación real)
3. ✅ Selección Mozos por Turno (Control de personal)

### **CORTO PLAZO (3-4 semanas)**:
4. ✅ Asignación Mozo a Mesa (Responsabilidades claras)
5. ✅ Dashboard Analítico (Optimización de operaciones)
6. ✅ Sistema de Impresión (Integración con hardware)

### **MEDIO PLAZO (1-2 meses)**:
7. ✅ Reportes Avanzados (Business Intelligence)
8. ✅ Optimización Hardware (Tablets dedicados)
9. ✅ Machine Learning (Predicciones de demanda)

---

## 🔧 **PAUTAS DE DESARROLLO OBLIGATORIAS**

### **🎯 FILOSOFÍA DEL SISTEMA**:
- **Flexibilidad Operativa**: El sistema se adapta al restaurante, no al revés
- **Datos en Tiempo Real**: Toda decisión basada en información actualizada
- **Interface Intuitiva**: Mozos y managers sin capacitación técnica
- **Escalabilidad**: Desde 1 turno hasta múltiples sucursales

### **📐 STANDARDS TÉCNICOS**:
```javascript
// ✅ COMPONENTE BIEN ESTRUCTURADO
const TableGroupManager = ({ mesas, onGroupCreate, onGroupDisband }) => {
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [groupMode, setGroupMode] = useState(false);
  
  const handleTableSelection = useCallback((tableId) => {
    setSelectedTables(prev => {
      const newSet = new Set(prev);
      newSet.has(tableId) ? newSet.delete(tableId) : newSet.add(tableId);
      return newSet;
    });
  }, []);
  
  const handleCreateGroup = useCallback(async () => {
    const result = await createTableGroup(Array.from(selectedTables));
    if (result.success) {
      onGroupCreate(result.groupId);
      setSelectedTables(new Set());
      setGroupMode(false);
    }
  }, [selectedTables, onGroupCreate]);
  
  return <JSX />;
};
```

### **🎨 UI/UX PRINCIPLES**:
- **Feedback Visual Inmediato**: Toda acción confirmada visualmente
- **Estados Claros**: Mesa normal/agrupada/walk-in diferenciados
- **Accesos Rápidos**: Máximo 2 clicks para operaciones frecuentes
- **Responsive Design**: Tablets landscape como prioridad

---

## 📋 **TESTING Y VALIDACIÓN**

### **🧪 CASOS DE USO CRÍTICOS**:
1. **Unir Mesas**: Mesa 1 (4p) + Mesa 2 (6p) = 10p capacidad total
2. **Walk-in Rush**: 5 grupos llegando simultáneamente sin reserva
3. **Cambio Mozos**: Mozo se va a mitad de turno, reasignación automática
4. **Eventos Especiales**: Mesa de 12 personas usando 3 mesas unidas

### **📊 MÉTRICAS DE ÉXITO**:
- **Tiempo Promedio Unión Mesa**: < 15 segundos
- **Precisión Walk-in**: 100% de ocupación registrada
- **Adoption Rate Mozos**: 90% del staff usando sistema en 1 semana
- **Error Rate**: < 1% en operaciones críticas

---

## 🚀 **COMANDO PARA NUEVO CHAT**

```
Continúa implementando el Sistema de Gestión Integral de Rosaura - FASE 6.

ESTADO ACTUAL:
✅ Sistema 100% funcional (Fases 1-5 completadas)
✅ Error de crear reserva corregido en AdminRouter.jsx  
✅ Arquitectura modular establecida

PRÓXIMA IMPLEMENTACIÓN:
🎯 FASE 6.1: Sistema de Unir Mesas
- Botón "Unir Mesas" en mapa interactivo
- Selección múltiple con capacidades sumadas
- Estados de mesa extendidos (grouped/group-leader/group-member)
- Nuevo servicio: tableGroupService.js

🎯 FASE 6.2: Walk-in Directo desde Reservas  
- Botón "Agregar Walk-in" en vista reservas
- Check-in automático sin reserva previa
- Cliente temporal con timestamp

DOCUMENTACIÓN: Ver MIGRATION_PLAN.md para arquitectura completa
SERVIDOR: localhost:5173 (npm run dev)

ENFOQUE: Flexibilidad operativa total para distribución de mesas.
```

---

*Plan actualizado: 25/1/2025*  
*Versión: 11.0 - Innovación Operativa*  
*Estado: Listo para implementar Fase 6 - Sistema de Gestión de Mesas Avanzado*
## 🗑️ Migración de campo `id` en pedidos
Para evitar conflictos con el ID nativo de Firestore, se ejecutó un script de una sola vez que elimina el campo `id` en todos los documentos de la colección `pedidos`.

El script está disponible en `scripts/removeOrderIdField.js` y puede ejecutarse con:

```bash
node scripts/removeOrderIdField.js path/to/serviceAccount.json
```

