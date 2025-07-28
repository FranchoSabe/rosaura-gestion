import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente para proteger rutas que requieren autenticación
 * Redirige a login si no hay usuario autenticado
 */
const PrivateRoute = ({ children, auth }) => {
  // Si no hay autenticación, redirigir al login
  if (!auth || !(auth.usuarioId || auth.user)) {
    return <Navigate to="/client/login" replace />;
  }

  // Si está autenticado, mostrar el componente hijo
  return children;
};

export default PrivateRoute; 