import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

// Router principal: por el momento solo envuelve a App.
// Más adelante reemplazaremos <App /> por páginas separadas.
export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta comodín: todo va a App hasta refactor completo */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
} 