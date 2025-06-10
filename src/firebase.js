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

// Función para generar ID único de reserva
const generateReservationId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Funciones de utilidad para manejar datos
export const addReservation = async (reservationData) => {
  try {
    const reservationId = generateReservationId();
    const docRef = await addDoc(collection(db, "reservas"), {
      ...reservationData,
      reservationId,
      createdAt: new Date(),
      status: 'active'
    });
    return { id: docRef.id, reservationId };
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
    const { reservationId } = searchData;
    
    if (!reservationId) {
      throw new Error('Se requiere el código de reserva');
    }

    const querySnapshot = await getDocs(collection(db, "reservas"));
    const reservations = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(reserva => reserva.reservationId === reservationId.toUpperCase())
      .filter(reserva => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(reserva.fecha) >= today;
      });

    return reservations[0] || null;
  } catch (error) {
    console.error("Error al buscar reserva:", error);
    throw error;
  }
}; 