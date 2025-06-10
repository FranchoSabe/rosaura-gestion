import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
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
    console.log('Generando nueva reserva:', {
      reservationId,
      ...reservationData
    });

    // Asegurarnos de que el ID esté en mayúsculas y los datos estén completos
    const dataToSave = {
      ...reservationData,
      reservationId: reservationId.toUpperCase(),
      createdAt: new Date(),
      status: 'active'
    };

    console.log('Datos a guardar:', dataToSave);

    const docRef = await addDoc(collection(db, "reservas"), dataToSave);

    console.log('Reserva guardada en Firebase:', {
      id: docRef.id,
      reservationId: dataToSave.reservationId,
      fecha: dataToSave.fecha,
      horario: dataToSave.horario
    });

    return { id: docRef.id, reservationId: dataToSave.reservationId };
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

export const updateReservation = async (documentId, reservationData) => {
  try {
    console.log('Actualizando reserva:', { documentId, reservationData });
    
    const docRef = doc(db, "reservas", documentId);
    await updateDoc(docRef, {
      ...reservationData,
      updatedAt: new Date()
    });

    console.log('Reserva actualizada con éxito');
    return true;
  } catch (error) {
    console.error("Error al actualizar reserva:", error);
    throw error;
  }
};

export const deleteReservation = async (documentId) => {
  try {
    console.log('Eliminando reserva:', documentId);
    
    const docRef = doc(db, "reservas", documentId);
    await deleteDoc(docRef);

    console.log('Reserva eliminada con éxito');
    return true;
  } catch (error) {
    console.error("Error al eliminar reserva:", error);
    throw error;
  }
};

export const searchReservation = async (searchData) => {
  try {
    const { reservationId } = searchData;
    const searchId = (reservationId || '').toUpperCase().trim();
    
    console.log('Buscando reserva con ID:', searchId);
    
    if (!searchId) {
      throw new Error('Se requiere el código de reserva');
    }

    const querySnapshot = await getDocs(collection(db, "reservas"));
    const allReservations = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        reservationId: (data.reservationId || '').toUpperCase().trim()
      };
    });

    console.log('Todas las reservas:', allReservations.map(r => ({
      id: r.id,
      reservationId: r.reservationId,
      fecha: r.fecha
    })));

    const reservations = allReservations
      .filter(reserva => {
        if (!reserva.reservationId) {
          console.log('Reserva sin ID encontrada:', reserva);
          return false;
        }
        const coincide = reserva.reservationId === searchId;
        console.log('Comparando:', {
          buscado: searchId,
          actual: reserva.reservationId,
          coincide
        });
        return coincide;
      })
      .filter(reserva => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reservaDate = new Date(reserva.fecha);
        const esValida = reservaDate >= today;
        console.log('Validando fecha:', {
          fecha: reserva.fecha,
          esValida
        });
        return esValida;
      });

    console.log('Reservas encontradas después de filtrar:', reservations);
    return reservations[0] || null;
  } catch (error) {
    console.error("Error al buscar reserva:", error);
    throw error;
  }
};