import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { checkRequiredEnvVars } from './utils/envCheck'

// Verificar variables de entorno antes de iniciar la aplicación
if (!checkRequiredEnvVars()) {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="padding: 20px; color: red; text-align: center;">
      <h1>Error de Configuración</h1>
      <p>Faltan variables de entorno necesarias. Por favor, revisa la configuración.</p>
    </div>
  `;
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
