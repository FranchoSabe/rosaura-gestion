# Rosaura Reservas

Sistema de reservas para el restaurante Rosaura.

## Configuración del Entorno

1. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# Admin Credentials
VITE_ADMIN_EMAIL=admin@example.com
VITE_ADMIN_PASSWORD=your_secure_password_here
VITE_MOZO_EMAIL=mozo@example.com
VITE_MOZO_PASSWORD=your_secure_password_here
```

2. Asegúrate de nunca compartir o subir al repositorio el archivo `.env` con las credenciales reales.

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de la construcción
npm run preview
```

## Despliegue en Producción

### Vercel (Recomendado)

1. Crear una cuenta en [Vercel](https://vercel.com)
2. Instalar Vercel CLI:
```bash
npm i -g vercel
```

3. Desplegar:
```bash
vercel
```

4. Configurar variables de entorno en Vercel:
   - Ve a la configuración del proyecto en Vercel
   - Sección "Environment Variables"
   - Añade todas las variables del archivo `.env`

### Firebase (Backend)

La aplicación usa Firebase para:
- Base de datos (Firestore)
- Autenticación
- Almacenamiento

Configuración necesaria en Firebase:
1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Authentication y configurar proveedores de email/password
3. Crear una base de datos en Firestore
4. Configurar reglas de seguridad en Firestore

## ESLint

Si estás desarrollando una aplicación para producción, recomendamos usar TypeScript con reglas de lint conscientes de tipos. Consulta la [plantilla TS](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) para obtener información sobre cómo integrar TypeScript y [`typescript-eslint`](https://typescript-eslint.io) en tu proyecto.

## Seguridad

- Las credenciales de Firebase y las credenciales de administrador se manejan a través de variables de entorno en Vercel
- Nunca expongas las credenciales en el código fuente
- En producción, las variables de entorno se configuran en el dashboard de Vercel
- Asegúrate de que las reglas de seguridad de Firebase estén correctamente configuradas

## Arquitectura

La aplicación utiliza una arquitectura híbrida:
- **Frontend Hosting**: Vercel (mejor rendimiento y facilidad de despliegue)
- **Backend Services**: Firebase (base de datos y autenticación)

Esta combinación proporciona:
- Mejor rendimiento de la aplicación
- Despliegues automáticos
- Previews de PR
- Base de datos en tiempo real
- Sistema de autenticación robusto
