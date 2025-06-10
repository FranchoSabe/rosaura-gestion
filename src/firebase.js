import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener instancias de Firestore y Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Funciones de utilidad para manejar datos
export const addReservation = async (reservationData) => {
  try {
    const docRef = await addDoc(collection(db, "reservas"), {
      ...reservationData,
      createdAt: new Date(),
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar reserva:", error);
    throw error;
  }
};

export const addClient = async (clientData) => {
  try {
    const docRef = await addDoc(collection(db, "clientes"), {
      ...clientData,
      createdAt: new Date(),
      listaNegra: false,
      totalReservas: 1
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar cliente:", error);
    throw error;
  }
};

export const updateClientBlacklist = async (clientId, isBlacklisted) => {
  try {
    const clientRef = doc(db, "clientes", clientId);
    await updateDoc(clientRef, {
      listaNegra: isBlacklisted,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("Error al actualizar estado de lista negra:", error);
    throw error;
  }
};

export const getReservations = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "reservas"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    throw error;
  }
};

export const getClients = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "clientes"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    throw error;
  }
};

// Suscripción en tiempo real a cambios
export const subscribeToReservations = (callback) => {
  return onSnapshot(collection(db, "reservas"), (snapshot) => {
    const reservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(reservations);
  });
};

export const subscribeToClients = (callback) => {
  return onSnapshot(collection(db, "clientes"), (snapshot) => {
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(clients);
  });
};

export const updateReservation = async (reservationData) => {
  try {
    const reservationRef = doc(db, "reservas", reservationData.id);
    await updateDoc(reservationRef, {
      fecha: reservationData.fecha,
      horario: reservationData.horario,
      personas: reservationData.personas,
      cliente: reservationData.cliente,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error al actualizar reserva:", error);
    throw error;
  }
};

export const searchReservation = async (searchData) => {
  try {
    const { nombre, telefono } = searchData;
    
    // Limpiar el número de teléfono para la búsqueda
    const cleanedPhone = telefono.replace(/\D/g, '');
    
    // Obtener todas las reservas
    const querySnapshot = await getDocs(collection(db, "reservas"));
    
    // Filtrar las reservas que coincidan con el nombre y teléfono
    const reservations = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(reserva => {
        const reservaNombre = reserva.cliente.nombre.toLowerCase();
        const searchNombre = nombre.toLowerCase();
        const reservaTelefono = reserva.cliente.telefono.replace(/\D/g, '');
        
        return reservaNombre.includes(searchNombre) && 
               reservaTelefono.includes(cleanedPhone);
      })
      // Ordenar por fecha, mostrando primero las reservas más próximas
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      // Filtrar solo las reservas futuras
      .filter(reserva => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(reserva.fecha) >= today;
      });

    return reservations[0] || null; // Devolver la primera reserva encontrada o null
  } catch (error) {
    console.error("Error al buscar reserva:", error);
    throw error;
  }
}; 