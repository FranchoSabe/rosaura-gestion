import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminLayout from '../apps/admin/layout/AdminLayout';
import Dashboard from '../apps/admin/pages/Dashboard/Dashboard';
import Panorama from '../apps/admin/pages/Panorama/Panorama';
import Clients from '../apps/admin/pages/Clients/Clients';
import WaitingList from '../apps/admin/pages/WaitingList/WaitingList';

/**
 * Router para la aplicación de administración
 * 
 * MIGRACIÓN COMPLETADA ✅:
 * ✅ /admin/dashboard -> Dashboard.jsx (Vista "HOY" migrada)
 * ✅ /admin/panorama -> Panorama.jsx (Vista "PANORAMA" migrada)
 * ✅ /admin/clients -> Clients.jsx (Vista "CLIENTES" migrada)
 * ✅ /admin/waiting-list -> WaitingList.jsx (Vista "LISTA DE ESPERA" migrada)
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
          
          {/* Ruta panorama - nueva página modular */}
          <Route 
            path="/panorama" 
            element={
              <Panorama 
                // Props de datos
                reservations={props.data?.reservas || []}
                
                // Props de utilidades
                formatDate={props.formatDate}
                
                // Props de navegación
                onGoToDailyView={(date, turno) => {
                  // Redirigir al dashboard con fecha y turno específicos
                  // Implementar en el futuro para paso de parámetros entre rutas
                  console.log('Navegando a vista diaria:', { date, turno });
                }}
                
                // Props de notificaciones globales - AÑADIDO
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