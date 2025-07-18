import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminLayout from '../apps/admin/layout/AdminLayout';
import Dashboard from '../apps/admin/pages/Dashboard/Dashboard';

import Clients from '../apps/admin/pages/Clients/Clients';
import WaitingList from '../apps/admin/pages/WaitingList/WaitingList';
// Nuevas páginas del Sistema de Gestión Integral
import Reservas from '../apps/admin/pages/Reservas/Reservas';
import Menu from '../apps/admin/pages/Menu/Menu';
import Pedidos from '../apps/admin/pages/Pedidos/Pedidos';
import Proveedores from '../apps/admin/pages/Proveedores/Proveedores';
import Ventas from '../apps/admin/pages/Ventas/Ventas';
import Empleados from '../apps/admin/pages/Empleados/Empleados';
import Configuracion from '../apps/admin/pages/Configuracion/Configuracion';

/**
 * Router para la aplicación de administración
 * 
 * SISTEMA DE GESTIÓN INTEGRAL:
 * ✅ /admin/dashboard -> Dashboard.jsx (Vista principal con resumen)
 * ✅ /admin/reservas -> Reservas.jsx (Gestión de reservas)
 * ✅ /admin/clients -> Clients.jsx (Gestión de clientes)
 * ✅ /admin/menu -> Menu.jsx (Gestión de menú)
 * ✅ /admin/pedidos -> Pedidos.jsx (Gestión de pedidos)
 * ✅ /admin/proveedores -> Proveedores.jsx (Gestión de proveedores)
 * ✅ /admin/ventas -> Ventas.jsx (Estadísticas de ventas)
 * ✅ /admin/empleados -> Empleados.jsx (Gestión de empleados)
 * ✅ /admin/configuracion -> Configuracion.jsx (Configuración del sistema)
 * 
 * RUTAS LEGACY (compatibilidad):
 * ✅ /admin/panorama -> Redirige a /admin/reservas (Panorama integrado en Reservas)
 * ✅ /admin/waiting-list -> WaitingList.jsx (Lista de espera - redirige a dashboard)
 */
const AdminRouter = (props) => {
  return (
    <PrivateRoute auth={props.auth}>
      <AdminLayout 
        auth={props.auth} 
        onLogout={props.onLogout}
        // Props para CreateReservationModal global
        onCreateReservation={props.onSaveReservation}
        getAvailableSlots={props.getAvailableSlots}
        isValidDate={props.isValidDate}
        HORARIOS={props.HORARIOS}
        showNotification={props.showNotification}
      >
        <Routes>
          {/* Ruta dashboard - nueva página modular */}
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                // Props de datos
                reservations={props.data?.reservas || []}
                waitingList={props.data?.waitingList || []}
                
                // Props de acciones sobre reservas
                onSetBlacklist={props.onSetBlacklist}
                onUpdateReservation={props.onUpdateReservation}
                onDeleteReservation={props.onDeleteReservation}
                
                // Props de acciones sobre lista de espera
                onConfirmWaitingReservation={props.onConfirmWaitingReservation}
                onDeleteWaitingReservation={props.onDeleteWaitingReservation}
                onMarkAsNotified={props.onMarkAsNotified}
                onContactWaitingClient={props.onContactWaitingClient}
                onRejectWaitingReservation={props.onRejectWaitingReservation}
                
                // Props de utilidades
                getAvailableSlotsForEdit={props.getAvailableSlotsForEdit}
                getAvailableSlots={props.getAvailableSlots}
                isValidDate={props.isValidDate}
                HORARIOS={props.HORARIOS}
                formatDate={props.formatDate}
                
                // Props de estado de edición
                editingReservation={props.editingReservation}
                setEditingReservation={props.setEditingReservation}
                
                // Props de mesas bloqueadas
                onSaveBlockedTables={props.onSaveBlockedTables}
                onLoadBlockedTables={props.onLoadBlockedTables}
                
                // Props de notificaciones globales - AÑADIDO
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta panorama - redirige a reservas (integrado) */}
          <Route 
            path="/panorama" 
            element={<Navigate to="/admin/reservas" replace />}
          />
          
          {/* Ruta reservas - nueva página modular */}
          <Route 
            path="/reservas" 
            element={
              <Reservas 
                // Props de datos
                reservations={props.data?.reservas || []}
                waitingList={props.data?.waitingList || []}
                
                // Props de acciones sobre reservas
                onSetBlacklist={props.onSetBlacklist}
                onUpdateReservation={props.onUpdateReservation}
                onDeleteReservation={props.onDeleteReservation}
                onCreateReservation={props.onSaveReservation}
                
                // Props de acciones sobre lista de espera
                onConfirmWaitingReservation={props.onConfirmWaitingReservation}
                onDeleteWaitingReservation={props.onDeleteWaitingReservation}
                onMarkAsNotified={props.onMarkAsNotified}
                onContactWaitingClient={props.onContactWaitingClient}
                onRejectWaitingReservation={props.onRejectWaitingReservation}
                
                // Props de utilidades
                getAvailableSlotsForEdit={props.getAvailableSlotsForEdit}
                getAvailableSlots={props.getAvailableSlots}
                isValidDate={props.isValidDate}
                HORARIOS={props.HORARIOS}
                formatDate={props.formatDate}
                
                // Props de estado de edición
                editingReservation={props.editingReservation}
                setEditingReservation={props.setEditingReservation}
                
                // Props de mesas bloqueadas
                onSaveBlockedTables={props.onSaveBlockedTables}
                onLoadBlockedTables={props.onLoadBlockedTables}
                
                // Props de notificaciones globales
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta clients - nueva página modular */}
          <Route 
            path="/clients" 
            element={
              <Clients 
                // Props de datos
                clients={props.data?.clientes || []}
                reservations={props.data?.reservas || []}
                
                // Props de acciones
                onSetBlacklist={props.onSetBlacklist}
                onUpdateClientNotes={props.onUpdateClientNotes}
                onUpdateReservation={props.onUpdateReservation}
                
                // Props de utilidades para edición de reservas
                getAvailableSlotsForEdit={props.getAvailableSlotsForEdit}
                isValidDate={props.isValidDate}
                HORARIOS={props.HORARIOS}
                
                // Props de notificaciones globales
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta menu - nueva página modular */}
          <Route 
            path="/menu" 
            element={
              <Menu 
                // Props de notificaciones globales
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta pedidos - nueva página modular */}
          <Route 
            path="/pedidos" 
            element={
              <Pedidos 
                // Props de notificaciones globales
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta proveedores - nueva página modular */}
          <Route 
            path="/proveedores" 
            element={
              <Proveedores 
                // Props de autenticación
                auth={props.auth}
                // Props de notificaciones globales
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta ventas - nueva página modular */}
          <Route 
            path="/ventas" 
            element={
              <Ventas 
                // Props de datos
                reservations={props.data?.reservas || []}
                
                // Props de utilidades
                formatDate={props.formatDate}
                
                // Props de notificaciones globales
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta empleados - nueva página modular */}
          <Route 
            path="/empleados" 
            element={
              <Empleados 
                // Props de notificaciones globales
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta configuracion - nueva página modular */}
          <Route 
            path="/configuracion" 
            element={
              <Configuracion 
                // Props de notificaciones globales
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta waiting-list - nueva página modular */}
          <Route 
            path="/waiting-list" 
            element={
              <WaitingList 
                // Props de datos
                waitingList={props.data?.waitingList || []}
                reservations={props.data?.reservas || []}
                clients={props.data?.clientes || []}
                
                // Props de acciones sobre lista de espera
                onConfirmWaitingReservation={props.onConfirmWaitingReservation}
                onDeleteWaitingReservation={props.onDeleteWaitingReservation}
                onContactWaitingClient={props.onContactWaitingClient}
                onRejectWaitingReservation={props.onRejectWaitingReservation}
                
                // Props de utilidades
                getAvailableSlots={props.getAvailableSlots}
                formatDate={props.formatDate}
                HORARIOS={props.HORARIOS}
                
                // Props de notificaciones globales
                showNotification={props.showNotification}
                showConfirmation={props.showConfirmation}
              />
            } 
          />
          
          {/* Ruta principal redirige a dashboard */}
          <Route 
            path="/" 
            element={<Navigate to="/admin/dashboard" replace />} 
          />
          

          
          {/* Catch-all redirige a dashboard */}
          <Route 
            path="*" 
            element={<Navigate to="/admin/dashboard" replace />} 
          />
        </Routes>
      </AdminLayout>
    </PrivateRoute>
  );
};

export default AdminRouter; 