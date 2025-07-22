import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, getDoc, setDoc, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { DEFAULT_WALKIN_TABLES } from './utils/tablesLayout';

// Helper for debug logging
const debugLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

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
    debugLog('Generando nueva reserva:', {
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

    debugLog('Datos a guardar:', dataToSave);

    const docRef = await addDoc(collection(db, "reservas"), dataToSave);

    debugLog('Reserva guardada en Firebase:', {
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
      listaNegra: false
      // ❌ REMOVIDO: totalReservas - se calculará dinámicamente cuando se necesite
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

export const updateClient = async (clientData) => {
  try {
    debugLog('Actualizando cliente:', clientData);
    
    const { consolidatedIds, ...dataToUpdate } = clientData;
    const updateData = {
      ...dataToUpdate,
      updatedAt: new Date()
    };
    
    // Si hay múltiples IDs consolidados, actualizar todos
    if (consolidatedIds && consolidatedIds.length > 0) {
      const updatePromises = consolidatedIds.map(clientId => {
        const clientRef = doc(db, "clientes", clientId);
        return updateDoc(clientRef, updateData);
      });
      
      await Promise.all(updatePromises);
      debugLog(`Cliente actualizado en ${consolidatedIds.length} registros`);
    } else {
      // Si no hay consolidatedIds, actualizar solo el registro principal
      throw new Error('No se encontraron IDs de cliente para actualizar');
    }

    return true;
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    throw error;
  }
};

export const deleteClient = async (clientId) => {
  try {
    debugLog('Eliminando cliente:', clientId);
    
    const clientRef = doc(db, "clientes", clientId);
    await deleteDoc(clientRef);

    debugLog('Cliente eliminado con éxito');
    return true;
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
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

// Suscripción en tiempo real a cambios - TODAS las reservas (SOLO para estadísticas históricas)
// 🚨 USAR CON CUIDADO: Esta función carga TODAS las reservas de la base de datos
// Para uso diario, usar subscribeToReservationsByDate() que es más eficiente
export const subscribeToReservations = (callback) => {
  return onSnapshot(collection(db, "reservas"), (snapshot) => {
    const reservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    debugLog(`🚨 CARGA COMPLETA: ${reservations.length} reservas históricas cargadas`);
    callback(reservations);
  });
};

// 🎯 NUEVO: Suscripción optimizada para fecha específica (SIN índices complejos)
export const subscribeToReservationsByDate = (callback, targetDate) => {
  const reservasRef = collection(db, "reservas");
  
  // Query simple: solo filtrar por fecha (no requiere índice compuesto)
  const q = query(
    reservasRef,
    where("fecha", "==", targetDate)
  );

  return onSnapshot(q, (snapshot) => {
    const reservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    debugLog(`📅 Reservas del día ${targetDate}: ${reservations.length} documentos`);
    callback(reservations);
  }, (error) => {
    console.error('❌ Error en suscripción de reservas:', error);
    // Fallback: cargar todas las reservas y filtrar del lado cliente
    return subscribeToReservations((allReservations) => {
      const filtered = allReservations.filter(r => r.fecha === targetDate);
      debugLog(`📅 Reservas del día ${targetDate} (filtradas): ${filtered.length} documentos`);
      callback(filtered);
    });
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
    debugLog('Actualizando reserva:', { documentId, reservationData });
    
    const docRef = doc(db, "reservas", documentId);
    await updateDoc(docRef, {
      ...reservationData,
      updatedAt: new Date()
    });

    debugLog('Reserva actualizada con éxito');
    return true;
  } catch (error) {
    console.error("Error al actualizar reserva:", error);
    throw error;
  }
};

export const deleteReservation = async (documentId) => {
  try {
    debugLog('Eliminando reserva:', documentId);
    
    const docRef = doc(db, "reservas", documentId);
    await deleteDoc(docRef);

    debugLog('Reserva eliminada con éxito');
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
    
    debugLog('Buscando reserva con ID:', searchId);
    
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

    debugLog('Todas las reservas:', allReservations.map(r => ({
      id: r.id,
      reservationId: r.reservationId,
      fecha: r.fecha
    })));

    const reservations = allReservations
      .filter(reserva => {
        if (!reserva.reservationId) {
          debugLog('Reserva sin ID encontrada:', reserva);
          return false;
        }
        const coincide = reserva.reservationId === searchId;
        debugLog('Comparando:', {
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
        debugLog('Validando fecha:', {
          fecha: reserva.fecha,
          esValida
        });
        return esValida;
      });

    debugLog('Reservas encontradas después de filtrar:', reservations);
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
    debugLog('Agregando a lista de espera:', {
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

    debugLog('Datos a guardar en lista de espera:', dataToSave);

    const docRef = await addDoc(collection(db, "lista_espera"), dataToSave);

    debugLog('Reserva agregada a lista de espera:', {
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
    debugLog('Confirmando reserva desde lista de espera:', waitingReservationId);
    
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

    debugLog('Reserva confirmada desde lista de espera:', { id, reservationId });
    return { id, reservationId };
  } catch (error) {
    console.error("Error al confirmar reserva desde lista de espera:", error);
    throw error;
  }
};

// Función para eliminar una reserva de la lista de espera
export const deleteWaitingReservation = async (waitingReservationId) => {
  try {
    debugLog('Eliminando reserva de lista de espera:', waitingReservationId);
    
    const waitingDocRef = doc(db, "lista_espera", waitingReservationId);
    await deleteDoc(waitingDocRef);

    debugLog('Reserva eliminada de lista de espera');
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

// Función para contactar cliente en lista de espera
export const contactWaitingClient = async (waitingReservationId, waitingData = null) => {
  try {
    const waitingDocRef = doc(db, "lista_espera", waitingReservationId);
    await updateDoc(waitingDocRef, {
      contacted: true,
      contactedAt: new Date(),
      awaitingConfirmation: true,
      confirmationDeadline: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
    });

    // El mensaje se enviará a través de n8n automáticamente
    return true;
  } catch (error) {
    console.error("Error al marcar como contactado:", error);
    throw error;
  }
};

// Función para rechazar una reserva en lista de espera
export const rejectWaitingReservation = async (waitingReservationId, reason = '') => {
  try {
    const waitingDocRef = doc(db, "lista_espera", waitingReservationId);
    await updateDoc(waitingDocRef, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason
    });
    return true;
  } catch (error) {
    console.error("Error al rechazar reserva en espera:", error);
    throw error;
  }
};

// === FUNCIONES PARA PROVEEDORES ===

// Función para agregar un proveedor
export const addProvider = async (providerData) => {
  try {
    debugLog('Agregando proveedor:', providerData);

    const dataToSave = {
      ...providerData,
      createdAt: new Date(),
      status: 'active',
      totalPedidos: 0,
      ultimoPedido: null
    };

    debugLog('Datos a guardar:', dataToSave);

    const docRef = await addDoc(collection(db, "proveedores"), dataToSave);

    debugLog('Proveedor guardado en Firebase:', {
      id: docRef.id,
      nombre: dataToSave.nombre,
      categoria: dataToSave.categoria
    });

    return { id: docRef.id };
  } catch (error) {
    console.error("Error al agregar proveedor:", error);
    throw error;
  }
};

// Función para obtener todos los proveedores
export const getProviders = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "proveedores"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    throw error;
  }
};

// Suscripción en tiempo real a proveedores
export const subscribeToProviders = (callback, errorCallback) => {
  return onSnapshot(
    collection(db, "proveedores"), 
    (snapshot) => {
      const providers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(providers);
    },
    (error) => {
      console.error("Error en suscripción a proveedores:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
};

// Función para actualizar un proveedor
export const updateProvider = async (providerId, providerData) => {
  try {
    debugLog('Actualizando proveedor:', { providerId, providerData });
    
    const providerRef = doc(db, "proveedores", providerId);
    await updateDoc(providerRef, {
      ...providerData,
      updatedAt: new Date()
    });

    debugLog('Proveedor actualizado con éxito');
    return true;
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    throw error;
  }
};

// Función para eliminar un proveedor
export const deleteProvider = async (providerId) => {
  try {
    debugLog('Eliminando proveedor:', providerId);
    
    const providerRef = doc(db, "proveedores", providerId);
    await deleteDoc(providerRef);

    debugLog('Proveedor eliminado con éxito');
    return true;
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    throw error;
  }
};

// Función para actualizar el estado de un proveedor
export const updateProviderStatus = async (providerId, status) => {
  try {
    const providerRef = doc(db, "proveedores", providerId);
    await updateDoc(providerRef, {
      status: status,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error al actualizar estado del proveedor:", error);
    throw error;
  }
};

// === FUNCIONES PARA PRODUCTOS DE PROVEEDORES ===

// Función para agregar un producto a un proveedor
export const addProviderProduct = async (providerId, productData) => {
  try {
    debugLog('Agregando producto a proveedor:', { providerId, productData });

    const dataToSave = {
      ...productData,
      providerId: providerId,
      createdAt: new Date(),
      status: 'available'
    };

    const docRef = await addDoc(collection(db, "productos_proveedores"), dataToSave);

    debugLog('Producto agregado:', {
      id: docRef.id,
      nombre: dataToSave.nombre,
      providerId: providerId
    });

    return { id: docRef.id };
  } catch (error) {
    console.error("Error al agregar producto:", error);
    throw error;
  }
};

// Función para obtener productos de un proveedor
export const getProviderProducts = async (providerId) => {
  try {
    const querySnapshot = await getDocs(collection(db, "productos_proveedores"));
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return products.filter(product => product.providerId === providerId);
  } catch (error) {
    console.error("Error al obtener productos del proveedor:", error);
    throw error;
  }
};

// === FUNCIONES PARA PEDIDOS A PROVEEDORES ===

// Función para crear un pedido a un proveedor
export const createProviderOrder = async (orderData) => {
  try {
    debugLog('Creando pedido a proveedor:', orderData);

    const dataToSave = {
      ...orderData,
      createdAt: new Date(),
      status: 'pending',
      total: orderData.productos.reduce((sum, prod) => sum + (prod.precio * prod.cantidad), 0)
    };

    const docRef = await addDoc(collection(db, "pedidos_proveedores"), dataToSave);

    // Actualizar estadísticas del proveedor
    const providerRef = doc(db, "proveedores", orderData.providerId);
    await updateDoc(providerRef, {
      ultimoPedido: new Date(),
      totalPedidos: (await getDoc(providerRef)).data().totalPedidos + 1 || 1,
      updatedAt: new Date()
    });

    debugLog('Pedido creado:', {
      id: docRef.id,
      providerId: orderData.providerId,
      total: dataToSave.total
    });

    return { id: docRef.id };
  } catch (error) {
    console.error("Error al crear pedido:", error);
    throw error;
  }
};

// Función para obtener pedidos de un proveedor
export const getProviderOrders = async (providerId) => {
  try {
    const querySnapshot = await getDocs(collection(db, "pedidos_proveedores"));
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return orders.filter(order => order.providerId === providerId);
  } catch (error) {
    console.error("Error al obtener pedidos del proveedor:", error);
    throw error;
  }
};

// ==========================================
// SISTEMA DE PEDIDOS - PRODUCTOS DEL MENÚ
// ==========================================

// Función para agregar un producto al menú
export const addProduct = async (productData) => {
  try {
    const dataToSave = {
      ...productData,
      disponible: true,
      fechaCreacion: new Date(),
      fechaModificacion: new Date()
    };

    const docRef = await addDoc(collection(db, 'productos'), dataToSave);
    debugLog('Producto agregado exitosamente:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar producto:", error);
    throw error;
  }
};

// Función para obtener todos los productos
export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'productos'));
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return products;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
};

// Función para suscribirse a cambios en productos
export const subscribeToProducts = (callback, errorCallback) => {
  try {
    const unsubscribe = onSnapshot(collection(db, 'productos'), 
      (querySnapshot) => {
        try {
          const products = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(products);
        } catch (docError) {
          console.error("Error procesando documentos de productos:", docError);
          // Devolver array vacío en caso de error
          callback([]);
        }
      },
      (error) => {
        console.error("Error en suscripción a productos:", error);
        // Devolver array vacío en caso de error
        callback([]);
        if (errorCallback) errorCallback(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error("Error al crear suscripción a productos:", error);
    callback([]);
    if (errorCallback) errorCallback(error);
  }
};

// Función para actualizar un producto
export const updateProduct = async (productId, productData) => {
  try {
    const dataToUpdate = {
      ...productData,
      fechaModificacion: new Date()
    };
    
    const productRef = doc(db, 'productos', productId);
    await updateDoc(productRef, dataToUpdate);
    debugLog('Producto actualizado exitosamente:', productId);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    throw error;
  }
};

// Función para eliminar un producto
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, 'productos', productId);
    await deleteDoc(productRef);
    debugLog('Producto eliminado exitosamente:', productId);
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    throw error;
  }
};

// Función para actualizar disponibilidad de producto
export const updateProductAvailability = async (productId, disponible) => {
  try {
    const productRef = doc(db, 'productos', productId);
    await updateDoc(productRef, {
      disponible: disponible,
      fechaModificacion: new Date()
    });
    debugLog('Disponibilidad de producto actualizada:', productId);
  } catch (error) {
    console.error("Error al actualizar disponibilidad:", error);
    throw error;
  }
};

// Función para limpiar todos los productos (para desarrollo)
export const clearAllProducts = async () => {
  try {
    const productsSnapshot = await getDocs(collection(db, 'productos'));
    const deletePromises = productsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    debugLog('Todos los productos han sido eliminados');
    return true;
  } catch (error) {
    console.error("Error al limpiar productos:", error);
    throw error;
  }
};

// ==========================================
// SISTEMA DE PEDIDOS - PEDIDOS
// ==========================================

// Función para generar ID único de pedido
const generateOrderId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'P';
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Función para agregar un pedido
export const addOrder = async (orderData) => {
  try {
    const orderId = generateOrderId();
    const dataToSave = {
      ...orderData,
      orderId: orderId.toUpperCase(),
      // Respetar el estado que viene en orderData, o usar 'pendiente' como fallback
      estado: orderData.estado || 'pendiente',
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const docRef = await addDoc(collection(db, 'pedidos'), dataToSave);
    debugLog('✅ Pedido guardado:', { id: docRef.id, orderId: dataToSave.orderId, mesa: dataToSave.mesa, estado: dataToSave.estado });
    return { docId: docRef.id, orderId: dataToSave.orderId };
  } catch (error) {
    console.error("Error al agregar pedido:", error);
    throw error;
  }
};

// Función para obtener todos los pedidos
export const getOrders = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'pedidos'));
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return orders;
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    throw error;
  }
};

// Función para suscribirse a cambios en pedidos
export const subscribeToOrders = (callback, errorCallback) => {
  try {
    const unsubscribe = onSnapshot(collection(db, 'pedidos'), 
      (querySnapshot) => {
        try {
          const orders = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Remover el campo 'id' de los datos para evitar conflicto
            const { id: dataId, ...restData } = data;
            return {
              id: doc.id,                    // Document ID real de Firebase (NUNCA sobrescribir)
              firebaseDocId: doc.id,         // Backup del ID real
              legacyId: dataId,              // Campo id del documento original (si existe)
              ...restData                    // Resto de datos sin el campo 'id' conflictivo
            };
          });
          callback(orders);
        } catch (docError) {
          console.error("Error procesando documentos de pedidos:", docError);
          // Devolver array vacío en caso de error
          callback([]);
        }
      },
      (error) => {
        console.error("Error en suscripción a pedidos:", error);
        // Devolver array vacío en caso de error
        callback([]);
        if (errorCallback) errorCallback(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error("Error al crear suscripción a pedidos:", error);
    callback([]);
    if (errorCallback) errorCallback(error);
  }
};

// Función para actualizar un pedido
export const updateOrder = async (orderId, orderData) => {
  try {
    const dataToUpdate = {
      ...orderData,
      fechaActualizacion: new Date()
    };
    
    const orderRef = doc(db, 'pedidos', orderId);
    await updateDoc(orderRef, dataToUpdate);
    debugLog('Pedido actualizado exitosamente:', orderId);
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    throw error;
  }
};

// Función para actualizar estado de pedido (con datos adicionales como método de pago y descuentos)
export const updateOrderStatus = async (orderId, estado, additionalData = {}) => {
  try {
    debugLog('🔥 FIREBASE - updateOrderStatus INICIO:', orderId, 'nuevo estado:', estado, 'datos adicionales:', additionalData);
    debugLog('🔍 FIREBASE - Tipo de orderId:', typeof orderId, 'Longitud:', orderId?.length);
    
    // Verificar que el orderId no esté vacío
    if (!orderId) {
      throw new Error('OrderId no puede estar vacío');
    }
    
    // NUEVO: Verificar si el documento existe antes de intentar actualizarlo
    const orderRef = doc(db, 'pedidos', orderId);
    debugLog('📄 FIREBASE - Referencia del documento creada:', orderRef.path);
    debugLog('📄 FIREBASE - Verificando existencia del documento...');
    
    const docSnap = await getDoc(orderRef);
    if (!docSnap.exists()) {
      console.error('❌ FIREBASE - DOCUMENTO NO EXISTE:', orderId);
      debugLog('🔍 FIREBASE - Listando documentos existentes...');
      
      // Listar los primeros 5 documentos para debug
      const querySnapshot = await getDocs(collection(db, 'pedidos'));
      debugLog('📊 FIREBASE - Documentos existentes en colección:');
      querySnapshot.docs.slice(0, 5).forEach(doc => {
        debugLog(`  - ID: ${doc.id}, orderId: ${doc.data().orderId}, estado: ${doc.data().estado}`);
      });
      
      throw new Error(`Documento no encontrado: ${orderId}`);
    }
    
    debugLog('✅ FIREBASE - Documento encontrado:', docSnap.data().orderId || 'sin orderId');
    const updateData = {
      estado: estado,
      fechaActualizacion: new Date(),
      ...additionalData  // Agregar datos adicionales como metodoPago, descuentos, etc.
    };
    
    // Guardar timestamp específico para estados importantes
    switch (estado) {
      case 'cocina':
        updateData.fechaEnviadoCocina = new Date();
        break;
      case 'listo':
        updateData.fechaListo = new Date();
        break;
      case 'entregado':
        updateData.fechaEntregado = new Date();
        break;
      case 'pendiente_pago':
        updateData.fechaCerradoMesa = new Date();
        break;
      case 'cerrado':
        updateData.fechaCobrado = new Date();
        break;
    }
    
    debugLog('📝 FIREBASE - Datos a actualizar:', JSON.stringify(updateData, null, 2));
    
    debugLog('🔄 FIREBASE - Ejecutando updateDoc...');
    try {
      await updateDoc(orderRef, updateData);
      debugLog('🎯 FIREBASE - updateDoc ejecutado sin errores');
    } catch (updateError) {
      console.error('❌ FIREBASE - Error específico en updateDoc:', updateError);
      console.error('❌ FIREBASE - Código de error:', updateError.code);
      console.error('❌ FIREBASE - Mensaje:', updateError.message);
      throw updateError;
    }
    
    debugLog('✅ FIREBASE - Estado de pedido actualizado exitosamente:', orderId, estado);
  } catch (error) {
    console.error("❌ FIREBASE - Error al actualizar estado:", error);
    throw error;
  }
};

// Función para eliminar un pedido
export const deleteOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'pedidos', orderId);
    await deleteDoc(orderRef);
    debugLog('Pedido eliminado exitosamente:', orderId);
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    throw error;
  }
};

// ==========================================
// SISTEMA DE PEDIDOS - ESTADO DE MESAS
// ==========================================

// Función para actualizar estado de mesa
export const updateTableStatus = async (tableNumber, status, orderId = null) => {
  try {
    const tableRef = doc(db, 'mesas', tableNumber.toString());
    const dataToUpdate = {
      numero: tableNumber,
      estado: status,
      fechaUltimaActividad: new Date()
    };
    
    if (orderId) {
      dataToUpdate.pedidoActual = orderId;
    } else {
      dataToUpdate.pedidoActual = null;
    }
    
    // Usar setDoc con merge para crear o actualizar
    await setDoc(tableRef, dataToUpdate, { merge: true });
    debugLog('Estado de mesa actualizado:', tableNumber, status);
  } catch (error) {
    console.error("Error al actualizar estado de mesa:", error);
    throw error;
  }
};

// Función para obtener estados de todas las mesas
export const getTableStatuses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'mesas'));
    const tables = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return tables;
  } catch (error) {
    console.error("Error al obtener estados de mesas:", error);
    throw error;
  }
};

// Función para suscribirse a cambios en estado de mesas
export const subscribeToTableStatuses = (callback, errorCallback) => {
  try {
    const unsubscribe = onSnapshot(collection(db, 'mesas'), 
      (querySnapshot) => {
        try {
          const tables = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(tables);
        } catch (docError) {
          console.error("Error procesando documentos de mesas:", docError);
          // Devolver array vacío en caso de error
          callback([]);
        }
      },
      (error) => {
        console.error("Error en suscripción a mesas:", error);
        // Devolver array vacío en caso de error
        callback([]);
        if (errorCallback) errorCallback(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error("Error al crear suscripción a mesas:", error);
    callback([]);
    if (errorCallback) errorCallback(error);
  }
};

// Función para obtener pedido actual de una mesa
export const getTableCurrentOrder = async (tableNumber) => {
  try {
    const tableRef = doc(db, 'mesas', tableNumber.toString());
    const tableDoc = await getDoc(tableRef);
    
    if (tableDoc.exists()) {
      const tableData = tableDoc.data();
      if (tableData.pedidoActual) {
        const orderRef = doc(db, 'pedidos', tableData.pedidoActual);
        const orderDoc = await getDoc(orderRef);
        
        if (orderDoc.exists()) {
          return {
            id: orderDoc.id,
            ...orderDoc.data()
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener pedido actual de mesa:", error);
    throw error;
  }
};

// =================== SISTEMA DE CHECK-IN ===================

/**
 * Verificar si una mesa tiene conflicto con otra reserva
 */
export const checkMesaConflict = async (mesaReal, fecha, turno, excludeReservationId) => {
  try {
    const reservationsSnapshot = await getDocs(collection(db, "reservas"));
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Buscar si otra reserva del mismo día/turno ya está asignada a esa mesa
    const conflictingReservation = reservations.find(reservation => 
      reservation.id !== excludeReservationId &&
      reservation.fecha === fecha &&
      reservation.turno === turno &&
      (reservation.mesaAsignada === mesaReal || reservation.mesaReal === mesaReal) &&
      reservation.status === 'active'
    );

    return conflictingReservation || null;
  } catch (error) {
    console.error("Error al verificar conflicto de mesa:", error);
    throw error;
  }
};

/**
 * Reasignar automáticamente una reserva a una nueva mesa
 */
export const reassignReservation = async (reservationId, newMesaAsignada) => {
  try {
    const reservationRef = doc(db, "reservas", reservationId);
    await updateDoc(reservationRef, {
      mesaAsignada: newMesaAsignada,
      reasignada: true,
      fechaReasignacion: new Date(),
      updatedAt: new Date()
    });

    debugLog(`Reserva ${reservationId} reasignada automáticamente a mesa ${newMesaAsignada}`);
    return true;
  } catch (error) {
    console.error("Error al reasignar reserva:", error);
    throw error;
  }
};

/**
 * Encontrar mesa disponible para reasignación automática
 */
export const findAvailableTableForReassignment = async (fecha, turno, personas, excludeTableId) => {
  try {
    // Obtener todas las reservas del día/turno
    const reservationsSnapshot = await getDocs(collection(db, "reservas"));
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Mesas ocupadas por reservas confirmadas
    const occupiedTables = new Set();
    reservations.forEach(reservation => {
      if (reservation.fecha === fecha && 
          reservation.turno === turno && 
          reservation.status === 'active') {
        if (reservation.mesaReal) {
          occupiedTables.add(reservation.mesaReal);
        } else if (reservation.mesaAsignada && reservation.estadoCheckIn !== 'confirmado') {
          occupiedTables.add(reservation.mesaAsignada);
        }
      }
    });

    // Orden de preferencia por capacidad (del MIGRATION_PLAN.md)
    const RESERVATION_ORDER = {
      2: [2, 8, 11, 21, 1, 31],
      4: [9, 10, 6, 12, 13, 3],
      6: [7]
    };

    // Buscar mesa disponible según capacidad
    const tablesForCapacity = RESERVATION_ORDER[personas] || RESERVATION_ORDER[4]; // Default a 4 personas
    
    for (const tableId of tablesForCapacity) {
      if (tableId !== excludeTableId && !occupiedTables.has(tableId)) {
        return tableId;
      }
    }

    // Si no hay mesas específicas disponibles, buscar cualquier mesa disponible
    const allTables = [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 21, 31];
    for (const tableId of allTables) {
      if (tableId !== excludeTableId && !occupiedTables.has(tableId)) {
        return tableId;
      }
    }

    return null; // No hay mesas disponibles
  } catch (error) {
    console.error("Error al buscar mesa disponible para reasignación:", error);
    throw error;
  }
};

/**
 * Hacer check-in de una reserva con selección de mesa real
 */
export const updateReservationCheckIn = async (reservationId, mesaReal) => {
  try {
    // Obtener datos de la reserva
    const reservationRef = doc(db, "reservas", reservationId);
    const reservationDoc = await getDoc(reservationRef);
    
    if (!reservationDoc.exists()) {
      throw new Error("Reserva no encontrada");
    }

    const reservationData = reservationDoc.data();

    // Verificar si hay conflicto con otra reserva
    const conflictingReservation = await checkMesaConflict(
      mesaReal, 
      reservationData.fecha, 
      reservationData.turno, 
      reservationId
    );

    let reasignaciones = [];

    // Si hay conflicto, reasignar la otra reserva
    if (conflictingReservation) {
      const newTable = await findAvailableTableForReassignment(
        reservationData.fecha,
        reservationData.turno,
        conflictingReservation.personas,
        mesaReal
      );

      if (newTable) {
        await reassignReservation(conflictingReservation.id, newTable);
        reasignaciones.push({
          reservationId: conflictingReservation.id,
          clientName: conflictingReservation.cliente?.nombre,
          oldTable: conflictingReservation.mesaAsignada || conflictingReservation.mesaReal,
          newTable: newTable
        });
      } else {
        throw new Error(`No hay mesas disponibles para reasignar la reserva de ${conflictingReservation.cliente?.nombre}`);
      }
    }

    // ✅ LÓGICA MEJORADA: Preparar datos para actualizar la reserva
    const updateData = {
      mesaReal: mesaReal,
      estadoCheckIn: 'confirmado',
      horaLlegada: new Date(),
      updatedAt: new Date()
    };

    // 🔄 UNIFICACIÓN CRÍTICA: Si el cliente se sentó en una mesa diferente a la asignada,
    // limpiar mesaAsignada para que quede solo mesaReal
    if (reservationData.mesaAsignada && reservationData.mesaAsignada !== mesaReal) {
      debugLog(`🔄 UNIFICANDO MESAS: Cliente se sentó en mesa ${mesaReal} (era ${reservationData.mesaAsignada})`);
      updateData.mesaAsignada = null; // ✅ Limpiar mesa preasignada
      debugLog(`✅ Mesa preasignada ${reservationData.mesaAsignada} liberada automáticamente`);
    }

    // Actualizar la reserva con check-in
    await updateDoc(reservationRef, updateData);

    // Actualizar estado de la mesa a ocupada
    await updateTableStatus(mesaReal, 'ocupada');

    // Liberar mesa original si era diferente
    if (reservationData.mesaAsignada && reservationData.mesaAsignada !== mesaReal) {
      // Solo liberar si no se reasignó a otra reserva
      const stillAssigned = reasignaciones.some(r => r.newTable === reservationData.mesaAsignada);
      if (!stillAssigned) {
        await updateTableStatus(reservationData.mesaAsignada, 'libre');
      }
    }

    debugLog(`Check-in exitoso: Reserva ${reservationId} en mesa ${mesaReal}`);
    
    return {
      success: true,
      reasignaciones: reasignaciones,
      checkInData: {
        reservationId,
        mesaReal,
        clientName: reservationData.cliente?.nombre,
        horaLlegada: new Date()
      }
    };

  } catch (error) {
    console.error("Error al hacer check-in:", error);
    throw error;
  }
};

/**
 * Conectar un pedido existente con un cliente (para check-in automático)
 */
export const connectOrderToClient = async (orderId, clienteId, reservationId) => {
  try {
    const orderRef = doc(db, "pedidos", orderId);
    await updateDoc(orderRef, {
      clienteId: clienteId,
      reservationId: reservationId,
      clienteConectado: true,
      fechaConexion: new Date(),
      updatedAt: new Date()
    });

    debugLog(`Pedido ${orderId} conectado con cliente ${clienteId}`);
    return true;
  } catch (error) {
    console.error("Error al conectar pedido con cliente:", error);
    throw error;
  }
};

/**
 * Obtener reservas pendientes de check-in para un día/turno específico
 */
export const getReservationsPendingCheckIn = async (fecha, turno) => {
  try {
    const reservationsSnapshot = await getDocs(collection(db, "reservas"));
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar reservas del día/turno que no han hecho check-in
    const pendingReservations = reservations.filter(reservation =>
      reservation.fecha === fecha &&
      reservation.turno === turno &&
      reservation.status === 'active' &&
      (!reservation.estadoCheckIn || reservation.estadoCheckIn === 'pendiente')
    );

    return pendingReservations;
  } catch (error) {
    console.error("Error al obtener reservas pendientes de check-in:", error);
    throw error;
  }
};

/**
 * 🔧 FUNCIÓN DE LIMPIEZA: Unificar mesas en reservas con check-in
 * Para resolver inconsistencias donde mesaAsignada != mesaReal después del check-in
 */
export const cleanupTableAssignments = async () => {
  try {
    debugLog('🔧 Iniciando limpieza de asignaciones de mesa...');
    
    const reservasRef = collection(db, "reservas");
    const q = query(
      reservasRef,
      where("estadoCheckIn", "==", "confirmado")
    );
    
    const querySnapshot = await getDocs(q);
    const inconsistentReservations = [];
    let cleanedCount = 0;
    
    // Identificar reservas con inconsistencias
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.mesaAsignada && data.mesaReal && data.mesaAsignada !== data.mesaReal) {
        inconsistentReservations.push({
          id: docSnap.id,
          clientName: data.cliente?.nombre,
          mesaAsignada: data.mesaAsignada,
          mesaReal: data.mesaReal,
          fecha: data.fecha,
          turno: data.turno
        });
      }
    });
    
    debugLog(`🔍 Encontradas ${inconsistentReservations.length} reservas con inconsistencias`);
    
    // Limpiar inconsistencias
    for (const reservation of inconsistentReservations) {
      try {
        await updateDoc(doc(db, "reservas", reservation.id), {
          mesaAsignada: null, // Limpiar mesa preasignada
          updatedAt: new Date(),
          cleanedUp: true, // Marcar como limpiado
          cleanedUpDate: new Date()
        });
        
        debugLog(`✅ Limpiado: ${reservation.clientName} - Mesa ${reservation.mesaAsignada} → ${reservation.mesaReal}`);
        cleanedCount++;
      } catch (error) {
        console.error(`❌ Error limpiando reserva ${reservation.id}:`, error);
      }
    }
    
    debugLog(`🔧 Limpieza completada: ${cleanedCount} reservas unificadas`);
    
    return {
      success: true,
      totalInconsistencies: inconsistentReservations.length,
      cleanedCount: cleanedCount,
      details: inconsistentReservations
    };
    
  } catch (error) {
    console.error("Error al limpiar asignaciones de mesa:", error);
    throw error;
  }
};

/**
 * 🔍 FUNCIÓN DE DIAGNÓSTICO: Verificar consistencia de mesas
 * Para reportar inconsistencias sin modificar datos
 */
export const checkTableConsistency = async (fecha = null, turno = null) => {
  try {
    debugLog('🔍 Verificando consistencia de asignaciones de mesa...');
    
    const reservasRef = collection(db, "reservas");
    let q;
    
    if (fecha && turno) {
      q = query(
        reservasRef,
        where("fecha", "==", fecha),
        where("turno", "==", turno),
        where("estadoCheckIn", "==", "confirmado")
      );
    } else {
      q = query(
        reservasRef,
        where("estadoCheckIn", "==", "confirmado")
      );
    }
    
    const querySnapshot = await getDocs(q);
    const report = {
      totalReservations: 0,
      consistentReservations: 0,
      inconsistentReservations: 0,
      inconsistencies: []
    };
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      report.totalReservations++;
      
      if (data.mesaAsignada && data.mesaReal && data.mesaAsignada !== data.mesaReal) {
        report.inconsistentReservations++;
        report.inconsistencies.push({
          id: docSnap.id,
          clientName: data.cliente?.nombre,
          mesaAsignada: data.mesaAsignada,
          mesaReal: data.mesaReal,
          fecha: data.fecha,
          turno: data.turno
        });
      } else {
        report.consistentReservations++;
      }
    });
    
    debugLog('📊 Reporte de consistencia:', report);
    return report;
    
  } catch (error) {
    console.error("Error al verificar consistencia:", error);
    throw error;
  }
};

/**
 * 🧹 FUNCIÓN DE LIMPIEZA TOTAL: Borrar todos los registros sin tocar las colecciones
 * Útil para testing y desarrollo - limpia toda la data sin afectar la estructura
 */
export const clearAllData = async () => {
  try {
    debugLog('🧹 Iniciando limpieza total de base de datos...');
    
    const collections = [
      { name: 'reservas', displayName: 'Reservas' },
      { name: 'pedidos', displayName: 'Pedidos' },
      { name: 'productos', displayName: 'Productos' },
      { name: 'proveedores', displayName: 'Proveedores' },
      { name: 'mesas', displayName: 'Estados de Mesa' },
      { name: 'clientes', displayName: 'Clientes' },
      { name: 'lista_espera', displayName: 'Lista de Espera' }
    ];
    
    const results = {
      success: true,
      deletedCounts: {},
      errors: []
    };
    
    // Limpiar cada colección
    for (const collectionConfig of collections) {
      try {
        debugLog(`🗑️ Limpiando colección: ${collectionConfig.displayName}...`);
        
        const snapshot = await getDocs(collection(db, collectionConfig.name));
        const deletePromises = [];
        
        // Preparar borrado en lotes
        snapshot.forEach((docSnap) => {
          deletePromises.push(deleteDoc(doc(db, collectionConfig.name, docSnap.id)));
        });
        
        // Ejecutar borrado
        await Promise.all(deletePromises);
        
        const deletedCount = snapshot.size;
        results.deletedCounts[collectionConfig.name] = deletedCount;
        
        debugLog(`✅ ${collectionConfig.displayName}: ${deletedCount} registros eliminados`);
        
      } catch (error) {
        console.error(`❌ Error limpiando ${collectionConfig.displayName}:`, error);
        results.errors.push({
          collection: collectionConfig.name,
          error: error.message
        });
      }
    }
    
    // Resumen final
    const totalDeleted = Object.values(results.deletedCounts).reduce((sum, count) => sum + count, 0);
    
    debugLog('🧹 Limpieza completada:', {
      totalDeleted,
      byCollection: results.deletedCounts,
      errorsCount: results.errors.length
    });
    
    if (results.errors.length > 0) {
      results.success = false;
    }
    
    return {
      ...results,
      totalDeleted,
      message: `Limpieza completada: ${totalDeleted} registros eliminados total`
    };
    
  } catch (error) {
    console.error("Error en limpieza total:", error);
    throw error;
  }
};

/**
 * 🧹 FUNCIÓN DE LIMPIEZA SELECTIVA: Borrar solo ciertas colecciones
 * Más seguro para testing específico
 */
export const clearSelectedData = async (collectionsToClean = ['reservas', 'pedidos']) => {
  try {
    debugLog('🧹 Iniciando limpieza selectiva de:', collectionsToClean);
    
    const results = {
      success: true,
      deletedCounts: {},
      errors: []
    };
    
    for (const collectionName of collectionsToClean) {
      try {
        debugLog(`🗑️ Limpiando colección: ${collectionName}...`);
        
        const snapshot = await getDocs(collection(db, collectionName));
        const deletePromises = [];
        
        snapshot.forEach((docSnap) => {
          deletePromises.push(deleteDoc(doc(db, collectionName, docSnap.id)));
        });
        
        await Promise.all(deletePromises);
        
        const deletedCount = snapshot.size;
        results.deletedCounts[collectionName] = deletedCount;
        
        debugLog(`✅ ${collectionName}: ${deletedCount} registros eliminados`);
        
      } catch (error) {
        console.error(`❌ Error limpiando ${collectionName}:`, error);
        results.errors.push({
          collection: collectionName,
          error: error.message
        });
      }
    }
    
    const totalDeleted = Object.values(results.deletedCounts).reduce((sum, count) => sum + count, 0);
    
    if (results.errors.length > 0) {
      results.success = false;
    }
    
    return {
      ...results,
      totalDeleted,
      message: `Limpieza selectiva completada: ${totalDeleted} registros eliminados`
    };
    
  } catch (error) {
    console.error("Error en limpieza selectiva:", error);
    throw error;
  }
};

// ==========================================
// SISTEMA DE ARQUEO DE CAJA
// ==========================================

// Función para guardar arqueo de caja
export const addCashRegister = async (cashRegisterData) => {
  try {
    debugLog('Guardando arqueo de caja:', cashRegisterData);

    const dataToSave = {
      ...cashRegisterData,
      createdAt: new Date(),
      status: 'completed'
    };

    const docRef = await addDoc(collection(db, 'arqueos_caja'), dataToSave);
    
    debugLog('Arqueo de caja guardado exitosamente:', {
      id: docRef.id,
      fecha: dataToSave.fecha,
      turno: dataToSave.turno,
      total: dataToSave.totales.total
    });

    return docRef.id;
  } catch (error) {
    console.error("Error al guardar arqueo de caja:", error);
    throw error;
  }
};

// Función para obtener arqueos de caja
export const getCashRegisters = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'arqueos_caja'));
    const cashRegisters = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return cashRegisters;
  } catch (error) {
    console.error("Error al obtener arqueos de caja:", error);
    throw error;
  }
};

// Función para suscribirse a cambios en arqueos de caja
export const subscribeToCashRegisters = (callback, errorCallback) => {
  try {
    const unsubscribe = onSnapshot(collection(db, 'arqueos_caja'), 
      (querySnapshot) => {
        try {
          const cashRegisters = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(cashRegisters);
        } catch (docError) {
          console.error("Error procesando documentos de arqueos:", docError);
          callback([]);
        }
      },
      (error) => {
        console.error("Error en suscripción a arqueos:", error);
        callback([]);
        if (errorCallback) errorCallback(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error("Error al crear suscripción a arqueos:", error);
    callback([]);
    if (errorCallback) errorCallback(error);
  }
};

// Función para obtener arqueos de caja por fecha
export const getCashRegistersByDate = async (fecha) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'arqueos_caja'));
    const cashRegisters = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(register => register.fecha === fecha);
    return cashRegisters;
  } catch (error) {
    console.error("Error al obtener arqueos por fecha:", error);
    throw error;
  }
};

// Función para obtener arqueos de caja por rango de fechas
export const getCashRegistersByDateRange = async (fechaInicio, fechaFin) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'arqueos_caja'));
    const cashRegisters = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(register => 
        register.fecha >= fechaInicio && register.fecha <= fechaFin
      );
    return cashRegisters;
  } catch (error) {
    console.error("Error al obtener arqueos por rango de fechas:", error);
    throw error;
  }
};

// ==========================================
// SISTEMA DE CUPOS DE MESAS POR FECHA-TURNO
// ==========================================

/**
 * Guardar configuración de mesas bloqueadas por fecha y turno específico
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} turno - Turno ('mediodia' | 'noche')
 * @param {Array} blockedTables - Array de IDs de mesas bloqueadas
 * @param {Array} exceptions - Array de IDs de mesas que son excepciones a bloqueos predeterminados
 */
export const saveTableBlocksForDateTurno = async (fecha, turno, blockedTables = [], exceptions = []) => {
  try {
    debugLog('🔥 FIREBASE saveTableBlocksForDateTurno INICIADA:', {
      fecha,
      turno,
      blockedTables,
      exceptions,
      blockedTablesType: typeof blockedTables,
      exceptionsType: typeof exceptions
    });
    
    const docId = `${fecha}-${turno}`;
    debugLog('📄 DocID generado:', docId);
    
    const tableConfigRef = doc(db, 'mesas_cupos', docId);
    debugLog('📝 Referencia de documento creada');
    
    const configData = {
      fecha,
      turno,
      blockedTables: Array.from(blockedTables), // Convertir Set a Array si es necesario
      exceptions: Array.from(exceptions), // Convertir Set a Array si es necesario
      updatedAt: new Date(),
      createdBy: 'admin' // TODO: Agregar usuario actual cuando tengamos auth
    };
    
    debugLog('📋 Datos a guardar:', configData);
    debugLog('🔥 Intentando escribir en Firestore...');
    
    await setDoc(tableConfigRef, configData, { merge: true });
    
    debugLog(`✅ Configuración de mesas guardada EXITOSAMENTE para ${fecha}-${turno}:`, {
      blockedTables: configData.blockedTables,
      exceptions: configData.exceptions
    });
    
    return { success: true, docId, savedData: configData };
  } catch (error) {
    console.error("❌ Error DETALLADO al guardar configuración de mesas:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
};

/**
 * Cargar configuración de mesas bloqueadas por fecha y turno específico
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} turno - Turno ('mediodia' | 'noche')
 * @returns {Object} - {blockedTables: Set, exceptions: Set}
 */
export const loadTableBlocksForDateTurno = async (fecha, turno) => {
  try {
    const docId = `${fecha}-${turno}`;
    const tableConfigRef = doc(db, 'mesas_cupos', docId);
    const docSnapshot = await getDoc(tableConfigRef);
    
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      debugLog(`📋 Configuración de mesas cargada para ${fecha}-${turno}:`, {
        blockedTables: data.blockedTables || [],
        exceptions: data.exceptions || []
      });
      
      return {
        blockedTables: new Set(data.blockedTables || []),
        exceptions: new Set(data.exceptions || []),
        lastUpdated: data.updatedAt?.toDate() || null
      };
    } else {
      debugLog(`📋 No hay configuración personalizada para ${fecha}-${turno}, usando predeterminada`);
      return {
        blockedTables: new Set(DEFAULT_WALKIN_TABLES || []),
        exceptions: new Set(),
        lastUpdated: null,
        isDefault: true // Bandera para indicar que es configuración predeterminada
      };
    }
  } catch (error) {
    console.error("❌ Error al cargar configuración de mesas:", error);
    // En caso de error, devolver configuración predeterminada para no romper la app
    return {
      blockedTables: new Set(DEFAULT_WALKIN_TABLES || []),
      exceptions: new Set(),
      lastUpdated: null,
      isDefault: true,
      error: true
    };
  }
};

/**
 * Eliminar configuración de mesas para una fecha-turno específico
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} turno - Turno ('mediodia' | 'noche')
 */
export const deleteTableBlocksForDateTurno = async (fecha, turno) => {
  try {
    const docId = `${fecha}-${turno}`;
    const tableConfigRef = doc(db, 'mesas_cupos', docId);
    await deleteDoc(tableConfigRef);
    debugLog(`🗑️ Configuración de mesas eliminada para ${fecha}-${turno}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error al eliminar configuración de mesas:", error);
    throw error;
  }
};