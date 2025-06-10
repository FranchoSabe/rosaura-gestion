// Función para verificar que todas las variables de entorno necesarias estén definidas
export const checkRequiredEnvVars = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_ADMIN_EMAIL',
    'VITE_MOZO_EMAIL'
  ];

  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.error('Error: Faltan las siguientes variables de entorno:', missingVars);
    return false;
  }

  return true;
}; 