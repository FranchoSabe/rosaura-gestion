import React, { useState, useEffect, useCallback } from 'react';
import { ClientView } from './apps/client/pages/ClientView/ClientView';
import { LoginView } from './apps/client/pages/Login/LoginView';
import AppRouter from './router/AppRouter';
import { NotificationContainer, ConfirmationModal } from './shared/components/ui';
import { 
  addClient, 
  updateClientBlacklist, 
  updateClientNotes,
  updateReservation,
  deleteReservation,
  searchReservation,
  subscribeToReservations, 
  subscribeToReservationsByDate,
  subscribeToClients,
  addWaitingReservation,
  subscribeToWaitingReservations,
  confirmWaitingReservation,
  deleteWaitingReservation,
  markWaitingAsNotified,
  contactWaitingClient,
  rejectWaitingReservation,
  auth 
} from './firebase';
import { assignTableToNewReservation } from './shared/services/tableManagementService';
import { UNIFIED_DEFAULT_BLOCKED_TABLES as DEFAULT_BLOCKED_TABLES, UNIFIED_TABLES_LAYOUT as TABLES_LAYOUT } from './utils/tablesLayout';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

import { formatDateToString } from './utils';
import { db } from './firebase';
import { isTurnoClosed, getAvailableHours } from './shared/constants/operatingDays';
import { calculateAvailableSlots, isValidReservationDate } from './shared/services/reservationService';
import { createReservation } from './shared/services/reservationService';

// --- CONFIGURACIÓN Y DATOS ---
const LOGO_URL = null; // Usamos texto con tipografía Daniel en lugar de imagen
const BACKGROUND_IMAGE_URL = '/fondo.jpg';
const HORARIOS = {
    mediodia: ['12:00', '12:30', '13:00', '13:30', '14:00'],
    noche: ['20:00', '20:15', '20:30', '20:45', '21:00', '21:15']
};

function App() {
  const [authState, setAuthState] = useState(null);
  const [data, setData] = useState({ reservas: [], clientes: [], waitingList: [] });
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [reservaData, setReservaData] = useState({
    fecha: '',
    personas: 0,
    turno: '',
    horario: '',
    cliente: { nombre: '', telefono: '', comentarios: '' } // Removido codigoPais
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showWaitingListModal, setShowWaitingListModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para notificaciones y confirmaciones (migrados desde AdminView)
  const [notifications, setNotifications] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [editingReservation, setEditingReservation] = useState(null);
  
  // 🎯 Suscribirse a reservas del día actual únicamente 
  useEffect(() => {
    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Reservas del día se cargan automáticamente
    const unsubscribeReservations = subscribeToReservationsByDate((reservas) => {
      setData(prev => ({ ...prev, reservas }));
    }, today);

    const unsubscribeClients = subscribeToClients((clientes) => {
      setData(prev => ({ ...prev, clientes }));
    });

    const unsubscribeWaitingList = subscribeToWaitingReservations((waitingList) => {
      setData(prev => ({ ...prev, waitingList }));
    });

    // Limpiar suscripciones al desmontar
    return () => {
      unsubscribeReservations();
      unsubscribeClients();
      unsubscribeWaitingList();
    };
  }, []); // Solo ejecutar una vez al montar el componente

  // 🔔 SISTEMA DE NOTIFICACIONES MEJORADO
  // Categorías de notificaciones con diferentes comportamientos
  const NOTIFICATION_CATEGORIES = {
    CRITICAL: 'critical',    // Errores críticos - siempre mostrar
    IMPORTANT: 'important',  // Acciones importantes - mostrar
    ROUTINE: 'routine',      // Acciones rutinarias - mostrar menos
    DEBUG: 'debug'           // Información de debug - no mostrar en producción
  };

  // Configuración de notificaciones por tipo
  const getNotificationConfig = (message) => {
    // Notificaciones críticas (siempre mostrar)
    if (message.includes('Error') || message.includes('error')) {
      return { category: NOTIFICATION_CATEGORIES.CRITICAL, duration: 6000, priority: 'high' };
    }
    
    // Notificaciones importantes (mostrar)
    if (message.includes('cerrada') || message.includes('cobrar') || message.includes('descuento') || message.includes('cancelado')) {
      return { category: NOTIFICATION_CATEGORIES.IMPORTANT, duration: 4000, priority: 'medium' };
    }
    
    // Notificaciones rutinarias (mostrar menos tiempo)
    if (message.includes('enviado a cocina') || message.includes('entregado') || message.includes('Estado actualizado')) {
      return { category: NOTIFICATION_CATEGORIES.ROUTINE, duration: 2000, priority: 'low' };
    }
    
    // Notificaciones de debug (no mostrar en operación normal)
    if (message.includes('Recargados') || message.includes('inicializado') || message.includes('reiniciado')) {
      return { category: NOTIFICATION_CATEGORIES.DEBUG, duration: 1000, priority: 'low' };
    }
    
    return { category: NOTIFICATION_CATEGORIES.ROUTINE, duration: 3000, priority: 'medium' };
  };

  const showNotification = useCallback((message, type = 'info') => {
    const config = getNotificationConfig(message);
    
    // No mostrar notificaciones de debug en operación normal
    if (config.category === NOTIFICATION_CATEGORIES.DEBUG) {
      console.log(`[DEBUG] ${message}`);
      return;
    }
    
    // Limitar notificaciones rutinarias (máximo 3 simultáneas)
    if (config.category === NOTIFICATION_CATEGORIES.ROUTINE) {
      setNotifications(prev => {
        const routineCount = prev.filter(n => n.category === NOTIFICATION_CATEGORIES.ROUTINE).length;
        if (routineCount >= 2) {
          return prev; // No agregar más notificaciones rutinarias
        }
        return prev;
      });
    }
    
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification = { 
      id, 
      type, 
      message, 
      category: config.category,
      priority: config.priority
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove con duración variable según importancia
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, config.duration);
  }, []);

  const closeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Función para mostrar confirmaciones (migrada desde AdminView)
  const showConfirmationDialog = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmation({
        ...config,
        resolve
      });
    });
  }, []);

  const handleConfirmation = useCallback((result) => {
    if (confirmation?.resolve) {
      confirmation.resolve(result);
    }
    setConfirmation(null);
  }, [confirmation]);

  const getAvailableSlotsDynamic = async (fecha, turno) => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const dayOfWeek = fechaObj.getDay();
    
    // Usar nueva función unificada para verificar si está cerrado
    if (isTurnoClosed(dayOfWeek, turno)) {
      return []; // Día/turno cerrado según configuración
    }
    
    try {
      // Cargar bloqueos específicos para esta fecha/turno
      const blockedTablesForDate = await handleLoadBlockedTables(fecha, turno);
      const blockedSet = new Set(blockedTablesForDate || []);
      
      // Si no hay bloqueos guardados, usar los predeterminados
      if (blockedSet.size === 0) {
        Object.values(DEFAULT_BLOCKED_TABLES).flat().forEach(id => blockedSet.add(id));
      }
      
      // Obtener reservas existentes para esta fecha/turno
      const reservasDelDia = data.reservas.filter(
        r => r.fecha === fecha && r.turno === turno
      );
      
      // Calcular capacidad dinámica basada en mesas disponibles (no bloqueadas)
      const capacidadDisponible = {
        pequena: 0, // Para 1-2 personas
        mediana: 0, // Para 3-4 personas  
        grande: 0   // Para 5-6 personas
      };
      
      // Contar mesas disponibles por capacidad
      TABLES_LAYOUT.forEach(mesa => {
        if (!blockedSet.has(mesa.id)) {
          if (mesa.capacity <= 2) capacidadDisponible.pequena++;
          else if (mesa.capacity <= 4) capacidadDisponible.mediana++;
          else capacidadDisponible.grande++;
        }
      });
      
      // Verificar si la combinación Mesa 2+3 está disponible para aumentar capacidad grande
      const mesa2Available = !blockedSet.has(2);
      const mesa3Available = !blockedSet.has(3);
      if (mesa2Available && mesa3Available) {
        capacidadDisponible.grande++; // Añadir una capacidad más para la combinación 2+3
      }
      
      // Contar mesas ya ocupadas por reservas, considerando combinaciones
      const mesasOcupadas = {
        pequena: 0,
        mediana: 0,
        grande: 0
      };
      
      // Contar también mesas que están asignadas (incluye combinaciones)
      const mesasAsignadas = new Set();
      
      reservasDelDia.forEach(reserva => {
        if (reserva.personas <= 2) mesasOcupadas.pequena++;
        else if (reserva.personas <= 4) mesasOcupadas.mediana++;
        else mesasOcupadas.grande++;
        
        // Registrar mesas asignadas para verificar disponibilidad real
        if (reserva.mesaAsignada) {
          if (typeof reserva.mesaAsignada === 'string' && reserva.mesaAsignada.includes('+')) {
            // Es una combinación, marcar ambas mesas como ocupadas
            const tableIds = reserva.mesaAsignada.split('+').map(id => parseInt(id));
            tableIds.forEach(id => mesasAsignadas.add(id));
          } else {
            mesasAsignadas.add(parseInt(reserva.mesaAsignada));
          }
        }
      });
      
      // Verificar específicamente si la combinación 2+3 está disponible
      const mesa2Ocupada = mesasAsignadas.has(2) || blockedSet.has(2);
      const mesa3Ocupada = mesasAsignadas.has(3) || blockedSet.has(3);
      const combinacion23Disponible = !mesa2Ocupada && !mesa3Ocupada;
      
      // Ajustar capacidad grande si la combinación 2+3 no está disponible
      if (!combinacion23Disponible && capacidadDisponible.grande > 1) {
        capacidadDisponible.grande--; // Reducir capacidad si la combinación no está disponible
      }
      
      // Verificar si hay capacidad disponible para el tamaño de reserva actual
      const hayCapacidad = 
        (reservaData.personas <= 2 && mesasOcupadas.pequena < capacidadDisponible.pequena) ||
        (reservaData.personas <= 4 && mesasOcupadas.mediana < capacidadDisponible.mediana) ||
        (reservaData.personas > 4 && mesasOcupadas.grande < capacidadDisponible.grande);
      
      // Si hay capacidad, devolver todos los horarios disponibles
      return hayCapacidad ? HORARIOS[turno] : [];
      
    } catch (error) {
      console.error('Error al cargar bloqueos para cupos dinámicos:', error);
      // Fallback al sistema anterior en caso de error - convertir a formato simple
      const slots = await getAvailableSlots(fecha, turno);
      return slots.map(slot => slot.horario);
    }
  };

  const getAvailableSlots = async (fecha, turno) => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const dayOfWeek = fechaObj.getDay();
    
    // Usar nueva función unificada para verificar si está cerrado
    if (isTurnoClosed(dayOfWeek, turno)) {
      return []; // Día/turno cerrado según configuración
    }
    
    // Filtrar reservas por fecha y turno
    const reservasDelDia = data.reservas.filter(
      r => r.fecha === fecha && r.turno === turno
    );
    
    // Calcular ocupación por horario
    const ocupacionPorHorario = {};
    reservasDelDia.forEach(reserva => {
      const horario = reserva.horario;
      if (!ocupacionPorHorario[horario]) {
        ocupacionPorHorario[horario] = 0;
      }
      ocupacionPorHorario[horario] += reserva.personas || 1;
    });
    
    // Generar slots con cupos disponibles (formato requerido por CreateReservationModal)
    return HORARIOS[turno].map(horario => ({
      horario,
      cuposDisponibles: Math.max(0, 30 - (ocupacionPorHorario[horario] || 0)) // 30 personas máximo por horario
    }));
  };

  // FUNCIÓN SIMPLIFICADA: Usar lógica unificada
  const getAvailableSlotsDynamicSimplified = async (fecha, turno) => {
    return await calculateAvailableSlots(
      fecha,
      turno,
      reservaData?.personas || null,
      null, // Sin exclusión de reserva
      data.reservas,
      handleLoadBlockedTables,
      false // No es admin mode
    );
  };

  const getAvailableSlotsForEdit = async (fecha, turno, personas, excludeReservationId) => {
    return await calculateAvailableSlots(
      fecha,
      turno,
      personas,
      excludeReservationId,
      data.reservas,
      handleLoadBlockedTables,
      true // Admin mode para edición
    );
  };

  const isValidDate = (fecha, turno = null, adminOverride = false) => {
    return isValidReservationDate(fecha, turno || 'mediodia', adminOverride);
  };

  const handleLogin = async (username, password) => {
    try {
      let email;
      let role;

      // Determinar el rol basado en el nombre de usuario
      if (username === 'admin') {
        email = import.meta.env.VITE_ADMIN_EMAIL;
        role = 'admin';
      } else if (username === 'mozo') {
        email = import.meta.env.VITE_MOZO_EMAIL;
        role = 'mozo';
      } else {
        return "Usuario no válido";
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      setAuthState({ user: username, role });
      return null; // Login exitoso
    } catch (error) {
      console.error("Error de login:", error);
      return "Usuario o contraseña incorrectos";
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthState(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleSetBlacklist = async (clienteId, newStatus) => {
    try {
      await updateClientBlacklist(clienteId, newStatus);
    } catch (error) {
      console.error("Error al actualizar lista negra:", error);
      alert("Error al actualizar el estado del cliente");
    }
  };

  const handleUpdateClientNotes = async (clienteId, notes) => {
    try {
      await updateClientNotes(clienteId, notes);
      return true;
    } catch (error) {
      console.error("Error al actualizar notas del cliente:", error);
      throw error;
    }
  };

  const handleDateAndTurnoSubmit = async () => {
    // Convertir fecha a string si es necesario
    const fechaString = formatDateToString(reservaData.fecha);
      
    if (!isValidDate(fechaString)) {
      alert('Por favor selecciona una fecha válida (desde hoy hasta 1 mes en el futuro).');
      return;
    }
    if (!reservaData.turno) {
      alert('Por favor, seleccioná un turno.');
      return;
    }
    // Usar el sistema dinámico de cupos que respeta los bloqueos
          const slots = await getAvailableSlotsDynamicSimplified(fechaString, reservaData.turno);
    
    // Si no hay slots disponibles, ir directamente a recopilar datos para lista de espera
    if (slots.length === 0) {
      // Actualizar estado para indicar que iremos a lista de espera
      setReservaData(prev => ({
        ...prev,
        fecha: fechaString,
        willGoToWaitingList: true
      }));
      setCurrentScreen('contacto'); // Ir directo a contacto para recopilar datos
      return;
    }
    
    setAvailableSlots(slots);
    setCurrentScreen('horario');
  };

  const handleHorarioSelect = (selectedHorario) => {
    setReservaData(prev => ({ ...prev, horario: selectedHorario }));
    setCurrentScreen('contacto');
  };

  const handleContactoSubmit = async () => {
    // Prevenir envíos duplicados
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      console.log('🔄 Creando reserva desde cliente con servicio unificado:', reservaData);
      
      const result = await createReservation({
        reservationData: reservaData,
        existingReservations: data.reservas,
        getAvailableSlots: getAvailableSlotsDynamicSimplified,
        loadBlockedTables: handleLoadBlockedTables,
        isAdmin: false // Modo cliente: validaciones estrictas
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Resultado de creación:', result);

      // Manejar resultado según el tipo
      if (result.type === 'waiting') {
        // Lista de espera
        setReservaData({
          ...reservaData,
          ...result.data
        });
        setShowWaitingListModal(true);
        setCurrentScreen('lista-espera');
      } else {
        // Reserva confirmada
        setReservaData({
          ...reservaData,
          ...result.data
        });
        setShowReservationModal(true);
        setCurrentScreen('confirmacion');
      }

    } catch (error) {
      console.error("❌ Error al crear reserva:", error);
      alert("Error al crear la reserva. Por favor, intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    
    let date;
    if (dateInput instanceof Date) {
      // Si ya es un objeto Date, usarlo directamente
      date = dateInput;
    } else {
      // Si es un string, convertirlo a Date
      date = new Date(dateInput + "T00:00:00");
    }
    
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Función específica para crear reservas desde el panel de admin usando el servicio unificado
  const handleSaveReservation = async (reservationData) => {
    try {
      console.log('🔄 Creando reserva desde admin con servicio unificado:', reservationData);
      
      const result = await createReservation({
        reservationData,
        existingReservations: data.reservas,
        getAvailableSlots,
        loadBlockedTables: handleLoadBlockedTables,
        isAdmin: true // Modo admin: sin restricciones estrictas
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Reserva admin creada exitosamente:', result.data);
      
      // ✅ NO actualizar estado manual - la suscripción en tiempo real lo hará automáticamente
      // Esto evita duplicados en la lista de reservas
      
      return result.data;
    } catch (error) {
      console.error('❌ Error al crear reserva desde admin:', error);
      throw error;
    }
  };

  const handleUpdateReservation = async (reservationId, updatedData, adminOverride = false) => {
    try {
      // Si es actualización de solo mesaAsignada (admin), buscar la reserva original y combinar datos
      let fullData = updatedData;
      if (adminOverride && Object.keys(updatedData).length === 1 && updatedData.mesaAsignada) {
        const original = data.reservas.find(r => r.id === reservationId);
        if (!original) throw new Error('Reserva original no encontrada');
        fullData = { ...original, mesaAsignada: updatedData.mesaAsignada };
      }

      const fechaString = formatDateToString(fullData.fecha);

      if (!isValidDate(fechaString, fullData.turno, adminOverride)) {
        throw new Error('Por favor selecciona una fecha válida (desde hoy hasta 1 mes en el futuro).');
      }

      const slots = getAvailableSlotsForEdit(
        fechaString,
        fullData.turno,
        fullData.personas,
        reservationId
      );

      if (!adminOverride && !slots.includes(fullData.horario)) {
        throw new Error('El horario seleccionado no está disponible. Por favor, elige otro horario.');
      }

      // Limpiar objeto cliente para eliminar campos undefined (Firebase no los acepta)
      const cleanCliente = {};
      Object.keys(fullData.cliente).forEach(key => {
        const value = fullData.cliente[key];
        if (value !== undefined && value !== null && value !== '') {
          cleanCliente[key] = value;
        }
      });
      
      const reservationUpdate = {
        ...fullData,
        fecha: fechaString,
        cliente: {
          ...cleanCliente,
          ultimaReserva: fechaString
        },
      };
      
      delete reservationUpdate.id;

      await updateReservation(reservationId, reservationUpdate);
      return true;
    } catch (error) {
      console.error("Error al actualizar reserva:", error);
      throw error;
    }
  };

  const handleSearchReservation = async (searchData) => {
    try {
      return await searchReservation(searchData);
    } catch (error) {
      console.error("Error al buscar reserva:", error);
      alert("Error al buscar la reserva. Por favor, intenta nuevamente.");
      return null;
    }
  };

  const handleDeleteReservation = async (documentId) => {
    try {
      await deleteReservation(documentId);
      return true;
    } catch (error) {
      console.error("Error al eliminar reserva:", error);
      throw error;
    }
  };

  // === FUNCIONES PARA LISTA DE ESPERA ===
  
  const handleConfirmWaitingReservation = async (waitingReservationId, waitingData, selectedHorario, currentBlocked = null) => {
    try {
      // Verificar que aún hay cupo disponible antes de confirmar
      const slotsDisponibles = await getAvailableSlots(waitingData.fecha, waitingData.turno);
      if (slotsDisponibles.length === 0) {
        throw new Error('Ya no hay cupos disponibles para este turno.');
      }

      // Crear datos temporales para asignación de mesa
      const tempReservationData = {
        ...waitingData,
        horario: selectedHorario
      };

      // Usar bloqueos específicos del turno si están disponibles, sino usar los predeterminados
      let blockedTables = currentBlocked;
      if (!blockedTables) {
        blockedTables = new Set();
        Object.values(DEFAULT_BLOCKED_TABLES).flat().forEach(tableId => {
          blockedTables.add(tableId);
        });
      }

      // Filtrar reservas del mismo turno y fecha para verificar conflictos
      const reservasDelTurno = data.reservas.filter(
        r => r.fecha === waitingData.fecha && r.turno === waitingData.turno
      );

      const mesaAsignada = assignTableToNewReservation(tempReservationData, reservasDelTurno, blockedTables);

      // Limpiar objeto cliente de la waiting list
      const cleanClienteWaiting = {};
      if (waitingData.cliente) {
        Object.keys(waitingData.cliente).forEach(key => {
          const value = waitingData.cliente[key];
          if (value !== undefined && value !== null && value !== '') {
            cleanClienteWaiting[key] = value;
          }
        });
      }

      // Confirmar la reserva desde lista de espera con mesa asignada
      const { id, reservationId } = await confirmWaitingReservation(waitingReservationId, {
        ...waitingData,
        cliente: cleanClienteWaiting,
        horario: selectedHorario, // Usar el horario seleccionado por el admin
        mesaAsignada: mesaAsignada // Agregar mesa asignada
      });

      console.log('Reserva confirmada desde lista de espera con mesa:', mesaAsignada);

      return { id, reservationId };
    } catch (error) {
      console.error("Error al confirmar reserva desde lista de espera:", error);
      throw error;
    }
  };

  const handleDeleteWaitingReservation = async (waitingReservationId) => {
    try {
      await deleteWaitingReservation(waitingReservationId);
      return true;
    } catch (error) {
      console.error("Error al eliminar reserva de lista de espera:", error);
      throw error;
    }
  };

  const handleMarkAsNotified = async (waitingReservationId) => {
    try {
      await markWaitingAsNotified(waitingReservationId);
      return true;
    } catch (error) {
      console.error("Error al marcar como notificada:", error);
      throw error;
    }
  };

  const handleContactWaitingClient = async (waitingReservationId, waitingData = null) => {
    try {
      await contactWaitingClient(waitingReservationId, waitingData);
      return true;
    } catch (error) {
      console.error("Error al contactar cliente:", error);
      throw error;
    }
  };

  const handleRejectWaitingReservation = async (waitingReservationId, reason = '') => {
    try {
      await rejectWaitingReservation(waitingReservationId, reason);
      return true;
    } catch (error) {
      console.error("Error al rechazar reserva:", error);
      throw error;
    }
  };

  // === FUNCIONES PARA BLOQUEOS DE MESAS ===
  
  const handleSaveBlockedTables = async (fecha, turno, blockedTablesArray) => {
    try {
      // Aquí deberías implementar la lógica para guardar en tu base de datos
      // Por ahora, usaremos localStorage como ejemplo
      const key = `blockedTables_${fecha}_${turno}`;
      localStorage.setItem(key, JSON.stringify(blockedTablesArray));
      return true;
    } catch (error) {
      console.error("Error al guardar bloqueos de mesas:", error);
      throw error;
    }
  };

  const handleLoadBlockedTables = async (fecha, turno) => {
    try {
      // Aquí deberías implementar la lógica para cargar desde tu base de datos
      // Por ahora, usaremos localStorage como ejemplo
      const key = `blockedTables_${fecha}_${turno}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error al cargar bloqueos de mesas:", error);
      return null;
    }
  };





  // Usar el nuevo sistema de routing modular
  return (
    <>
      <AppRouter
      // Props para auth state
      authState={authState}
      
      // Props para admin
      data={data}
      auth={authState}
      onLogout={handleLogout}
      onSetBlacklist={handleSetBlacklist}
      onUpdateClientNotes={handleUpdateClientNotes}
      onUpdateReservation={handleUpdateReservation}
      onDeleteReservation={handleDeleteReservation}
      handleSaveReservation={handleSaveReservation}
      onConfirmWaitingReservation={handleConfirmWaitingReservation}
      onDeleteWaitingReservation={handleDeleteWaitingReservation}
      onMarkAsNotified={handleMarkAsNotified}
      onContactWaitingClient={handleContactWaitingClient}
      onRejectWaitingReservation={handleRejectWaitingReservation}
      onSaveBlockedTables={handleSaveBlockedTables}
      onLoadBlockedTables={handleLoadBlockedTables}
      getAvailableSlotsForEdit={getAvailableSlotsForEdit}
      getAvailableSlots={getAvailableSlots}
      isValidDate={isValidDate}
      formatDate={formatDate}
      HORARIOS={HORARIOS}
      showNotification={showNotification}
      showConfirmationDialog={showConfirmationDialog}
      editingReservation={editingReservation}
      setEditingReservation={setEditingReservation}
      
      // Props para client
      LOGO_URL={LOGO_URL}
      BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
      reservaData={reservaData}
      setReservaData={setReservaData}
      availableSlots={availableSlots}
      showConfirmation={showConfirmation}
      setShowConfirmation={setShowConfirmation}
      handleDateAndTurnoSubmit={handleDateAndTurnoSubmit}
      handleHorarioSelect={handleHorarioSelect}
      handleContactoSubmit={handleContactoSubmit}
      handleSearchReservation={handleSearchReservation}
      handleUpdateReservation={handleUpdateReservation}
      handleDeleteReservation={handleDeleteReservation}
      showReservationModal={showReservationModal}
      setShowReservationModal={setShowReservationModal}
      showWaitingListModal={showWaitingListModal}
      setShowWaitingListModal={setShowWaitingListModal}
      waitingList={data.waitingList || []}
      allReservations={data.reservas || []}
      handleLogin={handleLogin}
      />
      
      {/* Componentes de UI globales */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={closeNotification} 
      />
      <ConfirmationModal 
        confirmation={confirmation}
        onConfirm={() => handleConfirmation(true)}
        onCancel={() => handleConfirmation(false)}
      />
    </>
  );
}

export default App;