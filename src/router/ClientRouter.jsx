import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ClientView } from '../components/ClientView';
import { LoginView } from '../components/LoginView';

/**
 * Router para la aplicación de cliente público
 * 
 * TEMPORAL: Por ahora usa ClientView monolítico  
 * FUTURO: Se reemplazará con páginas separadas:
 * - /client -> Home.jsx (landing)
 * - /client/booking -> Booking.jsx
 * - /client/search -> Search.jsx
 * - /client/confirmation -> Confirmation.jsx
 * - /client/login -> Login compartido
 */
const ClientRouter = (props) => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Ruta de login */}
      <Route 
        path="/login" 
        element={
          <LoginView 
            handleLogin={props.handleLogin}
            setScreen={props.setCurrentScreen}
            BACKGROUND_IMAGE_URL={props.BACKGROUND_IMAGE_URL}
          />
        } 
      />
      
      {/* Ruta principal cliente - temporalmente usa ClientView completo */}
      <Route 
        path="/*" 
        element={
          <ClientView
            {...props}
            onAdminClick={() => navigate('/client/login')}
          />
        } 
      />
    </Routes>
  );
};

export default ClientRouter; 