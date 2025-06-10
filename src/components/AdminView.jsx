// src/components/AdminView.jsx

import React, { useState, useEffect } from 'react';
import { ChevronDown, ThumbsDown, MessageCircle, Check, Edit2, Trash2, CheckCircle, X, XCircle, AlertTriangle, Sun, Moon } from 'lucide-react';
import styles from './AdminView.module.css';
import FutureReservations from './FutureReservations';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Componente de notificación
const NotificationContainer = ({ notifications, onClose }) => {
    if (notifications.length === 0) return null;

    return (
        <div className={styles.notificationContainer}>
            {notifications.map((notification) => (
                <div 
                    key={notification.id} 
                    className={`${styles.notification} ${notification.type === 'success' ? styles.notificationSuccess : styles.notificationError}`}
                >
                    <div className={styles.notificationIcon}>
                        {notification.type === 'success' ? (
                            <CheckCircle size={20} color="#059669" />
                        ) : (
                            <XCircle size={20} color="#dc2626" />
                        )}
                    </div>
                    <div className={styles.notificationContent}>
                        <div className={styles.notificationTitle}>
                            {notification.type === 'success' ? 'Éxito' : 'Error'}
                        </div>
                        <div className={styles.notificationMessage}>
                            {notification.message}
                        </div>
                    </div>
                    <button 
                        className={styles.notificationClose}
                        onClick={() => onClose(notification.id)}
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

// Componente de confirmación
const ConfirmationModal = ({ confirmation, onConfirm, onCancel }) => {
    if (!confirmation) return null;

    return (
        <div className={styles.confirmationOverlay}>
            <div className={styles.confirmationModal}>
                <div className={styles.confirmationHeader}>
                    <div className={styles.confirmationIcon}>
                        <AlertTriangle size={24} color="#dc2626" />
                    </div>
                    <div className={styles.confirmationContent}>
                        <div className={styles.confirmationTitle}>
                            {confirmation.title || 'Confirmar acción'}
                        </div>
                        <div className={styles.confirmationMessage}>
                            {confirmation.message}
                        </div>
                    </div>
                </div>
                <div className={styles.confirmationActions}>
                    <button
                        className={styles.confirmationButtonCancel}
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                    <button
                        className={styles.confirmationButtonConfirm}
                        onClick={onConfirm}
                    >
                        {confirmation.confirmText || 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal de edición de reserva mejorado
const EditReservationModal = ({ reservation, onClose, onSave, getAvailableSlotsForEdit, isValidDate, HORARIOS, showNotification }) => {
    const [editedReservation, setEditedReservation] = useState({
        ...reservation,
        cliente: { ...reservation.cliente }
    });

    const [availableSlots, setAvailableSlots] = useState([]);

    // Actualizar horarios disponibles cuando cambian fecha, turno o personas
    useEffect(() => {
        if (editedReservation.fecha && editedReservation.turno && editedReservation.personas) {
            const slots = getAvailableSlotsForEdit(
                editedReservation.fecha,
                editedReservation.turno,
                editedReservation.personas,
                reservation.id
            );
            setAvailableSlots(slots);
            
            // Si el horario actual no está disponible, limpiar la selección
            if (!slots.includes(editedReservation.horario)) {
                setEditedReservation(prev => ({ ...prev, horario: '' }));
            }
        }
    }, [editedReservation.fecha, editedReservation.turno, editedReservation.personas]);

    const isDayDisabled = (fecha) => {
        if (!fecha) return true;
        const fechaObj = new Date(fecha + "T00:00:00");
        const dayOfWeek = fechaObj.getDay();
        
        // Lunes cerrado
        if (dayOfWeek === 1) return true;
        
        // Verificar fecha válida
        return !isValidDate(fecha);
    };

    const isTurnoDisabled = (turno) => {
        if (!editedReservation.fecha) return true;
        
        const fechaObj = new Date(editedReservation.fecha + "T00:00:00");
        const dayOfWeek = fechaObj.getDay();
        
        // Domingos solo mediodía
        if (dayOfWeek === 0 && turno === 'noche') return true;
        
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (isDayDisabled(editedReservation.fecha)) {
            showNotification('error', 'La fecha seleccionada no es válida. Por favor, elige otra fecha.');
            return;
        }
        
        if (isTurnoDisabled(editedReservation.turno)) {
            showNotification('error', 'El turno seleccionado no está disponible para esta fecha.');
            return;
        }
        
        if (!availableSlots.includes(editedReservation.horario)) {
            showNotification('error', 'El horario seleccionado no está disponible. Por favor, elige otro horario.');
            return;
        }
        
        const reservationWithDateObject = {
            ...editedReservation,
            fecha: new Date(editedReservation.fecha + 'T00:00:00')
        };
        
        // Esperar a que se complete la operación antes de cerrar
        await onSave(reservationWithDateObject);
        onClose();
    };

    // Obtener rango de fechas válidas
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    const minDateString = today.toISOString().split('T')[0];
    const maxDateString = maxDate.toISOString().split('T')[0];

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>Modificar Reserva</h2>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nombre del Cliente</label>
                        <input
                            type="text"
                            value={editedReservation.cliente.nombre}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                cliente: { ...editedReservation.cliente, nombre: e.target.value }
                            })}
                            className={styles.formInput}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Teléfono</label>
                        <input
                            type="text"
                            value={editedReservation.cliente.telefono}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                cliente: { ...editedReservation.cliente, telefono: e.target.value }
                            })}
                            className={styles.formInput}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Fecha</label>
                        <input
                            type="date"
                            min={minDateString}
                            max={maxDateString}
                            value={editedReservation.fecha}
                            onChange={(e) => {
                                const fecha = e.target.value;
                                if (!isDayDisabled(fecha)) {
                                    setEditedReservation({
                                        ...editedReservation,
                                        fecha
                                    });
                                }
                            }}
                            className={styles.formInput}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Turno</label>
                        <select
                            value={editedReservation.turno}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                turno: e.target.value,
                                horario: '' // Limpiar horario al cambiar turno
                            })}
                            className={styles.formSelect}
                            required
                        >
                            <option value="">Seleccionar turno</option>
                            <option value="mediodia" disabled={isTurnoDisabled('mediodia')}>Mediodía</option>
                            <option value="noche" disabled={isTurnoDisabled('noche')}>Noche</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Personas</label>
                        <select
                            value={editedReservation.personas}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                personas: parseInt(e.target.value),
                                horario: '' // Limpiar horario al cambiar personas
                            })}
                            className={styles.formSelect}
                            required
                        >
                            <option value="">Seleccionar cantidad</option>
                            {[1, 2, 3, 4, 5, 6].map(num => (
                                <option key={num} value={num}>{num} {num === 1 ? 'persona' : 'personas'}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Horario</label>
                        <select
                            value={editedReservation.horario}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                horario: e.target.value
                            })}
                            className={styles.formSelect}
                            required
                            disabled={!editedReservation.fecha || !editedReservation.turno || !editedReservation.personas}
                        >
                            <option value="">Seleccionar horario</option>
                            {availableSlots.map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                            ))}
                        </select>
                        {availableSlots.length === 0 && editedReservation.fecha && editedReservation.turno && editedReservation.personas && (
                            <p className={styles.errorMessage}>No hay horarios disponibles para esta configuración</p>
                        )}
                    </div>
                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.modalButtonSecondary}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.modalButtonPrimary}
                            disabled={!editedReservation.horario}
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente reutilizable para las tablas de reservas
const ReservationsTable = ({ reservations, onSetBlacklist, onUpdateReservation, onDeleteReservation, showEditButton = false, getAvailableSlotsForEdit, isValidDate, HORARIOS, showNotification, showConfirmation }) => {
    const [editingReservation, setEditingReservation] = useState(null);

    const handleSave = async (updatedData) => {
        try {
            await onUpdateReservation(editingReservation.id, updatedData);
            setEditingReservation(null);
            showNotification('success', 'Reserva actualizada exitosamente');
        } catch (error) {
            showNotification('error', error.message || 'Error al actualizar la reserva');
        }
    };

    const handleDelete = async (reservation) => {
        const confirmed = await showConfirmation({
            title: 'Eliminar reserva',
            message: `¿Estás seguro de que quieres eliminar la reserva de ${reservation.cliente.nombre} para el ${formatDate(reservation.fecha)} a las ${reservation.horario} hs?\n\nEsta acción no se puede deshacer.`,
            confirmText: 'Eliminar'
        });
        
        if (confirmed) {
            try {
                await onDeleteReservation(reservation.id);
                showNotification('success', 'Reserva eliminada exitosamente');
            } catch (error) {
                showNotification('error', error.message || 'Error al eliminar la reserva');
            }
        }
    };

    const handleBlacklist = async (reserva) => {
        const confirmed = await showConfirmation({
            title: 'Agregar a lista negra',
            message: `¿Estás seguro de que quieres agregar a ${reserva.cliente.nombre} a la lista negra por no asistir?`,
            confirmText: 'Agregar'
        });
        
        if (confirmed) {
            onSetBlacklist(reserva.clienteId, true);
        }
    };

    const formatPhoneForWhatsApp = (phone) => {
        // Eliminar todos los caracteres no numéricos
        let cleaned = phone.replace(/\D/g, '');
        
        // Si el número ya empieza con 549, lo dejamos como está
        if (cleaned.startsWith('549')) {
            return cleaned;
        }

        // Si empieza con 54, agregamos el 9
        if (cleaned.startsWith('54')) {
            cleaned = '549' + cleaned.slice(2);
        }

        // Si el número empieza con 0, lo removemos
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.slice(1);
        }

        // Si el número empieza con 15, lo movemos después del código de área
        if (cleaned.includes('15')) {
            const parts = cleaned.split('15');
            cleaned = parts.join('');
        }

        // Si no tiene el prefijo internacional, lo agregamos
        if (!cleaned.startsWith('549')) {
            cleaned = '549' + cleaned;
        }

        return cleaned;
    };

    const getWhatsAppMessage = (reserva) => {
        const fecha = formatDate(reserva.fecha);
        const mensaje = `Hola! Te escribimos de Rosaura para confirmar tu reserva hecha por nuestra web para el día ${fecha} para ${reserva.personas} personas a las ${reserva.horario} hs, te esperamos! Gracias`;
        return encodeURIComponent(mensaje);
    };

    // Organizar reservas por turno y ordenar por horario
    const organizarReservasPorTurno = (reservations) => {
        const reservasPorTurno = {
            mediodia: [],
            noche: []
        };

        // Clasificar reservas por turno usando el campo 'turno' de la reserva
        reservations.forEach(reserva => {
            if (reserva.turno === 'mediodia') {
                reservasPorTurno.mediodia.push(reserva);
            } else if (reserva.turno === 'noche') {
                reservasPorTurno.noche.push(reserva);
            } else {
                // Fallback: clasificar por horario si no hay campo turno
                const hora = parseInt(reserva.horario.split(':')[0]);
                if (hora < 18) {
                    reservasPorTurno.mediodia.push(reserva);
                } else {
                    reservasPorTurno.noche.push(reserva);
                }
            }
        });

        // Ordenar cada turno por horario
        reservasPorTurno.mediodia.sort((a, b) => a.horario.localeCompare(b.horario));
        reservasPorTurno.noche.sort((a, b) => a.horario.localeCompare(b.horario));

        return reservasPorTurno;
    };

    const reservasPorTurno = organizarReservasPorTurno(reservations);

    const renderReservasTable = (reservasDelTurno) => (
        <table className="min-w-full">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {reservasDelTurno.length > 0 ? reservasDelTurno.map(reserva => (
                    <tr key={reserva.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reserva.cliente.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reserva.horario}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reserva.personas}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                            <a 
                                href={`https://wa.me/${formatPhoneForWhatsApp(reserva.cliente.telefono)}?text=${getWhatsAppMessage(reserva)}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-green-600 hover:text-green-800 inline-flex items-center gap-1"
                            >
                                <MessageCircle size={14} /> Contactar
                            </a>
                            {showEditButton ? (
                                <button
                                    onClick={() => setEditingReservation(reserva)}
                                    className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                >
                                    <Edit2 size={14} /> Modificar
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleBlacklist(reserva)}
                                    className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                                    title="Marcar como No Asistió y añadir a Lista Negra"
                                >
                                    <ThumbsDown size={14} /> No Asistió
                                </button>
                            )}
                            {showEditButton && (
                                <button
                                    onClick={() => handleDelete(reserva)}
                                    className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                                    title="Eliminar reserva"
                                >
                                    <Trash2 size={14} /> Eliminar
                                </button>
                            )}
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                            No hay reservas para este turno.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );

    return (
        <div className="space-y-6">
            {/* Turno Mediodía */}
            {(reservasPorTurno.mediodia.length > 0 || reservasPorTurno.noche.length > 0) && (
                <>
                    <div>
                        <div className="flex items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Sun size={20} className="text-orange-500" />
                                Turno Mediodía
                            </h3>
                            <span className="ml-3 bg-orange-200 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                {reservasPorTurno.mediodia.length} reservas
                            </span>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            {renderReservasTable(reservasPorTurno.mediodia)}
                        </div>
                    </div>

                    {/* Turno Noche */}
                    <div>
                        <div className="flex items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Moon size={20} className="text-blue-500" />
                                Turno Noche
                            </h3>
                            <span className="ml-3 bg-blue-200 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                {reservasPorTurno.noche.length} reservas
                            </span>
                        </div>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            {renderReservasTable(reservasPorTurno.noche)}
                        </div>
                    </div>
                </>
            )}

            {/* Mensaje cuando no hay reservas */}
            {reservasPorTurno.mediodia.length === 0 && reservasPorTurno.noche.length === 0 && (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    No hay reservas para mostrar.
                </div>
            )}

            {editingReservation && (
                <EditReservationModal
                    reservation={editingReservation}
                    onClose={() => setEditingReservation(null)}
                    onSave={handleSave}
                    getAvailableSlotsForEdit={getAvailableSlotsForEdit}
                    isValidDate={isValidDate}
                    HORARIOS={HORARIOS}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
};

// Componente reutilizable para la tabla de clientes
const ClientsTable = ({ clients, onSetBlacklist, showConfirmation }) => {
    return (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className={styles.table}>
                <thead className={styles.tableHeader}>
                    <tr>
                        <th className={styles.tableHeaderCell}>Nombre</th>
                        <th className={styles.tableHeaderCell}>Teléfono</th>
                        <th className={styles.tableHeaderCell}>Total Reservas</th>
                        <th className={styles.tableHeaderCell}>Última Visita</th>
                        <th className={styles.tableHeaderCell}>Acciones</th>
                    </tr>
                </thead>
                <tbody className={styles.tableBody}>
                    {clients.map(cliente => (
                        <tr key={cliente.id} className={styles.tableRow}>
                            <td className={styles.tableCell}>{cliente.nombre}</td>
                            <td className={styles.tableCellSecondary}>{cliente.telefono}</td>
                            <td className={styles.tableCellSecondary}>{cliente.totalReservas}</td>
                            <td className={styles.tableCellSecondary}>{formatDate(cliente.ultimaReserva)}</td>
                            <td className={styles.tableCell}>
                                <a href={`https://wa.me/${cliente.telefono}`} target="_blank" rel="noopener noreferrer" className={styles.actionLinkGreen}>
                                    <MessageCircle size={14} /> Contactar
                                </a>
                                <button 
                                    onClick={async () => {
                                      const confirmed = await showConfirmation({
                                        title: 'Agregar a lista negra',
                                        message: `¿Estás seguro de que quieres agregar a ${cliente.nombre} a la lista negra?`,
                                        confirmText: 'Agregar'
                                      });
                                      if (confirmed) {
                                        onSetBlacklist(cliente.id, true);
                                      }
                                    }}
                                    className={styles.actionLinkRed}
                                    title="Añadir a lista negra"
                                >
                                    <ThumbsDown size={14} /> Añadir a lista negra
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Componente para la vista semanal
const WeekView = ({ reservations, onSetBlacklist, onUpdateReservation, onDeleteReservation, getAvailableSlotsForEdit, isValidDate, HORARIOS, showNotification, showConfirmation }) => {
    const [expandedDay, setExpandedDay] = useState(null);

    // Obtener los próximos 7 días
    const getNextSevenDays = () => {
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    };

    // Agrupar reservas por día
    const getReservationsForDay = (date) => {
        return reservations.filter(r => r.fecha === date);
    };

    const nextSevenDays = getNextSevenDays();

    return (
        <div className="space-y-4">
            {nextSevenDays.map(date => {
                const dayReservations = getReservationsForDay(date);
                const isExpanded = expandedDay === date;

                return (
                    <div key={date} className="bg-white rounded-lg shadow-sm">
                        <button
                            onClick={() => setExpandedDay(isExpanded ? null : date)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150"
                        >
                            <div className="flex items-center space-x-4">
                                <span className="font-medium text-gray-900">{formatDate(date)}</span>
                                <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                    {dayReservations.length} reservas
                                </span>
                            </div>
                            <ChevronDown
                                className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                size={20}
                            />
                        </button>
                        {isExpanded && dayReservations.length > 0 && (
                            <div className="border-t border-gray-200">
                                <ReservationsTable
                                    reservations={dayReservations}
                                    onSetBlacklist={onSetBlacklist}
                                    onUpdateReservation={onUpdateReservation}
                                    onDeleteReservation={onDeleteReservation}
                                    showEditButton={true}
                                    getAvailableSlotsForEdit={getAvailableSlotsForEdit}
                                    isValidDate={isValidDate}
                                    HORARIOS={HORARIOS}
                                    showNotification={showNotification}
                                    showConfirmation={showConfirmation}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export const AdminView = ({ data, auth, onLogout, onSetBlacklist, onUpdateReservation, onDeleteReservation, getAvailableSlotsForEdit, isValidDate, formatDate, HORARIOS }) => {
  const [adminView, setAdminView] = useState('today');
  const [isBlacklistVisible, setIsBlacklistVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [confirmation, setConfirmation] = useState(null);

  // Función para mostrar notificaciones
  const showNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-remove después de 4 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const closeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Función para mostrar confirmaciones
  const showConfirmation = (config) => {
    return new Promise((resolve) => {
      setConfirmation({
        ...config,
        resolve
      });
    });
  };

  const handleConfirmation = (result) => {
    if (confirmation?.resolve) {
      confirmation.resolve(result);
    }
    setConfirmation(null);
  };

  const todayReservations = data.reservas.filter(r => r.fecha === new Date().toISOString().split('T')[0]);
  
  // Lógica para Clientes - solo mostrar clientes con reservas pasadas
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const activeClients = data.clientes
      .filter(c => !c.listaNegra)
      .filter(c => {
        if (!c.ultimaReserva) return false;
        const ultimaReservaDate = new Date(c.ultimaReserva + "T00:00:00");
        return ultimaReservaDate < today;
      })
      .sort((a, b) => new Date(b.ultimaReserva) - new Date(a.ultimaReserva));
    
  const blacklistedClients = data.clientes.filter(c => c.listaNegra);

  return (
    <div className="min-h-screen bg-gray-100">
      <NotificationContainer 
        notifications={notifications} 
        onClose={closeNotification} 
      />
      
      <ConfirmationModal
        confirmation={confirmation}
        onConfirm={() => handleConfirmation(true)}
        onCancel={() => handleConfirmation(false)}
      />
      
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerFlex}>
            <div>
              <h1 className={styles.headerTitle}>Panel de Administración</h1>
              <p className={styles.headerUser}>Sesión iniciada como: <span className={styles.headerUserName}>{auth.user}</span> ({auth.role})</p>
            </div>
            <button onClick={onLogout} className={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>
      <div className={styles.tabsContainer}>
        <div className={styles.tabsContent}>
          <div className={styles.tabsList}>
            <button 
              onClick={() => setAdminView('today')} 
              className={adminView === 'today' ? styles.tabActive : styles.tabInactive}
            >
              Hoy
            </button>
            <button 
              onClick={() => setAdminView('week')} 
              className={adminView === 'week' ? styles.tabActive : styles.tabInactive}
            >
              Esta Semana
            </button>
            <button 
              onClick={() => setAdminView('future')} 
              className={adminView === 'future' ? styles.tabActive : styles.tabInactive}
            >
              Próximas
            </button>
            {auth.role === 'admin' && (
              <button 
                onClick={() => setAdminView('clients')} 
                className={adminView === 'clients' ? styles.tabActive : styles.tabInactive}
              >
                Clientes
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={styles.mainContent}>
        {adminView === 'today' && (
          <div>
            <ReservationsTable 
              reservations={todayReservations} 
              onSetBlacklist={onSetBlacklist}
              onUpdateReservation={onUpdateReservation}
              onDeleteReservation={onDeleteReservation}
              showEditButton={true}
              getAvailableSlotsForEdit={getAvailableSlotsForEdit}
              isValidDate={isValidDate}
              HORARIOS={HORARIOS}
              showNotification={showNotification}
              showConfirmation={showConfirmation}
            />
          </div>
        )}

        {adminView === 'week' && (
          <WeekView 
            reservations={data.reservas} 
            onSetBlacklist={onSetBlacklist}
            onUpdateReservation={onUpdateReservation}
            onDeleteReservation={onDeleteReservation}
            getAvailableSlotsForEdit={getAvailableSlotsForEdit}
            isValidDate={isValidDate}
            HORARIOS={HORARIOS}
            showNotification={showNotification}
            showConfirmation={showConfirmation}
          />
        )}

        {adminView === 'future' && (
          <FutureReservations
            reservations={data.reservas}
            onSetBlacklist={onSetBlacklist}
            onUpdateReservation={onUpdateReservation}
            onDeleteReservation={onDeleteReservation}
            ReservationsTable={(props) => <ReservationsTable {...props} showNotification={showNotification} showConfirmation={showConfirmation} />}
            getAvailableSlotsForEdit={getAvailableSlotsForEdit}
            isValidDate={isValidDate}
            HORARIOS={HORARIOS}
          />
        )}

        {adminView === 'clients' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Clientes Activos</h2>
              <ClientsTable 
                clients={activeClients} 
                onSetBlacklist={onSetBlacklist} 
                showConfirmation={showConfirmation}
              />
            </div>
            <div>
              <button 
                onClick={() => setIsBlacklistVisible(!isBlacklistVisible)} 
                className={styles.blacklistButton}
              >
                <span>Lista Negra ({blacklistedClients.length} clientes)</span>
                <ChevronDown className={`transform transition-transform duration-200 ${isBlacklistVisible ? 'rotate-180' : ''}`} />
              </button>
              {isBlacklistVisible && (
                <div className={styles.blacklistTable}>
                  <table className={styles.table}>
                    <thead className={styles.blacklistTableHeader}>
                      <tr>
                        <th className={styles.blacklistTableHeaderCell}>Nombre</th>
                        <th className={styles.blacklistTableHeaderCell}>Teléfono</th>
                        <th className={styles.blacklistTableHeaderCell}>Acción</th>
                      </tr>
                    </thead>
                    <tbody className={styles.blacklistTableBody}>
                      {blacklistedClients.map(cliente => (
                        <tr key={cliente.id} className={styles.blacklistTableRow}>
                          <td className={styles.blacklistTableCellName}>{cliente.nombre}</td>
                          <td className={styles.blacklistTableCellPhone}>{cliente.telefono}</td>
                          <td className={styles.blacklistTableCell}>
                            <button 
                              onClick={async () => {
                                const confirmed = await showConfirmation({
                                  title: 'Quitar de lista negra',
                                  message: `¿Estás seguro de que quieres quitar a ${cliente.nombre} de la lista negra?`,
                                  confirmText: 'Quitar'
                                });
                                if (confirmed) {
                                  onSetBlacklist(cliente.id, false);
                                }
                              }} 
                              className={styles.removeFromBlacklistButton}
                            >
                              <Check size={14} /> Quitar de lista negra
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};