import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, ThumbsDown, MessageCircle, Check, Edit2, Trash2, CheckCircle, X, XCircle, AlertTriangle, Sun, Moon, Clock, Printer, ChevronLeft, ChevronRight, Calendar, Users, Phone, Lock, Unlock, MapPin, Plus, Zap, UserCheck } from 'lucide-react';

// Componentes modularizados
import { ConfirmationModal } from '../../../../shared/components/ui';
import ConflictModal from './components/modals/ConflictModal';
import CheckInModal from './components/modals/CheckInModal';
import ReassignmentModal from './components/modals/ReassignmentModal';

// Componentes de sección
import ReservationsList from './components/sections/ReservationsList';
import WaitingListSection from './components/sections/WaitingListSection';

import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import "../../../../datepicker-custom.css";

import { formatPhoneForWhatsApp } from '../../../../utils/phoneUtils';
import { formatDateToString } from '../../../../utils';
import InteractiveMapController from '../../../../shared/components/InteractiveMap/InteractiveMapController';
import CreateReservationModal from '../../../../shared/components/modals/CreateReservationModal';
import EditReservationModal from '../../../../shared/components/modals/EditReservationModal';
import { UNIFIED_TABLES_LAYOUT } from '../../../../utils/tablesLayout';
import { useTableStates } from '../../../../shared/hooks/useTableStates';
import { isDayClosed, isTurnoClosed } from '../../../../shared/constants/operatingDays';

import styles from './Reservas.module.css';
import mapStyles from '../../../../shared/components/InteractiveMap/InteractiveMapController.module.css';

// Registrar locale español para el DatePicker
registerLocale('es', es);

const Reservas = ({ 
  reservations = [], 
  waitingList = [], 
  onUpdateReservation, 
  onDeleteReservation,
  formatDate, 
  HORARIOS = DEFAULT_HORARIOS, 
  showNotification,
  onCreateReservation
}) => {
  // Estados principales
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTurno, setSelectedTurno] = useState(() => {
    const currentHour = new Date().getHours();
    return currentHour < 16 ? 'mediodia' : 'noche';
  });

  // Estados de la interfaz
  const [showCreateReservationModal, setShowCreateReservationModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [checkInMode, setCheckInMode] = useState(false);
  const [selectedReservationForCheckIn, setSelectedReservationForCheckIn] = useState(null);

  // Estados de modales y confirmaciones
  const [confirmation, setConfirmation] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [reservationPopup, setReservationPopup] = useState(null); // Nuevo estado para popup de reserva

  // Estados para gestión de mesas
  const [blockedTables, setBlockedTables] = useState(new Set());
  const [cuposMode, setCuposMode] = useState(false);

  // Memoizar dependencias para evitar recálculos innecesarios
  const formattedDate = useMemo(() => formatDateToString(selectedDate), [selectedDate]);
  const emptyOrders = useMemo(() => [], []); // Array vacío memoizado

  // Hook para estados de mesa UNIFICADOS
  const { tableStates, occupiedTables, reservedTables, availableTables, tableAssignments, findOccupantByTable, getTableState, isTableOccupied, stats } = useTableStates(
    reservations, 
    emptyOrders, // Sin pedidos en sistema de reservas - memoizado
    blockedTables, 
    formattedDate,
    selectedTurno
  );

  // Función para obtener reservas del turno seleccionado
  const reservasTurnoSeleccionado = useMemo(() => {
    const fechaSeleccionada = formatDateToString(selectedDate);
    return reservations.filter(reserva => 
      reserva.fecha === fechaSeleccionada && reserva.turno === selectedTurno
    );
  }, [reservations, selectedDate, selectedTurno]);

  // Función para filtrar lista de espera
  const filteredWaitingList = useMemo(() => {
    if (!waitingList) return [];
    const fechaSeleccionada = formatDateToString(selectedDate);
    return waitingList.filter(waiting => 
      waiting.fecha === fechaSeleccionada && waiting.status !== 'rejected'
    );
  }, [waitingList, selectedDate]);

  // ============== FUNCIONES BÁSICAS ==============

  // Función para crear nueva reserva UNIFICADA
  const handleCreateReservation = useCallback(async (reservationData) => {
    try {
      // ✅ USAR SERVICIO UNIFICADO con todos los datos necesarios
      const { createReservation } = await import('../../../../shared/services/reservationService');
      
      const result = await createReservation(reservationData, {
        isAdmin: true,
        getAvailableSlots: null,
        existingReservations: reservations,
        loadBlockedTables: null, // No usar loadBlockedTables por ahora
        existingOrders: [], // Sin pedidos en sistema de reservas
        manualBlocks: blockedTables // Usar bloqueos manuales actuales
      });

      if (result.success) {
        showNotification?.(`Reserva creada exitosamente${result.mesaAsignada ? ` - Mesa ${result.mesaAsignada}` : ''}`, 'success');
        
        // Actualizar datos
        if (onCreateReservation) {
          await onCreateReservation(reservationData);
        }
      }

      return result;
    } catch (error) {
      console.error('Error al crear reserva:', error);
      showNotification?.(error.message || 'Error al crear la reserva', 'error');
      throw error;
    }
  }, [reservations, blockedTables, onCreateReservation, showNotification]);

  // Función para abrir modal de crear reserva
  const handleOpenCreateReservationModal = useCallback(() => {
    setShowCreateReservationModal(true);
  }, []);

  // Función para verificar si una reserva tiene check-in
  const hasCheckedIn = useCallback((reserva) => {
    return reserva.estadoCheckIn === 'confirmado';
  }, []);

  // Función para manejar check-in
  const handleCheckIn = useCallback(async (reserva) => {
    try {
      await updateReservationCheckIn(reserva.id, {
        estadoCheckIn: 'confirmado',
        horaLlegada: new Date()
      });
      showNotification('Check-in realizado correctamente', 'success');
      setCheckInMode(false);
      setSelectedReservationForCheckIn(null);
    } catch (error) {
      console.error('Error en check-in:', error);
      showNotification('Error al realizar check-in', 'error');
    }
  }, [showNotification]);

  // ============== FUNCIONES DE GESTIÓN DE RESERVAS ==============
  
  // Función para abrir popup de información de reserva (siempre centrado)
  const handleShowReservationPopup = useCallback((reserva) => {
    setReservationPopup({ reserva });
  }, []);

  // Función para cerrar popup de información de reserva
  const handleCloseReservationPopup = useCallback(() => {
    setReservationPopup(null);
  }, []);
  
  // Función para editar una reserva (desde popup)
  const handleEditReservation = useCallback((reserva) => {
    setEditingReservation(reserva);
    setReservationPopup(null); // Cerrar popup
  }, []);

  // Función para eliminar/cancelar una reserva
  const handleDeleteReservation = useCallback((reserva) => {
    setConfirmation({
      title: 'Cancelar Reserva',
      message: `¿Estás seguro de que quieres cancelar la reserva de ${reserva.cliente?.nombre}?`,
      onConfirm: async () => {
        try {
          // Debugging completo del objeto reserva
          console.log('🔍 DEBUG - Reserva completa:', reserva);
          console.log('🔍 DEBUG - Tipo de reserva:', typeof reserva);
          console.log('🔍 DEBUG - Propiedades:', Object.keys(reserva));
          
          // Verificar si la reserva está anidada dentro de otro objeto
          const reservaData = reserva.reserva || reserva;
          
          if (!reservaData || !reservaData.id) {
            console.error('❌ Reserva inválida:', { reserva, reservaData });
            throw new Error('ID de reserva no encontrado');
          }
          
          console.log('🗑️ Eliminando reserva con ID:', reservaData.id);
          await onDeleteReservation(reservaData.id);
          showNotification('Reserva cancelada correctamente', 'success');
          setReservationPopup(null); // Cerrar popup
        } catch (error) {
          console.error('Error al cancelar reserva:', error);
          showNotification('Error al cancelar la reserva', 'error');
        }
      },
      onCancel: () => setConfirmation(null)
    });
  }, [onDeleteReservation, showNotification]);

  // Función para contactar cliente por WhatsApp
  const handleContactClient = useCallback((reserva) => {
    if (reserva.cliente?.telefono) {
      const phoneNumber = formatPhoneForWhatsApp(reserva.cliente.telefono);
      const message = `Hola ${reserva.cliente.nombre}, te contactamos desde Rosaura sobre tu reserva para ${reserva.personas} personas el ${formatDate(new Date(reserva.fecha))} a las ${reserva.horario}.`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      setReservationPopup(null); // Cerrar popup
    } else {
      showNotification('No hay número de teléfono disponible', 'warning');
    }
  }, [formatDate, showNotification]);

  // ============== FUNCIONES PARA LISTA DE RESERVAS ==============

  // Función para hacer click en una reserva de la lista
  const handleReservationCardClick = useCallback((reserva, event) => {
    event?.stopPropagation();
    
    // Si está en modo check-in, cambiar la reserva seleccionada
    if (checkInMode) {
      setSelectedReservationForCheckIn(prevSelected => 
        prevSelected?.id === reserva.id ? null : reserva
      );
      return;
    }
    
    // En modo normal, mostrar popup de información
    handleShowReservationPopup(reserva);
  }, [checkInMode, handleShowReservationPopup]);

  // Función para manejar click en botón de mesa
  const handleTableButtonClick = useCallback((reserva, event) => {
    event?.stopPropagation();
    
    if (hasCheckedIn(reserva)) {
      showNotification('No se puede cambiar la mesa después del check-in', 'warning');
      return;
    }
    
    // Aquí podrías implementar un modal de asignación de mesa si lo necesitas
    console.log('Cambiar mesa para:', reserva.cliente?.nombre);
    showNotification('Funcionalidad de asignación de mesa en desarrollo', 'info');
  }, [hasCheckedIn, showNotification]);

  // ============== FUNCIONES PARA LISTA DE ESPERA ==============

  // Función para obtener badge de estado de lista de espera
  const getWaitingStatusBadge = useCallback((waiting) => {
    const statusClasses = {
      pending: styles['status-pending'],
      contacted: styles['status-contacted'], 
      confirmed: styles['status-confirmed'],
      rejected: styles['status-rejected']
    };
    
    const statusLabels = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      confirmed: 'Confirmado', 
      rejected: 'Rechazado'
    };
    
    return (
      <span className={`${styles.statusBadge} ${statusClasses[waiting.status] || statusClasses.pending}`}>
        {statusLabels[waiting.status] || 'Pendiente'}
      </span>
    );
  }, []);

  // Función para contactar cliente en lista de espera
  const handleContactWaitingClient = useCallback((waiting) => {
    if (waiting.cliente?.telefono) {
      const phoneNumber = formatPhoneForWhatsApp(waiting.cliente.telefono);
      const message = `Hola ${waiting.cliente.nombre}, te contactamos desde Rosaura. Tenemos disponibilidad para tu solicitud de reserva para ${waiting.personas} personas el ${waiting.fecha}.`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // Marcar como contactado (aquí necesitarías una función para actualizar el estado)
      showNotification(`Contactando a ${waiting.cliente.nombre}`, 'info');
    } else {
      showNotification('No hay número de teléfono disponible', 'warning');
    }
  }, [showNotification]);

  // Función para confirmar rápidamente desde lista de espera
  const handleQuickConfirmWaiting = useCallback((waiting) => {
    setConfirmation({
      title: 'Confirmar desde Lista de Espera',
      message: `¿Convertir la solicitud de ${waiting.cliente?.nombre} en una reserva confirmada?`,
      onConfirm: async () => {
        try {
          // Aquí necesitarías implementar la lógica para convertir waiting a reserva
          console.log('Convirtiendo waiting a reserva:', waiting);
          showNotification('Funcionalidad en desarrollo: Convertir a reserva', 'info');
        } catch (error) {
          console.error('Error al confirmar desde lista de espera:', error);
          showNotification('Error al procesar la confirmación', 'error');
        }
      },
      onCancel: () => setConfirmation(null)
    });
  }, [showNotification]);

  // Función para rechazar desde lista de espera
  const handleRejectWaiting = useCallback((waiting) => {
    setConfirmation({
      title: 'Rechazar Solicitud',
      message: `¿Estás seguro de que quieres rechazar la solicitud de ${waiting.cliente?.nombre}?`,
      onConfirm: async () => {
        try {
          // Aquí necesitarías implementar la lógica para rechazar waiting
          console.log('Rechazando solicitud:', waiting);
          showNotification('Funcionalidad en desarrollo: Rechazar solicitud', 'info');
        } catch (error) {
          console.error('Error al rechazar solicitud:', error);
          showNotification('Error al rechazar la solicitud', 'error');
        }
      },
      onCancel: () => setConfirmation(null)
    });
  }, [showNotification]);

  // ============== FUNCIONES DE GESTIÓN DE MESAS ==============

  // Auto-asignación UNIFICADA usando el nuevo servicio
  const handleAutoAssign = useCallback(async () => {
    try {
      const { assignTableAutomatically } = await import('../../../../shared/services/tableManagementService');
      
    const fechaSeleccionada = formatDateToString(selectedDate);
      const reservasSinMesa = reservations.filter(r => 
        r.fecha === fechaSeleccionada && 
        r.turno === selectedTurno && 
        (!r.mesaAsignada || r.mesaAsignada === 'Sin asignar') &&
        r.estadoCheckIn !== 'confirmado'
      );

      if (reservasSinMesa.length === 0) {
        showNotification?.('No hay reservas pendientes de asignación', 'info');
        return;
      }

      let asignadas = 0;
      let noAsignadas = [];

      for (const reserva of reservasSinMesa) {
        // ✅ USAR ASIGNACIÓN AUTOMÁTICA UNIFICADA
        const mesaAsignada = assignTableAutomatically(reserva, tableStates);
        
        if (mesaAsignada) {
          await onUpdateReservation(reserva.id, { mesaAsignada }, true);
          asignadas++;
        } else {
          noAsignadas.push(reserva.cliente?.nombre || 'Sin nombre');
        }
      }

      // Mostrar resultado
      if (asignadas > 0) {
        showNotification?.(`${asignadas} reservas asignadas automáticamente`, 'success');
      }
      
      if (noAsignadas.length > 0) {
        showNotification?.(`${noAsignadas.length} reservas no pudieron asignarse: ${noAsignadas.join(', ')}`, 'warning');
      }

    } catch (error) {
      console.error('Error en autoasignación:', error);
      showNotification?.('Error al autoasignar reservas', 'error');
    }
  }, [reservations, selectedDate, selectedTurno, tableStates, onUpdateReservation, showNotification]);

  const handleClearAssignments = useCallback(async () => {
    const fechaSeleccionada = formatDateToString(selectedDate);
    
    // Confirmación antes de limpiar
    if (window.confirm('¿Estás seguro de que quieres limpiar todas las asignaciones de mesa del turno actual?')) {
      await clearAllTableAssignments(
        reservations,
        fechaSeleccionada,
        selectedTurno,
        onUpdateReservation,
        showNotification
      );
    }
  }, [reservations, selectedDate, selectedTurno, onUpdateReservation, showNotification]);

  const handleToggleCuposMode = useCallback(() => {
    setCuposMode(prev => !prev);
  }, []);

  // Función para manejar click en mesa
  const handleTableClick = useCallback((tableId, tableInfo) => {
    if (checkInMode && selectedReservationForCheckIn) {
      // Modo check-in
      handleCheckIn(selectedReservationForCheckIn);
    } else if (cuposMode) {
      // ✅ NUEVA LÓGICA: Usar el servicio unificado para gestión de cupos
      const { toggleTableBlock } = require('../../../shared/services/tableManagementService');
      const result = toggleTableBlock(tableId, blockedTables, tableStates);
      
      if (result.success) {
        setBlockedTables(result.blocks);
        showNotification?.(result.message, 'info');
        } else {
        showNotification?.(result.message, 'warning');
        }
    } else {
      // Modo normal - verificar si la mesa tiene una reserva usando el estado unificado
      if (tableInfo && tableInfo.type === 'reservation') {
        // Mesa tiene reserva - mostrar popup de información
        console.log('🪑 Mesa reservada clickeada:', tableId, 'Reserva:', tableInfo.details?.clientName);
        
        // Reconstruir objeto de reserva desde tableInfo
        const reservaFromTable = {
          id: tableInfo.details?.reservationId,
          cliente: {
            nombre: tableInfo.details?.clientName,
            telefono: tableInfo.details?.phone,
            comentarios: tableInfo.details?.comments
          },
          personas: tableInfo.details?.people,
          horario: tableInfo.details?.time,
          fecha: tableInfo.details?.date,
          turno: tableInfo.details?.turno,
          mesaAsignada: tableInfo.details?.mesaAsignada,
          mesaReal: tableInfo.details?.mesaReal,
          estadoCheckIn: tableInfo.details?.checkInStatus,
          horaLlegada: tableInfo.details?.horaLlegada
        };
        
        handleShowReservationPopup(reservaFromTable);
      } else {
        // Mesa libre - comportamiento normal
        console.log('🪑 Mesa libre clickeada:', tableId);
      }
    }
  }, [checkInMode, selectedReservationForCheckIn, handleCheckIn, cuposMode, showNotification, blockedTables, tableStates, handleShowReservationPopup]);

  // ============== FUNCIONES AUXILIARES ==============

  // Función unificada para obtener slots disponibles
  const getAvailableSlots = useCallback(async (fecha, turno) => {
    return await calculateAvailableSlots(
      fecha, 
      turno, 
      null, // Sin restricción de personas específica
      null, // Sin exclusión de reserva
      reservations,
      null, // No usar mesas bloqueadas por ahora
      true // Admin mode
    );
  }, [reservations]);

  const isValidDate = useCallback((date) => {
    const dateString = typeof date === 'string' ? date : formatDateToString(date);
    return isValidReservationDate(dateString, 'mediodia', true); // Admin mode
  }, []);

  // Función para navegar entre fechas
  const goToPreviousDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  return (
    <div className={styles.todayContainer}>
      {/* Header */}
      <div className={styles.todayHeader}>
        <div className={styles.todayHeaderContent}>
          <div className={styles.todayTopRow}>
            {/* Navegación de fechas */}
            <div className={styles.todayDateControls}>
              <button
                onClick={goToPreviousDay}
                className={styles.navButton}
                title="Día anterior"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className={styles.datePickerContainer}>
                <DatePicker
                  selected={selectedDate}
                  onChange={setSelectedDate}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  className={styles.datePicker}
                  calendarStartDay={1}
                />
              </div>
              
              <button
                onClick={goToNextDay}
                className={styles.navButton}
                title="Día siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Selector de turno */}
            <div className={styles.todayTurnoSelector}>
              <button
                className={`${styles.turnoButton} ${selectedTurno === 'mediodia' ? styles.turnoButtonActive : ''}`}
                onClick={() => setSelectedTurno('mediodia')}
              >
                <Sun size={16} />
                Mediodía
              </button>
              <button
                className={`${styles.turnoButton} ${selectedTurno === 'noche' ? styles.turnoButtonActive : ''}`}
                onClick={() => setSelectedTurno('noche')}
              >
                <Moon size={16} />
                Noche
              </button>
            </div>

            {/* Botón para nueva reserva */}
            <button
              onClick={handleOpenCreateReservationModal}
              className={styles.primaryButton}
              title="Crear nueva reserva"
            >
              <Plus size={16} />
              Nueva Reserva
            </button>

            {/* Botones de gestión de mesas */}
            <div className={styles.actionButtonsGroup}>
              <button
                onClick={handleAutoAssign}
                className={styles.secondaryButton}
                title="Autoasignar mesas a reservas pendientes"
              >
                <Zap size={16} />
                Autoasignar
              </button>
              
              <button
                onClick={handleClearAssignments}
                className={styles.secondaryButton}
                title="Limpiar todas las asignaciones de mesa"
              >
                <X size={16} />
                Limpiar
              </button>
              
              <button
                onClick={handleToggleCuposMode}
                className={`${styles.secondaryButton} ${cuposMode ? styles.activeMode : ''}`}
                title={cuposMode ? "Salir del modo cupos" : "Activar modo cupos para bloquear/desbloquear mesas"}
              >
                <Users size={16} />
                {cuposMode ? 'Salir Cupos' : 'Modificar Cupos'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={styles.todayContent}>
        {/* Mapa interactivo */}
        <div className={styles.todayMap}>
          <InteractiveMapController
            reservas={reservasTurnoSeleccionado}
            orders={[]} // Sin pedidos en sistema de reservas
            blockedTables={blockedTables}
            tableStates={tableStates} // ✅ NUEVO: Estados unificados
            tableAssignments={tableAssignments}
            occupiedTables={occupiedTables}
            mode={cuposMode ? 'cupos' : (checkInMode ? 'checkin' : 'view')}
            onTableClick={handleTableClick}
            findOccupantByTable={findOccupantByTable}
            selectedReservationId={editingReservation?.id}
            reservationPopup={reservationPopup}
            setReservationPopup={setReservationPopup}
            onEditReservation={handleEditReservation}
            onDeleteReservation={handleDeleteReservation}
            onContactClient={handleContactClient}
            showNotification={showNotification}
          />
        </div>

        {/* Panel lateral con reservas */}
        <div className={styles.todayPanel}>
          {/* Lista de reservas del turno seleccionado */}
          <div className={styles.todayReservationsList}>
            <ReservationsList
              reservasTurnoSeleccionado={reservasTurnoSeleccionado}
              selectedReservation={null}
              checkInMode={checkInMode}
              selectedReservationForCheckIn={selectedReservationForCheckIn}
              hasCheckedIn={hasCheckedIn}
              handleReservationCardClick={handleReservationCardClick}
              handleOpenCheckIn={(reserva) => {
                setSelectedReservationForCheckIn(reserva);
                setCheckInMode(true);
              }}
              handleTableButtonClick={handleTableButtonClick}
              getAssignmentButtonText={(reserva) => reserva.mesaAsignada ? `Mesa ${reserva.mesaAsignada}` : 'Asignar Mesa'}
              getAssignmentButtonClass={() => styles.tableButton}
              getUnassignmentButtonClass={() => styles.tableButton}
            />
          </div>

          {/* Lista de espera */}
          <div className={styles.todayWaitingList}>
            <WaitingListSection
              filteredWaitingList={filteredWaitingList}
              getWaitingStatusBadge={getWaitingStatusBadge}
              handleContactWaitingClient={handleContactWaitingClient}
              handleQuickConfirmWaiting={handleQuickConfirmWaiting}
              handleRejectWaiting={handleRejectWaiting}
            />
          </div>
        </div>
      </div>

      {/* Modales */}
      
      {/* Popup profesional de información de reserva */}
      {reservationPopup && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={handleCloseReservationPopup}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              minWidth: '400px',
              maxWidth: '500px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e1e5e9'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '16px',
              borderBottom: '1px solid #e1e5e9',
              marginBottom: '20px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Reserva - {reservationPopup.reserva.cliente?.nombre}
              </h3>
              <button 
                onClick={handleCloseReservationPopup}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#7f8c8d',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Detalles */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#7f8c8d' }}>Horario:</span>
                  <span style={{ fontWeight: '500' }}>{reservationPopup.reserva.horario}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#7f8c8d' }}>Personas:</span>
                  <span style={{ fontWeight: '500' }}>{reservationPopup.reserva.personas}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#7f8c8d' }}>Fecha:</span>
                  <span style={{ fontWeight: '500' }}>{formatDate(new Date(reservationPopup.reserva.fecha))}</span>
                </div>
                {reservationPopup.reserva.mesaAsignada && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7f8c8d' }}>Mesa:</span>
                    <span style={{ fontWeight: '500' }}>{reservationPopup.reserva.mesaAsignada}</span>
                  </div>
                )}
                {reservationPopup.reserva.cliente?.telefono && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7f8c8d' }}>Teléfono:</span>
                    <span style={{ fontWeight: '500' }}>{reservationPopup.reserva.cliente.telefono}</span>
                  </div>
                )}
                {reservationPopup.reserva.cliente?.comentarios && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#7f8c8d' }}>Comentarios:</span>
                    <span style={{ fontWeight: '500', textAlign: 'right', maxWidth: '200px' }}>
                      {reservationPopup.reserva.cliente.comentarios}
                    </span>
                  </div>
                )}
                {hasCheckedIn(reservationPopup.reserva) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#7f8c8d' }}>Estado:</span>
                    <span style={{ fontWeight: '500', color: '#27ae60' }}>Cliente llegó</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Acciones */}
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              justifyContent: 'flex-end',
              paddingTop: '16px',
              borderTop: '1px solid #e1e5e9'
            }}>
              <button 
                onClick={() => handleEditReservation(reservationPopup.reserva)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Editar
              </button>
              
              {reservationPopup.reserva.cliente?.telefono && (
                <button 
                  onClick={() => handleContactClient(reservationPopup.reserva)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  WhatsApp
                </button>
              )}
              
              <button 
                onClick={() => handleDeleteReservation(reservationPopup.reserva)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmation && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationModal}>
            <div className={styles.confirmationHeader}>
              <div className={styles.confirmationIcon}>
                <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div className={styles.confirmationContent}>
                <h3 className={styles.confirmationTitle}>{confirmation.title}</h3>
                <p className={styles.confirmationMessage}>{confirmation.message}</p>
              </div>
            </div>
            <div className={styles.confirmationActions}>
              <button 
                onClick={() => {
                  if (confirmation.onCancel) confirmation.onCancel();
                  setConfirmation(null);
                }}
                className={styles.confirmationButtonCancel}
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (confirmation.onConfirm) confirmation.onConfirm();
                  setConfirmation(null);
                }}
                className={styles.confirmationButton}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nueva reserva */}
      {showCreateReservationModal && (
        <CreateReservationModal
          onClose={() => setShowCreateReservationModal(false)}
          onSave={onCreateReservation || (() => {
            console.error('onCreateReservation function not provided');
            showNotification?.('error', 'No se pudo crear la reserva - función no disponible');
          })}
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
          getAvailableSlotsForEdit={getAvailableSlots}
          isValidDate={isValidDate}
          HORARIOS={HORARIOS}
          showNotification={showNotification}
          isAdmin={true}
        />
      )}
    </div>
  );
};

export default Reservas; 