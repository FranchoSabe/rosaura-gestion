import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

/**
 * Router principal de la aplicación
 * Envuelve la aplicación con BrowserRouter y delega el routing a App.jsx
 * que ahora usa el nuevo sistema modular de rutas
 */
export default function Router() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
} 