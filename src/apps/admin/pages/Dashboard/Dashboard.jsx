import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ThumbsDown, MessageCircle, Check, Edit2, Trash2, CheckCircle, X, XCircle, AlertTriangle, Sun, Moon, Clock, Printer, ChevronLeft, ChevronRight, Calendar, Users, Phone, Lock, Unlock, MapPin, Plus, Zap } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import "../../../../datepicker-custom.css";

import { formatPhoneForWhatsApp } from '../../../../utils/phoneUtils';
import InteractiveMapController from '../../../../shared/components/InteractiveMap/InteractiveMapController';
import CreateReservationModal from '../../../../shared/components/modals/CreateReservationModal';
import EditReservationModal from '../../../../shared/components/modals/EditReservationModal';
import { UNIFIED_TABLES_LAYOUT } from '../../../../utils/tablesLayout';
import { TABLES_LAYOUT, calculateAutoAssignments, setsAreEqual, detectWalkInQuotaChanges, calculateWalkInQuotas } from '../../../../utils/mesaLogic';
import { saveTableAssignments, saveBlockedTables, loadBlockedTables, reassignTableManually, validateTableAssignment, checkTableReassignmentNeeded } from '../../../../utils/mesaLogic';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { formatDateToString } from '../../../../utils';

import styles from './Dashboard.module.css';
import mapStyles from '../../../../shared/components/InteractiveMap/InteractiveMapController.module.css';

// Registrar locale español para el DatePicker
registerLocale('es', es);

// Modales reutilizados de AdminView
const ConfirmationModal = ({ confirmation, onConfirm, onCancel }) => {
  if (!confirmation) return null;

  const getIcon = () => {
    if (confirmation.title?.toLowerCase().includes('eliminar') || confirmation.title?.toLowerCase().includes('borrar')) {
      return <XCircle size={24} style={{ color: '#dc2626' }} />;
    }
    if (confirmation.title?.toLowerCase().includes('lista negra')) {
      return <ThumbsDown size={24} style={{ color: '#f59e0b' }} />;
    }
    return <AlertTriangle size={24} style={{ color: '#f59e0b' }} />;
  };

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.confirmationModal}>
        <div className={styles.confirmationHeader}>
          <div className={styles.confirmationIcon}>
            {getIcon()}
          </div>
          <div className={styles.confirmationContent}>
            <h3 className={styles.confirmationTitle}>{confirmation.title}</h3>
            <p className={styles.confirmationMessage}>{confirmation.message}</p>
          </div>
        </div>
        <div className={styles.confirmationActions}>
          <button onClick={onCancel} className={styles.confirmationButtonCancel}>
            Cancelar
          </button>
          <button onClick={onConfirm} className={styles.confirmationButtonConfirm}>
            {confirmation.confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConflictModal = ({ conflict, onForce, onCancel }) => {
  if (!conflict) return null;

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.confirmationModal}>
        <div className={styles.confirmationHeader}>
          <div className={styles.confirmationIcon}>
            <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className={styles.confirmationContent}>
            <h3 className={styles.confirmationTitle}>Conflicto de Mesa Detectado</h3>
            <p className={styles.confirmationMessage}>{conflict.message}</p>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              border: '1px solid #fbbf24', 
              borderRadius: '0.5rem', 
              padding: '0.75rem',
              marginTop: '1rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                <strong>¿Deseas forzar la asignación?</strong> Esto reasignará la mesa y desasignará la reserva en conflicto.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.confirmationActions}>
          <button onClick={onCancel} className={styles.confirmationButtonCancel}>
            Cancelar
          </button>
          <button 
            onClick={onForce} 
            style={{ 
              backgroundColor: '#f59e0b',
              color: 'white'
            }}
            className={styles.confirmationButton}
          >
            Forzar Asignación
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard - Vista principal de administración (Vista "HOY")
 * 
 * Migrado completamente desde TodayView de AdminView.jsx
 * Contiene toda la funcionalidad crítica de gestión diaria
 */
const Dashboard = ({
  // Props de datos
  reservations = [],
  waitingList = [],
  
  // Props de acciones
  onSetBlacklist,
  onUpdateReservation,
  onDeleteReservation,
  onConfirmWaitingReservation,
  onDeleteWaitingReservation,
  onMarkAsNotified,
  onContactWaitingClient,
  onRejectWaitingReservation,
  onSaveBlockedTables,
  onLoadBlockedTables,
  
  // Props de utilidades
  getAvailableSlotsForEdit,
  getAvailableSlots,
  isValidDate,
  formatDate,
  HORARIOS,
  
  // Props de UI
  showNotification,
  showConfirmation,
  
  // Props de estado global
  editingReservation,
  setEditingReservation,
  
  // Props de navegación desde panorama
  initialDate,
  initialTurno,
  onDateTurnoSet
}) => {
  // Estados locales - copiados exactamente de TodayView
  const [selectedDate, setSelectedDate] = useState(initialDate || formatDateToString(new Date()));
  const [selectedTurno, setSelectedTurno] = useState(initialTurno || 'mediodia');
  const [assignmentMode, setAssignmentMode] = useState(false);
  const [tableAssignments, setTableAssignments] = useState({});
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState({});
  const [pendingBlockedTables, setPendingBlockedTables] = useState(new Set());
  const [editCuposMode, setEditCuposMode] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [pendingTableAssignment, setPendingTableAssignment] = useState(null);
  const [waitingListFilter, setWaitingListFilter] = useState('all');
  const [searchWaitingTerm, setSearchWaitingTerm] = useState('');
  const [blockedTables, setBlockedTables] = useState(new Set());
  const [confirmation, setConfirmation] = useState(null);
  
  // Estado para modal de crear reserva
  const [showCreateReservationModal, setShowCreateReservationModal] = useState(false);
  
  // Estado para popup de reserva (similar al InteractiveMapController)
  const [reservationPopup, setReservationPopup] = useState(null);

  // Orden de reserva de mesas - Actualizado
  const RESERVATION_ORDER = {
    2: [2, 8, 11, 21, 1, 31], // Mesas para 2 personas
    4: [9, 10, 6, 12, 13, 3],  // Mesas para 4 personas  
    6: [7]            // Mesa para 6 personas
  };

  // Función para formatear la fecha en dos líneas
  const formatDateTwoLines = (dateString) => {
    // Usar T00:00:00 para evitar problemas de zona horaria
    const date = new Date(dateString + "T00:00:00");
    const options = {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    };
    
    const fullFormat = date.toLocaleDateString('es-ES', options);
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const dateOnly = date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Capitalizar primera letra del día
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    return {
      dayName: capitalizedDay,
      dateOnly: dateOnly
    };
  };

  // Función para crear nuevas reservas
  const handleCreateReservation = async (reservationData) => {
    try {
      // Crear el cliente primero
      const { addClient, addReservation } = await import('../../../../firebase');
      
      const newClient = {
        nombre: reservationData.cliente.nombre,
        telefono: reservationData.cliente.telefono,
        comentarios: reservationData.cliente.comentarios || '',
        ultimaReserva: reservationData.fecha,
        listaNegra: false
      };

      // Agregar cliente a la base de datos
      const clientId = await addClient(newClient);

      // Crear nueva reserva
      const newReservation = {
        fecha: reservationData.fecha,
        turno: reservationData.turno,
        horario: reservationData.horario,
        personas: reservationData.personas,
        clienteId: clientId,
        cliente: newClient
      };

      // Agregar reserva a la base de datos
      const { id, reservationId } = await addReservation(newReservation);
      
      console.log('Nueva reserva creada:', { id, reservationId });
      
      // Cerrar modal y mostrar notificación
      setShowCreateReservationModal(false);
      showNotification?.('success', 'Reserva creada exitosamente');
      
      return { id, reservationId };
    } catch (error) {
      console.error("Error al crear reserva:", error);
      showNotification?.('error', 'Error al crear la reserva');
      throw error;
    }
  };

  // Funciones de navegación de fechas
  const goToPreviousDay = useCallback(() => {
    const currentDate = new Date(selectedDate + "T00:00:00");
    let previousDate;
    
    do {
      currentDate.setDate(currentDate.getDate() - 1);
      previousDate = formatDateToString(currentDate);
    } while (new Date(previousDate + "T00:00:00").getDay() === 1); // Saltar lunes
    
    setSelectedDate(previousDate);
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    const currentDate = new Date(selectedDate + "T00:00:00");
    let nextDate;
    
    do {
      currentDate.setDate(currentDate.getDate() + 1);
      nextDate = formatDateToString(currentDate);
    } while (new Date(nextDate + "T00:00:00").getDay() === 1); // Saltar lunes
    
    setSelectedDate(nextDate);
  }, [selectedDate]);

  const handleDateSelect = useCallback((date) => {
    if (date) {
      const selectedDateStr = formatDateToString(date);
      setSelectedDate(selectedDateStr);
      setShowDatePicker(false);
    }
  }, []);

  // Verificar si un día está disponible
  const isDayAvailable = useCallback((date, turno = null) => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 1) return false; // Lunes cerrado
    if (dayOfWeek === 0 && turno === 'noche') return false; // Domingos sin turno noche
    return true;
  }, []);

  // Filtrar reservas por fecha y turno seleccionados
  const reservationsForSelectedDate = useMemo(() => 
    Array.isArray(reservations) ? reservations.filter(r => r.fecha === selectedDate) : [], 
    [reservations, selectedDate]
  );

  const reservasTurnoSeleccionado = useMemo(() => 
    Array.isArray(reservationsForSelectedDate) ? reservationsForSelectedDate.filter(r => r.turno === selectedTurno) : [], 
    [reservationsForSelectedDate, selectedTurno]
  );

  // Agrupación por turno para compatibilidad
  const reservasPorTurno = useMemo(() => {
    const validReservations = Array.isArray(reservationsForSelectedDate) ? reservationsForSelectedDate : [];
    return {
      mediodia: validReservations.filter(r => r.turno === 'mediodia'),
      noche: validReservations.filter(r => r.turno === 'noche')
    };
  }, [reservationsForSelectedDate]);

  // Obtener asignaciones de mesas desde las reservas guardadas (función estable)
  const getTableAssignments = (reservations) => {
    const assignments = {};
    
    reservations.forEach(reserva => {
      if (reserva.mesaAsignada) {
        assignments[reserva.id] = reserva.mesaAsignada;
      }
    });
    
    return assignments;
  };

  // Cargar asignaciones desde la base de datos
  useEffect(() => {
    const savedAssignments = getTableAssignments(reservasTurnoSeleccionado);
    setTableAssignments(savedAssignments);
    setPendingAssignments(savedAssignments);
  }, [reservasTurnoSeleccionado]); // Remover getTableAssignments de dependencias

    // Cargar bloqueos guardados
  useEffect(() => {
    const loadSavedBlocked = async () => {
      try {
        if (onLoadBlockedTables) {
          const saved = await onLoadBlockedTables(selectedDate, selectedTurno);
          if (saved) {
            const blockedSet = new Set(saved);
            setBlockedTables(blockedSet);
            setPendingBlockedTables(blockedSet);
            return;
          }
        }
        
                 // Usar defaults si no hay guardados o no hay función
        const defaultBlocked = new Set();
        // Defaults básicos para walk-in (mesas bloqueadas por defecto)
        [24, 14, 5, 4].forEach(tableId => {
          defaultBlocked.add(tableId);
        });
        setBlockedTables(defaultBlocked);
        setPendingBlockedTables(defaultBlocked);
      } catch (error) {
        console.error('Error loading blocked tables:', error);
        // En caso de error, usar defaults
        const defaultBlocked = new Set();
        setBlockedTables(defaultBlocked);
        setPendingBlockedTables(defaultBlocked);
      }
    };
    
    loadSavedBlocked();
  }, [selectedDate, selectedTurno]); // Solo depender de fecha y turno

  // Cerrar datepicker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest('.react-datepicker') && !event.target.closest('[title="Seleccionar fecha"]')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Cambiar a mediodía automáticamente si es domingo
  useEffect(() => {
    const selectedDateObj = new Date(selectedDate);
    if (selectedDateObj.getDay() === 0 && selectedTurno === 'noche') {
      setSelectedTurno('mediodia');
    }
  }, [selectedDate, selectedTurno]);

  // Manejar fecha y turno inicial desde panorama
  useEffect(() => {
    if (initialDate && initialTurno) {
      setSelectedDate(initialDate);
      setSelectedTurno(initialTurno);
      if (onDateTurnoSet) {
        onDateTurnoSet();
      }
    }
  }, [initialDate, initialTurno]); // Remover onDateTurnoSet de dependencias

  // Funciones de manejo de mesas
  const isMesaOcupada = (mesaId) => {
    // Verificar en asignaciones pendientes
    const pendingValues = Object.values(pendingAssignments);
    for (const assignment of pendingValues) {
      if (assignment === mesaId) {
        return true;
      }
      if (typeof assignment === 'string' && assignment.includes('+')) {
        const tableIds = assignment.split('+').map(id => parseInt(id));
        if (tableIds.includes(mesaId)) {
          return true;
        }
      }
    }
    
    // Verificar en reservas ya guardadas
    const reservasDelTurno = reservasPorTurno[selectedTurno] || [];
    return reservasDelTurno.some(reserva => {
      if (!reserva.mesaAsignada) return false;
      
      if (reserva.mesaAsignada === mesaId) {
        return true;
      }
      
      if (typeof reserva.mesaAsignada === 'string' && reserva.mesaAsignada.includes('+')) {
        const tableIds = reserva.mesaAsignada.split('+').map(id => parseInt(id));
        return tableIds.includes(mesaId);
      }
      
      return false;
    });
  };

  const isMesaBloqueada = (mesaId) => blockedTables.has(mesaId);

  const getMesaEstado = (mesaId) => {
    if (isMesaOcupada(mesaId)) return 'occupied';
    if (isMesaBloqueada(mesaId)) return 'blocked';
    return 'available';
  };

  const toggleTableBlock = (tableId) => {
    const newBlocked = new Set(pendingBlockedTables);
    if (newBlocked.has(tableId)) {
      newBlocked.delete(tableId);
    } else {
      newBlocked.add(tableId);
    }
    setPendingBlockedTables(newBlocked);
  };

  // Función para comparar asignaciones pendientes con las guardadas
  const hasUnsavedAssignments = () => {
    // Si no hay asignaciones pendientes, no hay cambios
    if (Object.keys(pendingAssignments).length === 0) {
      return false;
    }
    
    // Comparar cada asignación pendiente con la guardada
    for (const [reservationId, tableId] of Object.entries(pendingAssignments)) {
      if (tableAssignments[reservationId] !== tableId) {
        return true;
      }
    }
    
    // Verificar si se eliminaron asignaciones
    for (const reservationId of Object.keys(tableAssignments)) {
      if (!pendingAssignments[reservationId]) {
        return true;
      }
    }
    
    return false;
  };

  const handleSaveChanges = async () => {
    try {
      let assignmentsCount = 0;
      let blockedChanged = false;
      
      // Guardar asignaciones de mesas (SIN mostrar notificación aquí)
      if (hasUnsavedAssignments()) {
        await saveTableAssignments(pendingAssignments, onUpdateReservation, null); // null para suprimir notificación
        setTableAssignments(pendingAssignments);
        assignmentsCount = Object.keys(pendingAssignments).length;
      }

      // Guardar bloqueos de mesas
      if (!setsAreEqual(blockedTables, pendingBlockedTables)) {
        await onSaveBlockedTables?.(selectedDate, selectedTurno, Array.from(pendingBlockedTables));
        setBlockedTables(pendingBlockedTables);
        blockedChanged = true;
      }

      // Calcular cupos disponibles
      const newQuotas = calculateWalkInQuotas(pendingBlockedTables);
      
             // Mostrar UNA notificación final con toda la información
       let message = 'Cambios guardados exitosamente';
       if (assignmentsCount > 0) {
         message += ` • ${assignmentsCount} mesa${assignmentsCount > 1 ? 's asignadas' : ' asignada'}`;
       }
       if (blockedChanged || assignmentsCount > 0) {
         message += ` • ${newQuotas} cupos walk-in disponibles`;
       }
       
       // Desactivar modos automáticamente
       handleCancelAssignmentMode();
       setEditCuposMode(false);
       
       showNotification?.('success', message);
    } catch (error) {
      console.error('Error saving changes:', error);
      showNotification?.('error', 'Error al guardar los cambios');
    }
  };

  const handleCancelChanges = () => {
    setPendingAssignments(tableAssignments);
    setPendingBlockedTables(blockedTables);
    setEditCuposMode(false);
    handleCancelAssignmentMode();
  };

  // Función para cancelar modo asignación (usado cuando se termina una asignación individual)
  const handleCancelAssignmentMode = () => {
    setAssignmentMode(false);
    setSelectedReservation(null);
  };

  // Función para asignar mesa desde la tarjeta de reserva
  const handleAssignTableFromCard = (reservation, event) => {
    event.stopPropagation(); // Evitar que se active el click del card
    setAssignmentMode(true);
    setSelectedReservation(reservation);
    setEditCuposMode(false); // Asegurar que no estemos en modo cupos
    showNotification?.('info', `Modo asignación activado para ${reservation.cliente?.nombre}. Haz clic en una mesa disponible.`);
  };

  // Función para contactar cliente desde el botón de teléfono
  const handleContactClientFromCard = (reservation, event) => {
    event.stopPropagation(); // Evitar que se active el click del card
    if (reservation.cliente?.telefono) {
      const message = `¡Hola ${reservation.cliente.nombre}! Te contactamos desde Rosaura sobre tu reserva para ${reservation.personas} personas el ${formatDate(reservation.fecha)} a las ${reservation.horario}. ¡Te esperamos! 🌹`;
      const whatsappUrl = `https://wa.me/${reservation.cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      showNotification?.('success', `Contactando a ${reservation.cliente.nombre} por WhatsApp`);
    } else {
      showNotification?.('warning', 'No hay número de teléfono disponible');
    }
  };

  // Función para obtener el texto del botón de mesa
  const getTableButtonText = (reserva) => {
    const effectiveAssignment = getEffectiveTableAssignment(reserva.id, reserva.mesaAsignada);
    if (effectiveAssignment && effectiveAssignment !== 'Sin asignar') {
      return `Mesa ${effectiveAssignment}`;
    }
    return 'Asignar Mesa';
  };

  // Función para obtener el estilo del botón de mesa
  const getTableButtonStyle = (reserva) => {
    const effectiveAssignment = getEffectiveTableAssignment(reserva.id, reserva.mesaAsignada);
    if (effectiveAssignment && effectiveAssignment !== 'Sin asignar') {
      const isPending = pendingAssignments[reserva.id] && pendingAssignments[reserva.id] !== reserva.mesaAsignada;
      return isPending ? 'tableButtonPending' : 'tableButtonAssigned';
    }
    return 'tableButtonUnassigned';
  };

  const handleClearAssignments = async () => {
    const confirmed = await showConfirmation?.({
      title: 'Limpiar todas las asignaciones',
      message: '¿Estás seguro? Esto eliminará todas las asignaciones de mesa del turno actual.',
      confirmText: 'Sí, limpiar todo'
    });
    
    if (confirmed) {
      // Limpiar todas las asignaciones pendientes
      setPendingAssignments({});
      
      // Limpiar asignaciones guardadas de las reservas del turno
      const clearPromises = reservasTurnoSeleccionado.map(reserva => {
        if (reserva.mesaAsignada && reserva.mesaAsignada !== 'Sin asignar') {
          return onUpdateReservation(reserva.id, { mesaAsignada: 'Sin asignar' }, true);
        }
        return Promise.resolve();
      });
      
      Promise.all(clearPromises).then(() => {
        // Actualizar también las asignaciones locales
        setTableAssignments({});
        showNotification?.('success', '🗑️ Todas las asignaciones han sido eliminadas. Listo para asignación manual.');
        setAssignmentMode(true);
        setSelectedReservation(null);
      }).catch(error => {
        console.error('Error al limpiar asignaciones:', error);
        showNotification?.('error', 'Error al limpiar algunas asignaciones');
      });
    }
  };

  const handleAutoAssignTables = async () => {
    const confirmed = await showConfirmation?.({
      title: 'Asignar automáticamente',
      message: '¿Deseas que el sistema asigne automáticamente las mesas según la lógica preestablecida?',
      confirmText: 'Sí, asignar automáticamente'
    });
    
    if (confirmed) {
      try {
        // Obtener reservas sin mesa asignada del turno actual
        const reservasSinAsignar = reservasTurnoSeleccionado.filter(reserva => 
          !reserva.mesaAsignada || reserva.mesaAsignada === 'Sin asignar'
        );

        if (reservasSinAsignar.length === 0) {
          showNotification?.('info', 'No hay reservas sin asignar en este turno');
          return;
        }

        // Calcular asignaciones automáticas
        const result = calculateAutoAssignments(reservasSinAsignar, pendingBlockedTables);
        
        if (Object.keys(result.assignments).length === 0) {
          showNotification?.('warning', 'No se pudieron asignar mesas automáticamente. Verifica las mesas bloqueadas.');
          return;
        }

        // Aplicar las asignaciones pendientes
        setPendingAssignments(prev => ({
          ...prev,
          ...result.assignments
        }));

        const assignedCount = Object.keys(result.assignments).length;
        showNotification?.('success', `✨ ${assignedCount} mesa${assignedCount > 1 ? 's asignadas' : ' asignada'} automáticamente. Presiona "Guardar cambios" para confirmar.`);
        
        // Desactivar modo asignación manual
        setAssignmentMode(false);
        setSelectedReservation(null);
        
      } catch (error) {
        console.error('Error en asignación automática:', error);
        showNotification?.('error', 'Error al asignar mesas automáticamente');
      }
    }
  };

  const handleTableClick = async (tableId) => {
    // Modo edición de cupos
    if (editCuposMode) {
      if (isMesaOcupada(tableId)) {
        showNotification?.('warning', 'No puedes bloquear una mesa ocupada');
        return;
      }
      toggleTableBlock(tableId);
      // No mostrar notificación aquí - el usuario verá el resumen al guardar
      return;
    }

    // Modo asignación manual
    if (assignmentMode) {
      if (!selectedReservation) {
        showNotification?.('warning', 'Primero selecciona una reserva de la lista');
        return;
      }

      // Verificar si la mesa está ocupada
      if (isMesaOcupada(tableId)) {
        showNotification?.('error', 'Esta mesa ya está ocupada');
        return;
      }

      // Asignar mesa directamente
      const newAssignments = { ...pendingAssignments };
      newAssignments[selectedReservation.id] = tableId;
      setPendingAssignments(newAssignments);
      
      // Mostrar notificación de éxito y desactivar modo asignación
      showNotification?.('success', `Mesa ${tableId} asignada a ${selectedReservation.cliente?.nombre}. Recuerda guardar los cambios.`);
      handleCancelAssignmentMode(); // Desactivar modo automáticamente
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Funciones para lista de espera
  const handleContactWaitingClient = async (waiting) => {
    try {
      await onContactWaitingClient?.(waiting.id, waiting);
      showNotification?.('success', 'Cliente contactado exitosamente');
    } catch (error) {
      console.error('Error contactando cliente:', error);
      showNotification?.('error', 'Error al contactar al cliente');
    }
  };

  const handleQuickConfirmWaiting = async (waiting) => {
    try {
      const slots = getAvailableSlots?.(waiting.fecha, waiting.turno);
      if (!slots || slots.length === 0) {
        showNotification?.('warning', 'No hay horarios disponibles para este turno');
        return;
      }

      const selectedHorario = slots[0]; // Usar primer horario disponible
      await onConfirmWaitingReservation?.(waiting.id, waiting, selectedHorario, blockedTables);
      showNotification?.('success', 'Reserva confirmada desde lista de espera');
    } catch (error) {
      console.error('Error confirmando reserva:', error);
      showNotification?.('error', 'Error al confirmar la reserva');
    }
  };

  const handleRejectWaiting = async (waiting) => {
    try {
      await onRejectWaitingReservation?.(waiting.id, 'Rechazada por administrador');
      showNotification?.('info', 'Reserva rechazada');
    } catch (error) {
      console.error('Error rechazando reserva:', error);
      showNotification?.('error', 'Error al rechazar la reserva');
    }
  };

  const getWaitingStatusBadge = (waiting) => {
    const status = waiting.status || 'pending';
    const statusText = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      confirmed: 'Confirmada',
      rejected: 'Rechazada'
    };

    return (
      <span className={`${styles.statusBadge} ${styles[`status-${status}`]}`}>
        {statusText[status] || 'Pendiente'}
      </span>
    );
  };

  // Funciones para el popup de reserva (similar al InteractiveMapController)
  const closeReservationPopup = useCallback(() => {
    setReservationPopup(null);
  }, []);

  const handleReservationCardClick = useCallback((reservation, event) => {
    // Si estamos en modo asignación, usar la lógica existente
    if (assignmentMode) {
      setSelectedReservation(reservation);
      return;
    }

    // Si no, abrir el popup de detalles
    setReservationPopup({
      reservation,
      position: { x: event?.clientX || 0, y: event?.clientY || 0 }
    });
  }, [assignmentMode]);

  const handlePopupEditReservation = useCallback(() => {
    if (reservationPopup) {
      setEditingReservation(reservationPopup.reservation);
      closeReservationPopup();
    }
  }, [reservationPopup]);

  const handlePopupDeleteReservation = useCallback(async () => {
    if (reservationPopup) {
      const confirmed = await showConfirmation({
        title: 'Eliminar Reserva',
        message: `¿Estás seguro de que deseas eliminar la reserva de ${reservationPopup.reservation.cliente?.nombre}?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      });
      
      if (confirmed) {
        await onDeleteReservation(reservationPopup.reservation.id);
        showNotification?.('success', 'Reserva eliminada correctamente');
        closeReservationPopup();
      }
    }
  }, [reservationPopup, showConfirmation, onDeleteReservation, showNotification, closeReservationPopup]);

  const handlePopupContactClient = useCallback(() => {
    if (reservationPopup && reservationPopup.reservation.cliente?.telefono) {
      const message = `¡Hola ${reservationPopup.reservation.cliente.nombre}! Te contactamos desde Rosaura sobre tu reserva para ${reservationPopup.reservation.personas} personas el ${formatDate(reservationPopup.reservation.fecha)} a las ${reservationPopup.reservation.horario}. ¡Te esperamos! 🌹`;
      const whatsappUrl = `https://wa.me/${reservationPopup.reservation.cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      closeReservationPopup();
    } else {
      showNotification?.('warning', 'No hay número de teléfono disponible');
    }
  }, [reservationPopup, formatDate, showNotification, closeReservationPopup]);

  // Función helper para obtener la mesa asignada (incluyendo pendientes)
  const getEffectiveTableAssignment = useCallback((reservaId, savedAssignment) => {
    // Priorizar asignación pendiente si existe
    if (pendingAssignments[reservaId]) {
      return pendingAssignments[reservaId];
    }
    // Si no, usar la asignación guardada
    return savedAssignment;
  }, [pendingAssignments]);

  // Función helper para verificar si una reserva tiene mesa asignada (incluyendo pendientes)
  const hasTableAssignment = useCallback((reservaId, savedAssignment) => {
    const effectiveAssignment = getEffectiveTableAssignment(reservaId, savedAssignment);
    return effectiveAssignment && effectiveAssignment !== 'Sin asignar';
  }, [getEffectiveTableAssignment]);

  // Filtrar lista de espera
  const filteredWaitingList = useMemo(() => {
    if (!waitingList) return [];
    
    let filtered = waitingList.filter(waiting => {
      if (waiting.status === 'rejected') return false;
      
      if (waitingListFilter === 'with-waiting') {
        return waiting.fecha === selectedDate;
      }
      if (waitingListFilter === 'only-waiting') {
        return waiting.status === 'pending';
      }
      
      return true;
    });

    if (searchWaitingTerm) {
      const term = searchWaitingTerm.toLowerCase();
      filtered = filtered.filter(waiting => 
        waiting.cliente?.nombre?.toLowerCase().includes(term) ||
        waiting.cliente?.telefono?.includes(term)
      );
    }

    return filtered;
  }, [waitingList, waitingListFilter, searchWaitingTerm, selectedDate]);

  return (
    <div className={styles.todayContainer}>
      {/* Header simple para impresión */}
      <div className={styles.printHeader} style={{ display: 'none' }}>
        <h1>ROSAURA - {formatDateTwoLines(selectedDate).dayName} {formatDateTwoLines(selectedDate).dateOnly}</h1>
        <h2>Turno: {selectedTurno === 'mediodia' ? 'MEDIODÍA' : 'NOCHE'} | Reservas: {reservasTurnoSeleccionado.length} | Cupos Walk-in: {calculateWalkInQuotas(pendingBlockedTables)}</h2>
      </div>

      {/* Header con navegación de fechas y controles */}
      <div className={styles.todayHeader}>
        <div className={styles.todayHeaderContent}>
          <div className={styles.todayNavigation}>
            {/* Controles de Asignación */}
            <div className={styles.headerControlsGroup}>
              <button
                onClick={() => setShowCreateReservationModal(true)}
                className={styles.createReservationButton}
              >
                <Plus size={16} />
                Reserva
              </button>
              
              <button
                onClick={() => setEditCuposMode(!editCuposMode)}
                className={editCuposMode ? styles.editCuposButtonActive : styles.editCuposButtonInactive}
              >
                {editCuposMode ? <Lock size={16} /> : <Unlock size={16} />}
                Cupos
              </button>
              
              <button
                onClick={handleAutoAssignTables}
                className={styles.autoAssignButton}
                title="Asignar mesas automáticamente según la lógica preestablecida"
              >
                <MapPin size={16} />
                Autoasignar
              </button>
              
              <button
                onClick={handleClearAssignments}
                className={styles.clearButton}
                disabled={Object.keys(pendingAssignments).length === 0}
              >
                <Trash2 size={16} />
                Limpiar
              </button>
            </div>
          </div>

          <div className={styles.todayControls}>
            {/* Navegación de fechas - lado derecho */}
            <div className={styles.todayDateControls}>
              <button
                onClick={goToPreviousDay}
                className={styles.navButton}
                title="Día anterior"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className={styles.dateSelector}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={styles.cleanDateSelectorButton}
                  title="Seleccionar fecha"
                >
                  <Calendar size={18} />
                  <div className={styles.cleanDateSelectorContent}>
                    <div className={styles.cleanDateSelectorDay}>
                      {formatDateTwoLines(selectedDate).dayName}
                    </div>
                    <div className={styles.cleanDateSelectorDate}>
                      {formatDateTwoLines(selectedDate).dateOnly}
                    </div>
                  </div>
                </button>
                
                {showDatePicker && (
                  <div className={styles.datePickerDropdown}>
                    <DatePicker
                      selected={new Date(selectedDate + "T00:00:00")}
                      onChange={handleDateSelect}
                      locale="es"
                      inline
                      minDate={new Date()}
                      maxDate={(() => {
                        const maxDate = new Date();
                        maxDate.setMonth(maxDate.getMonth() + 1);
                        return maxDate;
                      })()}
                      filterDate={(date) => isDayAvailable(date)}
                      calendarClassName="admin-professional-calendar"
                    />
                  </div>
                )}
              </div>
              
              <button
                onClick={goToNextDay}
                className={styles.navButton}
                title="Día siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={styles.todayMainContent}>
        {/* Mapa de Mesas - Lado Izquierdo */}
        <div className={styles.mapSection}>
          {/* Controles de guardado */}
          {(hasUnsavedAssignments() || !setsAreEqual(blockedTables, pendingBlockedTables)) && (
            <div className={styles.changesAlert}>
              <div className={styles.changesAlertContent}>
                <div className={styles.changesAlertText}>
                  <strong>Cambios pendientes:</strong> 
                  {hasUnsavedAssignments() && ` ${Object.keys(pendingAssignments).length} asignaciones`}
                  {!setsAreEqual(blockedTables, pendingBlockedTables) && ` • Bloqueos modificados`}
                </div>
                <div className={styles.changesAlertButtons}>
                  <button
                    onClick={handleCancelChanges}
                    className={`${styles.alertButton} ${styles.alertButtonCancel}`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className={`${styles.alertButton} ${styles.alertButtonSave}`}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}

          <InteractiveMapController
            fecha={selectedDate}
            turno={selectedTurno}
            reservas={reservasTurnoSeleccionado}
            mode={editCuposMode ? 'cupos' : assignmentMode ? 'assignment' : 'view'}
            tableAssignments={pendingAssignments}
            blockedTables={pendingBlockedTables}
            onTableClick={handleTableClick}
            selectedReservation={selectedReservation}
            showNotification={showNotification}
            onEditReservation={(reservation) => {
              setEditingReservation(reservation);
            }}
            onDeleteReservation={async (reservation) => {
              const confirmed = await showConfirmation({
                title: 'Eliminar Reserva',
                message: `¿Estás seguro de que deseas eliminar la reserva de ${reservation.cliente?.nombre}?`,
                confirmText: 'Eliminar',
                cancelText: 'Cancelar'
              });
              
              if (confirmed) {
                await onDeleteReservation(reservation.id);
                showNotification?.('success', 'Reserva eliminada correctamente');
              }
            }}
            onContactClient={(reservation) => {
              if (reservation.cliente?.telefono) {
                const message = `¡Hola ${reservation.cliente.nombre}! Te contactamos desde Rosaura sobre tu reserva para ${reservation.personas} personas el ${formatDate(reservation.fecha)} a las ${reservation.horario}. ¡Te esperamos! 🌹`;
                const whatsappUrl = `https://wa.me/${reservation.cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              } else {
                showNotification?.('warning', 'No hay número de teléfono disponible');
              }
            }}
            formatDate={formatDate}
          />
        </div>

        {/* Lista de Reservas y Espera - Lado Derecho */}
        <div className={styles.reservationsSection}>
          {/* Botones de turno centrados arriba del título */}
          <div className={styles.centeredShiftSelector}>
            <div className={styles.unifiedShiftSelector}>
              <button
                onClick={() => setSelectedTurno('mediodia')}
                className={`${styles.unifiedShiftButton} ${styles.unifiedShiftButtonLeft} ${
                  selectedTurno === 'mediodia'
                    ? `${styles.unifiedShiftButtonActive} ${styles.unifiedShiftButtonMediodia}`
                    : styles.unifiedShiftButtonInactive
                }`}
              >
                <Sun size={16} />
                Mediodía
              </button>
              <button
                onClick={() => setSelectedTurno('noche')}
                disabled={new Date(selectedDate + "T00:00:00").getDay() === 0}
                className={`${styles.unifiedShiftButton} ${styles.unifiedShiftButtonRight} ${
                  new Date(selectedDate + "T00:00:00").getDay() === 0 
                    ? styles.controlButtonDisabled
                    : selectedTurno === 'noche'
                    ? `${styles.unifiedShiftButtonActive} ${styles.unifiedShiftButtonNoche}`
                    : styles.unifiedShiftButtonInactive
                }`}
                title={new Date(selectedDate + "T00:00:00").getDay() === 0 ? 'Los domingos no hay turno noche' : ''}
              >
                <Moon size={16} />
                Noche
              </button>
            </div>
          </div>

          <div className={styles.sectionHeader}>
            <h2>Reservas ({reservasTurnoSeleccionado.length})</h2>
            <button onClick={handlePrint} className={styles.printButton}>
              <Printer size={16} />
              Imprimir
            </button>
          </div>

          {/* Lista de reservas del turno seleccionado */}
          <div className={styles.reservationsList}>
            {reservasTurnoSeleccionado.length > 0 ? (
              reservasTurnoSeleccionado.map((reserva) => (
                <div
                  key={reserva.id}
                  className={`${styles.reservationCard} ${
                    selectedReservation?.id === reserva.id ? styles.reservationCardSelected : ''
                  }`}
                  onClick={(event) => handleReservationCardClick(reserva, event)}
                >
                  {/* Primer renglón: Nombre, personas, hora */}
                  <div className={styles.reservationFirstRow}>
                    <div className={styles.reservationNameContainer}>
                      <div className={styles.reservationName}>{reserva.cliente?.nombre}</div>
                      {!hasTableAssignment(reserva.id, reserva.mesaAsignada) && (
                        <div className={styles.noTableAssigned}>Sin mesa asignada</div>
                      )}
                    </div>
                    <div className={styles.reservationPeople}>
                      <Users size={14} />
                      <span>{reserva.personas}</span>
                    </div>
                    <div className={styles.reservationTime}>
                      <Clock size={14} />
                      <span>{reserva.horario}</span>
                    </div>
                    <div className={styles.reservationTable}>
                      {hasTableAssignment(reserva.id, reserva.mesaAsignada) ? 
                        `Mesa: ${getEffectiveTableAssignment(reserva.id, reserva.mesaAsignada)}` : 
                        'Sin mesa asignada'}
                    </div>
                  </div>

                  {/* Segundo renglón: Teléfono (botón), Mesa asignada (botón) */}
                  <div className={styles.reservationSecondRow}>
                    <button
                      onClick={(event) => handleContactClientFromCard(reserva, event)}
                      className={styles.phoneButton}
                      title={`Contactar a ${reserva.cliente?.nombre} por WhatsApp`}
                    >
                      <Phone size={14} />
                      <span>{reserva.cliente?.telefono}</span>
                    </button>

                    <button
                      onClick={(event) => handleAssignTableFromCard(reserva, event)}
                      className={`${styles.tableButton} ${styles[getTableButtonStyle(reserva)]}`}
                      title="Hacer clic para asignar o cambiar mesa"
                    >
                      <MapPin size={14} />
                      <span>{getTableButtonText(reserva)}</span>
                      {(() => {
                        const isPending = pendingAssignments[reserva.id] && pendingAssignments[reserva.id] !== reserva.mesaAsignada;
                        return isPending && <span className={styles.pendingIndicator}>(pendiente)</span>;
                      })()}
                    </button>
                  </div>

                  {/* Comentarios si existen */}
                  {reserva.cliente?.comentarios && (
                    <div className={styles.reservationComments}>{reserva.cliente.comentarios}</div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay reservas para este turno</p>
              </div>
            )}
          </div>

          {/* Lista de espera */}
          {filteredWaitingList.length > 0 && (
            <div className={styles.waitingListSection}>
              <div className={styles.sectionHeader}>
                <h3>Lista de Espera ({filteredWaitingList.length})</h3>
              </div>

              <div className={styles.waitingList}>
                {filteredWaitingList.map((waiting) => (
                  <div key={waiting.id} className={styles.waitingCard}>
                    <div className={styles.waitingInfo}>
                      <div className={styles.waitingName}>{waiting.cliente?.nombre}</div>
                      <div className={styles.waitingDetails}>
                        {waiting.personas} personas • {waiting.fecha}
                      </div>
                      <div className={styles.waitingPhone}>
                        <a href={`https://wa.me/${formatPhoneForWhatsApp(waiting.cliente?.telefono || '')}`} target="_blank" rel="noopener noreferrer">
                          {waiting.cliente?.telefono}
                        </a>
                      </div>
                      {getWaitingStatusBadge(waiting)}
                    </div>
                    <div className={styles.waitingActions}>
                      <button
                        onClick={() => handleContactWaitingClient(waiting)}
                        className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                        title="Contactar cliente"
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleQuickConfirmWaiting(waiting)}
                        className={`${styles.actionButton} ${styles.actionButtonSuccess}`}
                        title="Confirmar rápido"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleRejectWaiting(waiting)}
                        className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                        title="Rechazar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <ConflictModal
        conflict={conflict}
        onForce={() => setConflict(null)}
        onCancel={() => setConflict(null)}
      />

      <ConfirmationModal
        confirmation={confirmation}
        onConfirm={confirmation?.onConfirm}
        onCancel={confirmation?.onCancel}
      />

      {/* Modal para crear nueva reserva */}
      {showCreateReservationModal && (
        <CreateReservationModal
          onClose={() => setShowCreateReservationModal(false)}
          onSave={handleCreateReservation}
          getAvailableSlots={getAvailableSlots}
          isValidDate={isValidDate}
          HORARIOS={HORARIOS}
          showNotification={showNotification}
          isAdmin={true}
        />
      )}

      {/* Modal para editar reserva */}
      {editingReservation && (
        <EditReservationModal
          reservation={editingReservation}
          onClose={() => setEditingReservation(null)}
          onSave={async (updatedData) => {
            await onUpdateReservation(editingReservation.id, updatedData, true);
            setEditingReservation(null);
          }}
          getAvailableSlotsForEdit={getAvailableSlotsForEdit}
          isValidDate={isValidDate}
          HORARIOS={HORARIOS}
          showNotification={showNotification}
          isAdmin={true}
        />
      )}

      {/* Popup de detalles de reserva (similar al InteractiveMapController) */}
      {reservationPopup && (
        <div className={mapStyles.popupOverlay} onClick={closeReservationPopup}>
          <div 
            className={mapStyles.reservationPopup} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={mapStyles.popupHeader}>
              <div className={mapStyles.popupTitle}>
                <Users size={18} />
                <span>Reserva</span>
              </div>
              <button onClick={closeReservationPopup} className={mapStyles.popupCloseButton}>
                <X size={20} />
              </button>
            </div>
            
            <div className={mapStyles.popupContent}>
              <div className={mapStyles.reservationInfo}>
                <div className={mapStyles.clientName}>
                  {reservationPopup.reservation.cliente?.nombre || 'Sin nombre'}
                </div>
                
                <div className={mapStyles.reservationDetails}>
                  <div className={mapStyles.detailRow}>
                    <Clock size={16} />
                    <span>{reservationPopup.reservation.horario}</span>
                  </div>
                  
                  <div className={mapStyles.detailRow}>
                    <Users size={16} />
                    <span>{reservationPopup.reservation.personas} personas</span>
                  </div>
                  
                  {reservationPopup.reservation.mesaAsignada && (
                    <div className={mapStyles.detailRow}>
                      <MapPin size={16} />
                      <span>Mesa {reservationPopup.reservation.mesaAsignada}</span>
                    </div>
                  )}
                  
                  {reservationPopup.reservation.cliente?.telefono && (
                    <div className={mapStyles.detailRow}>
                      <Phone size={16} />
                      <span>{reservationPopup.reservation.cliente.telefono}</span>
                    </div>
                  )}
                  
                  {formatDate && (
                    <div className={mapStyles.detailRow}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {formatDate(reservationPopup.reservation.fecha)}
                      </span>
                    </div>
                  )}
                  
                  {reservationPopup.reservation.cliente?.comentarios && (
                    <div className={mapStyles.commentSection}>
                      <strong>Comentarios:</strong>
                      <p>{reservationPopup.reservation.cliente.comentarios}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={mapStyles.popupActions}>
                <button 
                  onClick={handlePopupEditReservation}
                  className={`${mapStyles.actionButton} ${mapStyles.editButton}`}
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                
                <button 
                  onClick={handlePopupContactClient}
                  className={`${mapStyles.actionButton} ${mapStyles.contactButton}`}
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </button>
                
                <button 
                  onClick={handlePopupDeleteReservation}
                  className={`${mapStyles.actionButton} ${mapStyles.deleteButton}`}
                >
                  <Trash2 size={16} />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 