# 📋 Sistema de Gestión de Reservas - Rosaura Gestión

## 🏗️ Arquitectura General del Proyecto

### Estructura Principal
- **`src/apps/admin/`** - Aplicación administrativa completa
- **`src/apps/client/`** - Aplicación para clientes (reservas públicas)
- **`src/shared/`** - Componentes y servicios compartidos entre apps

### Tecnologías Clave
- **React** con hooks modernos (useState, useCallback, useEffect)
- **Firebase Firestore** para persistencia de datos
- **CSS Modules** para estilos encapsulados
- **React Router** para navegación entre vistas

---

## 🎯 Sistema de Reservas - Flujo Completo

### 1. 📍 Punto de Entrada Principal
**Archivo**: `src/apps/admin/pages/Reservas/Reservas.jsx`

Este es el **centro de control** del sistema de reservas. Maneja:
- Estado global de reservas del día
- Selección de turnos (mediodía/noche)
- Modos de operación (vista, cupos, check-in)
- Coordinación entre componentes

### 2. 🗺️ Mapa Interactivo de Mesas
**Archivo**: `src/shared/components/InteractiveMap/InteractiveMapController.jsx`

**Funcionalidades**:
- Renderizado SVG de mesas del restaurante
- Estados visuales: libre, libre-walkin, reservada, ocupada, bloqueada
- Click handlers para interacción con mesas
- Integración con sistema de estados unificado

**Estados de Mesa**:
- **Verde claro**: Mesa disponible para reservas y walk-ins
- **Verde oscuro**: Mesa disponible solo para walk-ins (bloqueada para reservas)
- **Azul**: Mesa reservada
- **Rojo**: Mesa ocupada
- **Gris**: Mesa bloqueada completamente

### 3. 📱 Sistema de Popups Unificado

#### Popup Principal de Reserva
**Archivo**: `src/apps/admin/pages/Reservas/Reservas.jsx` (líneas ~630-800)

**Funciones**:
- Muestra información completa de la reserva
- Tres botones de acción: Editar, WhatsApp, Cancelar
- Diseño profesional sin emojis
- Cierre por overlay o botón X

**Activación**:
- Click en mesa reservada (azul) en el mapa
- Click en tarjeta de reserva en la lista

### 4. ⚙️ Servicios de Backend

#### Servicio Principal de Reservas
**Archivo**: `src/shared/services/reservationService.js`

**Funciones Clave**:
- `createReservation()` - Creación unificada para admin y cliente
- Validación automática de disponibilidad
- Asignación inteligente de mesas
- Manejo de lista de espera

#### Conexión Firebase
**Archivo**: `src/firebase.js`

**Operaciones CRUD**:
- `saveReservation()` - Crear nueva reserva
- `updateReservation()` - Modificar reserva existente
- `deleteReservation()` - Cancelar reserva
- `getReservations()` - Obtener reservas del día

### 5. 🔄 Estados y Gestión de Mesas

#### Hook de Estados Unificado
**Archivo**: `src/shared/hooks/useTableStates.js`

**Funcionalidades**:
- Calcula estados en tiempo real
- Combina reservas + check-ins + pedidos + bloqueos
- Determina disponibilidad para asignación automática
- Manejo de cupos mínimos para walk-ins

#### Servicio de Gestión de Mesas
**Archivo**: `src/shared/services/tableManagementService.js`

**Responsabilidades**:
- Asignación automática inteligente
- Verificación de disponibilidad
- Cálculo de capacidad vs personas

---

## 🔧 Flujos de Operación

### 📝 Creación de Reserva

**Flujo Admin**:
1. `Reservas.jsx` → Click en "Nueva Reserva"
2. `CreateReservationModal` → Formulario de datos
3. `reservationService.js` → Validación y creación
4. `firebase.js` → Persistencia en Firestore
5. Actualización automática de vista

**Flujo Cliente**:
1. `ClientView.jsx` → Formulario público
2. Mismo servicio unificado
3. Confirmación automática o lista de espera

### ✏️ Modificación de Reserva

**Proceso**:
1. Click en popup → Botón "Editar"
2. `EditReservationModal` → Formulario pre-llenado
3. Validación de nueva disponibilidad
4. Reasignación de mesa si es necesario
5. Actualización en Firebase

### ❌ Cancelación de Reserva

**Flujo Actual** (recientemente corregido):
1. Click en popup → Botón "Cancelar"
2. Modal de confirmación
3. `handleDeleteReservation()` extrae ID correcto
4. `firebase.deleteReservation()` elimina documento
5. Mesa se libera automáticamente

### 📋 Lista de Reservas

**Archivo**: `src/apps/admin/pages/Reservas/components/sections/ReservationsList.jsx`

**Funcionalidades**:
- Vista de tarjetas por turno
- Filtros por estado (pendiente, confirmada, etc.)
- Quick actions: Check-in, Editar, Mesa
- Integración con popup unificado

---

## 🔗 Integraciones del Sistema

### 🍽️ Conexión con Pedidos
**Archivo**: `src/apps/admin/pages/Pedidos/Pedidos.jsx`

**Relación**:
- Las mesas ocupadas por pedidos se marcan en el mapa
- Sistema de reservas respeta mesas con pedidos activos
- Estados se sincronizan en tiempo real

### 📊 Dashboard y Estadísticas
**Archivo**: `src/apps/admin/pages/Dashboard/Dashboard.jsx`

**Métricas**:
- Reservas del día por turno
- Ocupación de mesas en tiempo real
- Links directos a gestión de reservas

### 👥 Gestión de Clientes
**Archivo**: `src/apps/admin/pages/Clients/Clients.jsx`

**Integración**:
- Historial de reservas por cliente
- Edición de reservas desde perfil del cliente
- Blacklist y notas de clientes

---

## 🎛️ Modos de Operación

### 1. Modo Vista (Normal)
- Visualización de estado actual
- Click en mesas abre popup informativo
- Acciones de edición y cancelación

### 2. Modo Cupos
**Archivo**: Botón "Modificar Cupos" en `Reservas.jsx`
- Permite bloquear/desbloquear mesas
- Gestión de cupos mínimos para walk-ins
- Estados visuales diferenciados

### 3. Modo Check-In
- Confirmación de llegada de clientes
- Actualización de estado de reservas
- Transición a estado "ocupada"

---

## 📱 Componentes UI Clave

### Modales Principales
- **`CreateReservationModal/`** - Creación de nuevas reservas
- **`EditReservationModal/`** - Modificación de reservas existentes
- **`ConfirmationModal/`** - Confirmaciones de acciones críticas

### Componentes Compartidos
- **`Button/`** - Botones unificados del sistema
- **`Input/`** - Inputs con validación (incluye PhoneInput)
- **`Modal/`** - Modal base reutilizable
- **`Badge/`** - Estados y etiquetas

---

## 🔧 Estados y Props Importantes

### Props de Reservas.jsx
```
- reservas: Array de reservas del día
- onEditReservation: Handler para edición
- onDeleteReservation: Handler para cancelación
- tableStates: Estados calculados de mesas
- blockedTables: Mesas bloqueadas manualmente
```

### Estados Críticos
```
- reservationPopup: Popup activo (null o {reserva})
- editingReservation: Reserva en edición
- confirmation: Modal de confirmación activo
- turnoSeleccionado: 'mediodia' | 'noche'
- cuposMode: boolean para modo cupos
```

---

## 🔍 Flujo de Datos

### 1. Inicialización
`App.jsx` → Carga datos Firebase → Props a componentes

### 2. Tiempo Real
Firebase listeners → Actualización automática de estados → Re-render

### 3. Acciones de Usuario
Click/Input → Handler local → Servicio → Firebase → Actualización global

---

## 🐛 Problemas Resueltos Recientemente

### ✅ Duplicación de Popups
- **Problema**: Dos sistemas de popup funcionando simultáneamente
- **Solución**: Eliminado popup de `InteractiveMapController.jsx`
- **Resultado**: Un solo popup centralizado en `Reservas.jsx`

### ✅ Error de Cancelación
- **Problema**: "ID de reserva no encontrado"
- **Solución**: Manejo correcto de objeto anidado (`reserva.reserva || reserva`)
- **Resultado**: Cancelaciones funcionando correctamente

### ✅ Estados de Mesa
- **Problema**: Lógica de mesas bloqueadas incorrecta
- **Solución**: Mesas bloqueadas disponibles para walk-ins pero no reservas
- **Resultado**: Cupos mínimos preservados correctamente

---

## 🚀 Áreas de Mejora Identificadas

### 1. Performance
- Optimización de re-renders con React.memo
- Debounce en actualizaciones de estado
- Lazy loading de componentes

### 2. UX/UI
- Animaciones de transición
- Feedback visual mejorado
- Responsive design para tablets

### 3. Funcionalidades
- Notificaciones push para cambios
- Exportación de reportes
- Integración con sistemas de pago

### 4. Código
- TypeScript para mejor type safety
- Testing unitario y de integración
- Documentación JSDoc

---

## 📋 Archivos Clave para Nuevas Mejoras

### Core System
- `src/apps/admin/pages/Reservas/Reservas.jsx` - Centro de control
- `src/shared/services/reservationService.js` - Lógica de negocio
- `src/shared/hooks/useTableStates.js` - Estados unificados

### UI Components
- `src/shared/components/InteractiveMap/InteractiveMapController.jsx` - Mapa
- `src/shared/components/ui/` - Componentes base

### Data Layer
- `src/firebase.js` - Operaciones de base de datos
- `src/App.jsx` - Estado global y providers

Este documento debe ser suficiente para que cualquier desarrollador (o AI assistant) entienda completamente cómo funciona el sistema de reservas y pueda continuar con mejoras específicas. 