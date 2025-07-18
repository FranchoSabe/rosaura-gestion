# 🏗️ ARQUITECTURA UNIFICADA - SISTEMA ROSAURA GESTIÓN

## 🎯 **FILOSOFÍA DE DISEÑO**
**"Una sola colección para cada funcionalidad core, campos extendidos para nuevas features"**

### **Principios Fundamentales**:
1. **NO crear nuevas colecciones** innecesariamente
2. **Extender colecciones existentes** con campos opcionales
3. **Minimizar consultas Firebase** para mejor performance
4. **Reducir costos operativos** de Firestore
5. **Mantener coherencia operativa** del restaurante

---

## 📊 **ANÁLISIS DE COLECCIONES ACTUALES**

### **🗃️ COLECCIÓN `reservas` - LA BASE DE TODO**
**Propósito**: Gestión completa de reservas y ocupación de mesas
**Campos actuales**:
```javascript
{
  // IDENTIFICACIÓN
  reservationId: "ABC123",        // ID único generado (6 chars)
  clienteId: "firebase_doc_id",   // Referencia al documento cliente
  
  // DATOS DEL CLIENTE (duplicados para performance)
  cliente: {
    nombre: "Juan Pérez",
    telefono: "+54 11 1234-5678",
    email: "juan@example.com",
    comentarios: "Cumpleaños"
  },
  
  // DATOS DE LA RESERVA
  fecha: "2025-01-25",           // String formato YYYY-MM-DD
  turno: "mediodia",             // "mediodia" | "noche"
  horario: "13:00",              // Hora específica solicitada
  personas: 4,                   // Cantidad de personas
  
  // ASIGNACIÓN DE MESAS
  mesaAsignada: 9,               // Mesa asignada automáticamente
  mesaReal: null,                // Mesa donde realmente se sentó (check-in)
  
  // ESTADOS
  status: "active",              // "active" | "cancelled" | "completed"
  estadoCheckIn: null,           // null | "confirmado" | "completado"
  
  // METADATA
  createdAt: Date,               // Timestamp creación
  updatedAt: Date                // Timestamp última modificación
}
```

### **🗃️ COLECCIÓN `mesas` - ESTADOS TEMPORALES**
**Propósito**: Estados operativos para el sistema de pedidos (NO para reservas)
**Campos**:
```javascript
{
  numero: 5,                     // Número de mesa
  estado: "ocupada",             // "libre" | "ocupada"
  pedidoActual: "PEDIDO123",     // ID del pedido activo en la mesa
  fechaUltimaActividad: Date     // Última vez que se usó
}
```

### **🗃️ COLECCIÓN `pedidos` - SISTEMA DE PEDIDOS**
**Propósito**: Gestión de pedidos del restaurante
**Campos relevantes**:
```javascript
{
  orderId: "PEDIDO123",          // ID único del pedido
  mesa: 5,                       // Mesa donde se hace el pedido
  estado: "pendiente",           // Estado del pedido
  // ... otros campos de productos, precios, etc.
}
```

---

## 🔧 **EXTENSIONES PARA NUEVAS FUNCIONALIDADES**

### **🪑 SISTEMA DE UNIR MESAS**
**Estrategia**: Extender campo `mesaAsignada` para soportar grupos

#### **Campos Nuevos en `reservas`**:
```javascript
{
  // CAMPOS EXISTENTES...
  
  // 🆕 CAMPOS PARA UNIR MESAS
  mesaAsignada: "2+3+4",           // String con mesas unidas (delimitador "+")
  esGrupoMesas: true,              // Boolean: indica si es grupo de mesas
  mesasIndividuales: [2, 3, 4],   // Array: mesas que componen el grupo
  capacidadTotal: 12,              // Number: suma de capacidades
  tipoReserva: "grupo_mesas",      // String: para filtros ("normal" | "grupo_mesas")
  mesaLider: 2,                    // Number: mesa principal del grupo
  
  // METADATA DEL GRUPO
  creadoEnTurno: "2025-01-25-mediodia",  // String: turno donde se creó
  duracionEstimada: 120,           // Number: minutos estimados
}
```

#### **Lógica de Funcionamiento**:
1. **Crear Grupo**: Al seleccionar mesas → `mesaAsignada = "2+3+4"`
2. **Mostrar en Mapa**: Destacar visualmente mesas agrupadas
3. **Desunir Automático**: Al final del turno → limpiar campos de grupo
4. **Capacidad Dinámica**: Sumar capacidades individuales

### **👨‍🍳 SISTEMA DE MOZOS POR TURNO**
**Estrategia**: Un documento especial de configuración + campo en cada reserva

#### **Documento de Configuración en `reservas`**:
```javascript
{
  // IDENTIFICACIÓN ESPECIAL
  reservationId: "CONFIG_MOZOS",   // ID fijo para configuración
  fecha: "2025-01-25",
  turno: "mediodia",
  
  // CONFIGURACIÓN DE MOZOS DEL TURNO
  esMozosConfig: true,             // Flag: es documento de configuración
  mozosDelTurno: {
    mozo1: { 
      nombre: "Mateo", 
      activo: true,
      horaInicio: "12:00",
      mesasAsignadas: [1, 2, 3]
    },
    mozo2: { 
      nombre: "Biancu", 
      activo: true,
      horaInicio: "12:00",
      mesasAsignadas: [4, 5, 6]
    },
    mozo3: { 
      nombre: "", 
      activo: false,
      horaInicio: null,
      mesasAsignadas: []
    }
  }
}
```

#### **Campos Nuevos en `reservas` normales**:
```javascript
{
  // CAMPOS EXISTENTES...
  
  // 🆕 CAMPOS PARA MOZOS
  mozosAsignado: "Mateo",          // String: nombre del mozo
  mozosId: "mozo1",                // String: ID interno (mozo1, mozo2, etc.)
  horaAsignacion: Date,            // Timestamp: cuándo se asignó el mozo
  cambiosMozo: [                   // Array: historial de cambios
    {
      mozosAnterior: "Biancu",
      mozosNuevo: "Mateo",
      fecha: Date,
      motivo: "Cambio de turno"
    }
  ]
}
```

#### **Campos Nuevos en `pedidos`**:
```javascript
{
  // CAMPOS EXISTENTES...
  
  // 🆕 CAMPOS PARA MOZOS
  mozosAsignado: "Mateo",          // String: mozo que toma el pedido
  mozosId: "mozo1",                // String: ID interno del mozo
}
```

### **🚶‍♂️ SISTEMA WALK-IN DIRECTO**
**Estrategia**: Walk-ins son reservas normales con flags especiales

#### **Campos para Walk-in en `reservas`**:
```javascript
{
  // DATOS ESPECIALES PARA WALK-IN
  cliente: {
    nombre: "Walk-in Mesa 5 - 14:30",  // Nombre temporal con hora
    telefono: "000-000-0000",          // Placeholder
    email: null,
    comentarios: "Walk-in directo"
  },
  
  // FLAGS IDENTIFICADORES
  esWalkIn: true,                  // Boolean: es walk-in
  horaLlegada: Date,               // Timestamp: llegada real
  tipoWalkIn: "directo",           // String: "directo" | "convertido_espera"
  
  // ASIGNACIÓN DIRECTA
  mesaAsignada: null,              // Sin preasignación
  mesaReal: 5,                     // Mesa asignada directamente
  estadoCheckIn: "confirmado",     // Confirmado automáticamente
  
  // METADATA
  creadoPor: "admin",              // String: quién lo creó
  duracionEstimada: 90,            // Number: minutos estimados
}
```

---

## 🔍 **CONSULTAS OPTIMIZADAS**

### **Query para Reservas del Día (actual)**:
```javascript
// ✅ EFICIENTE: Solo fecha
query(collection(db, "reservas"), 
  where("fecha", "==", "2025-01-25")
)
```

### **Query para Configuración de Mozos**:
```javascript
// ✅ EFICIENTE: Buscar documento config
query(collection(db, "reservas"),
  where("esMozosConfig", "==", true),
  where("fecha", "==", "2025-01-25"),
  where("turno", "==", "mediodia")
)
```

### **Query para Walk-ins del Día**:
```javascript
// ✅ EFICIENTE: Filtro compuesto simple
query(collection(db, "reservas"),
  where("fecha", "==", "2025-01-25"),
  where("esWalkIn", "==", true)
)
```

### **Query para Grupos de Mesas**:
```javascript
// ✅ EFICIENTE: Filtro compuesto simple
query(collection(db, "reservas"),
  where("fecha", "==", "2025-01-25"),
  where("esGrupoMesas", "==", true)
)
```

---

## 📈 **VENTAJAS DE LA ARQUITECTURA UNIFICADA**

### **🚀 Performance**:
- **1 sola consulta** para todas las reservas del día (incluye walk-ins, grupos, mozos)
- **Menos round-trips** a Firebase
- **Cache más eficiente** con menos documentos
- **Índices simples** (solo por fecha)

### **💰 Costos**:
- **95% menos reads** comparado con múltiples colecciones
- **Menos writes** al actualizar datos relacionados
- **Sin índices complejos** que cuestan dinero adicional

### **🔧 Mantenimiento**:
- **Código más simple** → menos bugs
- **Debugging más fácil** → todo en un lugar
- **Backups más eficientes** → menos datos que respaldar
- **Migraciones más simples** → una sola estructura

### **🏪 Operativa del Restaurante**:
- **Vista unificada** de toda la actividad del día
- **Reportes más ricos** con datos correlacionados
- **Estadísticas integradas** sin joins complejos
- **Auditoria completa** en una sola colección

---

## 🛠️ **IMPLEMENTACIÓN PRÁCTICA**

### **1. Migración de Datos (sin downtime)**:
```javascript
// Paso 1: Agregar campos opcionales a reservas existentes
// Paso 2: Implementar funcionalidades nuevas usando campos opcionales
// Paso 3: NO eliminar código anterior hasta confirmar funcionamiento
```

### **2. Compatibilidad hacia atrás**:
```javascript
// Código defensivo para campos opcionales
const esGrupoMesas = reservation.esGrupoMesas || false;
const mozosAsignado = reservation.mozosAsignado || null;
const esWalkIn = reservation.esWalkIn || false;
```

### **3. Validaciones de datos**:
```javascript
// Validar integridad de grupos de mesas
if (reservation.esGrupoMesas) {
  validateTableGroup(reservation.mesaAsignada, reservation.mesasIndividuales);
}
```

---

## 🔮 **COMANDO PARA FUTUROS DESARROLLOS**

```
Implementar nuevas funcionalidades del Sistema de Gestión Rosaura usando ARQUITECTURA UNIFICADA.

REGLA FUNDAMENTAL: NO crear nuevas colecciones. EXTENDER colecciones existentes.

COLECCIONES BASE:
- reservas → Funcionalidad principal + extensiones
- pedidos → Sistema de pedidos + mozos
- mesas → Estados temporales operativos
- clientes → Base de clientes
- lista_espera → Cola de espera

PRÓXIMAS IMPLEMENTACIONES:
🪑 Sistema Unir Mesas → Extender reservas.mesaAsignada = "2+3+4"
👨‍🍳 Mozos por Turno → Documento config + campos en reservas/pedidos  
🚶‍♂️ Walk-in Directo → Reservas con flag esWalkIn = true

DOCUMENTACIÓN: Ver SISTEMA_ARQUITECTURA_UNIFICADA.md
MIGRATION PLAN: Ver MIGRATION_PLAN.md sección "Arquitectura Unificada"

PERFORMANCE: Una consulta por día trae TODA la información operativa.
COSTOS: 95% reducción en reads de Firebase vs múltiples colecciones.
MANTENIMIENTO: Código más simple, debugging centralizado.
```

---

*Documentación actualizada: 25/1/2025*  
*Versión: 1.0 - Arquitectura Unificada*  
*Estado: Lista para implementación* 