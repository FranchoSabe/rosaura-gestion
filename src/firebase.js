import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "A1zaSyDHL9B1J7-dhJRzLgukznn9Cv9fwok-qIc",
  authDomain: "rosaura-reservas.firebaseapp.com",
  projectId: "rosaura-reservas",
  storageBucket: "rosaura-reservas.appspot.com",
  messagingSenderId: "710023225173",
  appId: "1:710023225173:web:f7e0d7a3740267a09d9dc",
  measurementId: "G-KSLE6F6NWW"
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