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

export const updateClientNotes = async (clientId, notes) => {
  try {
    const clientRef = doc(db, "clientes", clientId);
    await updateDoc(clientRef, {
      notasInternas: notes,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("Error al actualizar notas del cliente:", error);
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

// === FUNCIONES PARA LISTA DE ESPERA ===

// Función para agregar una reserva a la lista de espera
export const addWaitingReservation = async (reservationData) => {
  try {
    const waitingId = generateReservationId();
    console.log('Agregando a lista de espera:', {
      waitingId,
      ...reservationData
    });

    const dataToSave = {
      ...reservationData,
      waitingId: waitingId.toUpperCase(),
      createdAt: new Date(),
      status: 'waiting',
      notified: false
    };

    console.log('Datos a guardar en lista de espera:', dataToSave);

    const docRef = await addDoc(collection(db, "lista_espera"), dataToSave);

    console.log('Reserva agregada a lista de espera:', {
      id: docRef.id,
      waitingId: dataToSave.waitingId,
      fecha: dataToSave.fecha,
      turno: dataToSave.turno
    });

    return { id: docRef.id, waitingId: dataToSave.waitingId };
  } catch (error) {
    console.error("Error al agregar a lista de espera:", error);
    throw error;
  }
};

// Función para obtener todas las reservas en espera
export const getWaitingReservations = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "lista_espera"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener reservas en espera:", error);
    throw error;
  }
};

// Suscripción en tiempo real a lista de espera
export const subscribeToWaitingReservations = (callback) => {
  return onSnapshot(
    collection(db, "lista_espera"), 
    (snapshot) => {
      const waitingReservations = snapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        };
      });
      
      callback(waitingReservations);
    }, 
    (error) => {
      console.error('❌ Error en suscripción a lista de espera:', error);
      // En caso de error, intentar obtener datos de forma manual
      getWaitingReservations()
        .then(data => {
          callback(data);
        })
        .catch(manualError => {
          console.error('❌ Error también en obtención manual:', manualError);
          callback([]); // Devolver array vacío como último recurso
        });
    }
  );
};

// Función para convertir una reserva en espera a reserva confirmada
export const confirmWaitingReservation = async (waitingReservationId, waitingData) => {
  try {
    console.log('Confirmando reserva desde lista de espera:', waitingReservationId);
    
    // 1. Crear la reserva confirmada
    const { id, reservationId } = await addReservation({
      fecha: waitingData.fecha,
      turno: waitingData.turno,
      horario: waitingData.horario,
      personas: waitingData.personas,
      clienteId: waitingData.clienteId,
      cliente: waitingData.cliente
    });

    // 2. Eliminar de la lista de espera
    const waitingDocRef = doc(db, "lista_espera", waitingReservationId);
    await deleteDoc(waitingDocRef);

    console.log('Reserva confirmada desde lista de espera:', { id, reservationId });
    return { id, reservationId };
  } catch (error) {
    console.error("Error al confirmar reserva desde lista de espera:", error);
    throw error;
  }
};

// Función para eliminar una reserva de la lista de espera
export const deleteWaitingReservation = async (waitingReservationId) => {
  try {
    console.log('Eliminando reserva de lista de espera:', waitingReservationId);
    
    const waitingDocRef = doc(db, "lista_espera", waitingReservationId);
    await deleteDoc(waitingDocRef);

    console.log('Reserva eliminada de lista de espera');
    return true;
  } catch (error) {
    console.error("Error al eliminar reserva de lista de espera:", error);
    throw error;
  }
};

// Función para marcar una reserva en espera como notificada
export const markWaitingAsNotified = async (waitingReservationId) => {
  try {
    const waitingDocRef = doc(db, "lista_espera", waitingReservationId);
    await updateDoc(waitingDocRef, {
      notified: true,
      notifiedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error al marcar como notificada:", error);
    throw error;
  }
};