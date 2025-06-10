import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { checkRequiredEnvVars } from './utils/envCheck'

// Verificar variables de entorno antes de iniciar la aplicación
if (!checkRequiredEnvVars()) {
  console.error('La aplicación no puede iniciarse debido a la falta de variables de entorno necesarias.');
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
