# 📋 PLAN DE MIGRACIÓN COMPLETO - ROSAURA RESERVAS

## 🎯 OBJETIVO PRINCIPAL
Refactorizar el sistema monolítico actual hacia una **arquitectura modular escalable** para crear un **software de reservas reutilizable** para múltiples restaurantes.

---

## 📊 ANÁLISIS DE SITUACIÓN ACTUAL

### Problemas Identificados:
- **AdminView.jsx**: 3,583 líneas (inmanejable)
- **App.jsx**: 785 líneas con toda la lógica de estado
- **Router básico**: Todo va a una sola ruta
- **Código acoplado**: Difícil de personalizar para otros restaurantes
- **Sin separación**: Admin y cliente mezclados

### Funcionalidades Críticas a Preservar:
1. **Sistema de reservas** completo
2. **Mapa interactivo** de mesas
3. **Auto-asignación** de mesas con reglas complejas
4. **Lista de espera** funcional
5. **Gestión de clientes** y blacklist
6. **Validaciones** de teléfono/WhatsApp
7. **Cupos walk-in** dinámicos
8. **Autenticación** admin/cliente

---

## 🏗️ ARQUITECTURA OBJETIVO FINAL

```
rosaura-reservas/
├── public/
├── src/
│   ├── apps/                          # 🔥 APLICACIONES SEPARADAS
│   │   ├── admin/                     # Panel de administración
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard/         # Vista principal (mapa + reservas hoy)
│   │   │   │   │   ├── Dashboard.jsx
│   │   │   │   │   ├── Dashboard.module.css
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── TodayView.jsx
│   │   │   │   │   │   ├── MapSection.jsx
│   │   │   │   │   │   └── ReservationsSection.jsx
│   │   │   │   │   └── hooks/
│   │   │   │   │       └── useDashboard.js
│   │   │   │   │
│   │   │   │   ├── Panorama/          # Vista a futuro
│   │   │   │   │   ├── Panorama.jsx
│   │   │   │   │   ├── Panorama.module.css
│   │   │   │   │   └── components/
│   │   │   │   │       ├── WeekView.jsx
│   │   │   │   │       └── DayCard.jsx
│   │   │   │   │
│   │   │   │   ├── Clients/           # Gestión de clientes
│   │   │   │   │   ├── Clients.jsx
│   │   │   │   │   ├── Clients.module.css
│   │   │   │   │   └── components/
│   │   │   │   │       ├── ClientsList.jsx
│   │   │   │   │       ├── ClientStats.jsx
│   │   │   │   │       └── BlacklistManager.jsx
│   │   │   │   │
│   │   │   │   ├── WaitingList/       # Lista de espera
│   │   │   │   │   ├── WaitingList.jsx
│   │   │   │   │   └── components/
│   │   │   │   │       └── WaitingCard.jsx
│   │   │   │   │
│   │   │   │   └── Reports/           # Analytics (futuro)
│   │   │   │       └── Reports.jsx
│   │   │   │
│   │   │   ├── components/            # Componentes específicos admin
│   │   │   │   ├── AdminHeader.jsx
│   │   │   │   ├── AdminSidebar.jsx
│   │   │   │   └── AdminLayout.jsx
│   │   │   │
│   │   │   ├── layout/                # Layout común admin
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   └── AdminLayout.module.css
│   │   │   │
│   │   │   └── hooks/                 # Hooks específicos admin
│   │       └── useAdminAuth.js
│   │
│   │   └── client/                    # Vista del cliente público
│   │       ├── pages/
│   │       │   ├── Home/              # Landing page
│   │       │   ├── Booking/           # Hacer reserva
│   │       │   ├── Search/            # Buscar reserva
│   │       │   └── Confirmation/      # Confirmación
│   │       │
│   │       ├── components/            # Componentes específicos cliente
│   │       └── layout/                # Layout cliente
│   │
│   ├── shared/                        # 🔥 CÓDIGO REUTILIZABLE
│   │   ├── components/
│   │   │   ├── InteractiveMap/        # Mapa de mesas
│   │   │   │   ├── InteractiveMapController.jsx
│   │   │   │   ├── InteractiveMapController.module.css
│   │   │   │   └── components/
│   │   │   │       ├── TableElement.jsx
│   │   │   │       └── ReservationPopup.jsx
│   │   │   │
│   │   │   ├── forms/                 # Formularios reutilizables
│   │   │   │   ├── ReservationForm/
│   │   │   │   └── ClientForm/
│   │   │   │
│   │   │   ├── modals/                # Modales reutilizables
│   │   │   │   ├── CreateReservationModal/
│   │   │   │   └── EditReservationModal/
│   │   │   │
│   │   │   └── ui/                    # Componentes UI básicos
│   │   │       ├── Button/
│   │   │       ├── Input/
│   │   │       ├── Modal/
│   │   │       └── Badge/
│   │   │
│   │   ├── hooks/                     # Lógica reutilizable
│   │   │   ├── useReservations.js     # CRUD reservas
│   │   │   ├── useAuth.js             # Autenticación
│   │   │   ├── useTableLogic.js       # Lógica de mesas/asignación
│   │   │   ├── useWaitingList.js      # Lista de espera
│   │   │   ├── useClients.js          # Gestión clientes
│   │   │   └── useNotifications.js    # Sistema notificaciones
│   │   │
│   │   ├── utils/                     # Utilidades puras
│   │   │   ├── validation.js          # Validaciones (MANTENER)
│   │   │   ├── mesaLogic.js           # Reglas de mesas (MANTENER)
│   │   │   ├── tablesLayout.js        # Layout mesas (MANTENER)
│   │   │   ├── phoneUtils.js          # Utilidades teléfono
│   │   │   ├── dateHelpers.js         # Fechas y horarios
│   │   │   └── index.js               # Exports centralizados
│   │   │
│   │   ├── services/                  # Servicios externos
│   │   │   ├── firebase.js            # Base de datos (MANTENER)
│   │   │   ├── whatsapp.js            # Integración WhatsApp
│   │   │   └── analytics.js           # Tracking (futuro)
│   │   │
│   │   ├── contexts/                  # Context API
│   │   │   ├── AuthContext.js         # Estado autenticación
│   │   │   ├── ReservationsContext.js # Estado reservas
│   │   │   └── NotificationsContext.js# Notificaciones globales
│   │   │
│   │   └── constants/                 # Constantes globales
│   │       ├── routes.js              # Rutas de la app
│   │       ├── api.js                 # URLs API
│   │       └── ui.js                  # Constantes UI
│   │
│   ├── config/                        # 🔥 CONFIGURACIÓN POR RESTAURANTE
│   │   ├── restaurant.config.js       # Datos específicos
│   │   ├── tables.config.js           # Layout mesas personalizable
│   │   ├── business.config.js         # Horarios, reglas negocio
│   │   └── theme.config.js            # Colores, tipografía
│   │
│   ├── router/                        # Sistema de rutas
│   │   ├── AppRouter.jsx              # Router principal
│   │   ├── AdminRouter.jsx            # Rutas admin
│   │   ├── ClientRouter.jsx           # Rutas cliente
│   │   └── PrivateRoute.jsx           # Protección rutas
│   │
│   └── App.jsx                        # App principal simplificada
│
├── package.json
└── README.md
```

---

## 🚀 PLAN DE MIGRACIÓN DETALLADO

### **ESTRATEGIA RECOMENDADA: MIGRACIÓN COMPONENTE POR COMPONENTE**

**¿Por qué componente por componente?**
- ✅ **Más seguro**: Menor riesgo de romper funcionalidad
- ✅ **Testing incremental**: Verificar después de cada cambio
- ✅ **Progreso visible**: Ver mejoras inmediatamente
- ✅ **Fácil debugging**: Si algo falla, sabemos exactamente qué
- ✅ **Menos abrumador**: Pasos pequeños y manejables

---

## **FASE 1: PREPARACIÓN Y ESTRUCTURA BASE (2 semanas)**

### **Semana 1: Backup y Configuración Base**
**Status: ⏳ PENDIENTE**

#### **Tareas:**
1. **Crear backup branch**:
   ```bash
   git checkout -b backup-original
   git push origin backup-original
   git checkout main
   ```

2. **Crear estructura de carpetas**:
   - [ ] `src/apps/admin/`
   - [ ] `src/apps/client/`
   - [ ] `src/shared/components/`
   - [ ] `src/shared/hooks/`
   - [ ] `src/shared/utils/`
   - [ ] `src/shared/services/`
   - [ ] `src/shared/contexts/`
   - [ ] `src/config/`
   - [ ] `src/router/`

3. **Configurar router básico**:
   - [ ] Crear `AppRouter.jsx` con rutas `/admin/*` y `/client/*`
   - [ ] Modificar `App.jsx` para usar el nuevo router

#### **Testing después de Semana 1:**
- [ ] La página carga sin errores
- [ ] Las rutas `/admin` y `/client` funcionan
- [ ] No se perdió funcionalidad existente

### **Semana 2: Context API y Auth**
**Status: ⏳ PENDIENTE**

#### **Tareas:**
1. **Crear AuthContext**:
   - [ ] `src/shared/contexts/AuthContext.js`
   - [ ] Mover lógica de login/logout de `App.jsx`

2. **Mover LoginView**:
   - [ ] `src/shared/components/LoginView/`
   - [ ] Integrar con AuthContext

#### **Testing después de Semana 2:**
- [ ] Login funciona correctamente
- [ ] Logout funciona correctamente
- [ ] Estado de autenticación se preserva

---

## **FASE 2: SEPARAR APLICACIONES (4 semanas)**

### **Semana 3: Extraer Dashboard (Componente más importante)**
**Status: ⏳ PENDIENTE**

#### **Componente objetivo**: Vista "HOY" del AdminView (TodayView)

#### **Tareas:**
1. **Crear página Dashboard**:
   - [ ] `src/apps/admin/pages/Dashboard/Dashboard.jsx`
   - [ ] `src/apps/admin/pages/Dashboard/Dashboard.module.css`

2. **Extraer sub-componentes**:
   - [ ] `MapSection.jsx` - Sección del mapa
   - [ ] `ReservationsSection.jsx` - Lista de reservas
   - [ ] `TodayControls.jsx` - Controles de fecha/turno

3. **Mover InteractiveMapController**:
   - [ ] `src/shared/components/InteractiveMap/`
   - [ ] Mantener todas las props y funcionalidad

#### **Testing después de Semana 3:**
- [ ] Vista "HOY" funciona idéntica a antes
- [ ] Mapa interactivo funciona correctamente
- [ ] Auto-asignación de mesas funciona
- [ ] Validaciones funcionan
- [ ] Cupos walk-in se calculan bien

### **Semana 4: Extraer Panorama**
**Status: ⏳ PENDIENTE**

#### **Componente objetivo**: Vista "PANORAMA" del AdminView (PanoramaView)

#### **Tareas:**
1. **Crear página Panorama**:
   - [ ] `src/apps/admin/pages/Panorama/Panorama.jsx`
   - [ ] `src/apps/admin/pages/Panorama/Panorama.module.css`

2. **Extraer sub-componentes**:
   - [ ] `WeekView.jsx` - Vista semanal
   - [ ] `DayCard.jsx` - Tarjeta de día individual

#### **Testing después de Semana 4:**
- [ ] Vista panorama muestra datos correctos
- [ ] Navegación entre días funciona
- [ ] Estadísticas se calculan bien

### **Semana 5: Extraer Clients**
**Status: ⏳ PENDIENTE**

#### **Componente objetivo**: Vista "CLIENTES" del AdminView (ClientsView)

#### **Tareas:**
1. **Crear página Clients**:
   - [ ] `src/apps/admin/pages/Clients/Clients.jsx`
   - [ ] `src/apps/admin/pages/Clients/Clients.module.css`

2. **Extraer sub-componentes**:
   - [ ] `ClientsList.jsx` - Lista de clientes
   - [ ] `BlacklistManager.jsx` - Gestión blacklist

#### **Testing después de Semana 5:**
- [ ] Lista de clientes funciona
- [ ] Blacklist funciona correctamente
- [ ] Búsqueda y filtros funcionan

### **Semana 6: Extraer WaitingList**
**Status: ⏳ PENDIENTE**

#### **Componente objetivo**: Vista "LISTA DE ESPERA" del AdminView (WaitingListView)

#### **Tareas:**
1. **Crear página WaitingList**:
   - [ ] `src/apps/admin/pages/WaitingList/WaitingList.jsx`

2. **Extraer sub-componentes**:
   - [ ] `WaitingCard.jsx` - Tarjeta de espera individual

#### **Testing después de Semana 6:**
- [ ] Lista de espera funciona
- [ ] Confirmación de reservas funciona
- [ ] Rechazo de reservas funciona
- [ ] Notificaciones WhatsApp funcionan

---

## **FASE 3: EXTRAER LÓGICA COMPARTIDA (3 semanas)**

### **Semana 7: Custom Hooks**
**Status: ⏳ PENDIENTE**

#### **Tareas:**
1. **Crear hooks reutilizables**:
   - [ ] `useReservations.js` - CRUD reservas
   - [ ] `useAuth.js` - Autenticación
   - [ ] `useTableLogic.js` - Lógica mesas
   - [ ] `useWaitingList.js` - Lista espera

#### **Testing después de Semana 7:**
- [ ] Todas las operaciones CRUD funcionan
- [ ] Lógica de mesas preservada
- [ ] No hay regresiones

### **Semana 8: Componentes Compartidos**
**Status: ⏳ PENDIENTE**

#### **Tareas:**
1. **Mover modales a shared**:
   - [ ] `CreateReservationModal/`
   - [ ] `EditReservationModal/`

2. **Crear componentes UI básicos**:
   - [ ] `Button/`
   - [ ] `Input/`
   - [ ] `Modal/`

### **Semana 9: Client App**
**Status: ⏳ PENDIENTE**

#### **Tareas:**
1. **Crear aplicación cliente**:
   - [ ] Extraer `ClientView.jsx`
   - [ ] Crear páginas separadas (Home, Booking, Search)

---

## **FASE 4: CONFIGURACIÓN Y OPTIMIZACIÓN (2 semanas)**

### **Semana 10: Sistema de Configuración**
**Status: ⏳ PENDIENTE**

#### **Tareas:**
1. **Crear archivos de configuración**:
   - [ ] `restaurant.config.js`
   - [ ] `tables.config.js`
   - [ ] `business.config.js`

### **Semana 11: Testing Final y Documentación**
**Status: ⏳ PENDIENTE**

---

## ⚠️ REGLAS CRÍTICAS DE MIGRACIÓN

### **NUNCA MODIFICAR:**
1. **`src/utils/mesaLogic.js`**: Lógica de asignación de mesas
2. **`src/utils/tablesLayout.js`**: Configuración de layout de mesas
3. **`src/utils/validation.js`**: Validaciones de teléfono y datos
4. **`src/firebase.js`**: Conexiones y estructura de datos
5. **Algoritmo de auto-asignación**: Orden de prioridades

### **SIEMPRE PRESERVAR:**
1. **Funcionalidad completa** antes de refactorizar
2. **Estados de mesas**: Available, occupied, blocked, hovered
3. **Validaciones de teléfono**: Códigos de país y WhatsApp
4. **Sistema de notificaciones**: Success, error, warning
5. **Autenticación**: Login admin/cliente

### **PATRONES A SEGUIR:**
1. **Un archivo por página**: Máximo 300 líneas por componente
2. **Separación de responsabilidades**: UI, lógica, estado
3. **Naming consistency**: PascalCase componentes, camelCase funciones
4. **Props tipadas**: Documentar todas las props
5. **Error handling**: Siempre manejar errores de async

---

## ✅ CHECKLIST DE VALIDACIÓN

### **Antes de cualquier cambio:**
- [ ] ¿Preserva toda la funcionalidad existente?
- [ ] ¿Sigue la estructura de carpetas definida?
- [ ] ¿Respeta las reglas críticas de "NUNCA MODIFICAR"?
- [ ] ¿El componente tiene menos de 300 líneas?
- [ ] ¿Está separada la UI de la lógica?
- [ ] ¿Las props están documentadas?
- [ ] ¿Maneja errores correctamente?
- [ ] ¿Es reutilizable para otros restaurantes?

### **Después de cualquier cambio:**
- [ ] ¿La página carga sin errores?
- [ ] ¿El mapa de mesas funciona igual que antes?
- [ ] ¿Las reservas se crean/editan/eliminan correctamente?
- [ ] ¿Las validaciones de teléfono funcionan?
- [ ] ¿La autenticación sigue funcionando?
- [ ] ¿Los cupos walk-in se calculan correctamente?
- [ ] ¿Las notificaciones funcionan?

---

## 📈 PROGRESO ACTUAL

### **COMPLETADO:**
- ✅ Plan de migración definido
- ✅ Arquitectura objetivo definida

### **EN PROGRESO:**
- ⏳ FASE 1 - Preparación

### **PRÓXIMOS PASOS:**
1. Crear backup branch
2. Crear estructura de carpetas
3. Configurar router básico

---

## 📝 NOTAS Y DECISIONES

### **Decisiones Arquitectónicas:**
- **Componente por componente**: Más seguro que migración por fases completas
- **Context API**: Elegido sobre Redux por simplicidad
- **CSS Modules**: Mantener consistencia con código actual
- **Git flow**: Main con commits frecuentes, backup branch para seguridad

### **Para el futuro:**
- **Multi-tenant**: Preparado para múltiples restaurantes
- **Analytics**: Base preparada para reportes
- **Mobile**: Estructura compatible con React Native
- **POS Integration**: Hooks preparados para integraciones externas

---

**Última actualización**: [Fecha]
**Próxima revisión**: [Fecha] 