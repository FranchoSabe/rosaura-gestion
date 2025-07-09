import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { AdminView } from '../components/AdminView';

/**
 * Router para la aplicación de administración
 * 
 * TEMPORAL: Por ahora usa AdminView monolítico
 * FUTURO: Se reemplazará con páginas separadas:
 * - /admin/dashboard -> Dashboard.jsx
 * - /admin/panorama -> Panorama.jsx  
 * - /admin/clients -> Clients.jsx
 * - /admin/waiting-list -> WaitingList.jsx
 */
const AdminRouter = (props) => {
  return (
    <Routes>
      {/* Ruta principal admin - temporalmente usa AdminView completo */}
      <Route 
        path="/*" 
        element={
          <PrivateRoute auth={props.auth}>
            <AdminView {...props} />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
};

export default AdminRouter; 