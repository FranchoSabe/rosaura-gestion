// src/components/AdminView.jsx

import React, { useState, useEffect } from 'react';
import { ChevronDown, ThumbsDown, MessageCircle, Check, Edit2, Trash2, CheckCircle, X, XCircle, AlertTriangle, Sun, Moon, Clock } from 'lucide-react';
import styles from './AdminView.module.css';
import FutureReservations from './FutureReservations';
import TableMap from './TableMap';

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
    // Función para normalizar la fecha al formato correcto
    const normalizeFecha = (fecha) => {
        if (!fecha) return '';
        
        // Si es un objeto Date
        if (fecha instanceof Date) {
            return fecha.toISOString().split('T')[0];
        }
        
        // Si es un string que parece una fecha ISO
        if (typeof fecha === 'string') {
            // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
            if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                return fecha;
            }
            // Si es otro formato, intentar convertir
            try {
                const dateObj = new Date(fecha + "T00:00:00");
                return dateObj.toISOString().split('T')[0];
            } catch (error) {
                console.error('Error al convertir fecha:', fecha, error);
                return '';
            }
        }
        
        return '';
    };

    const [editedReservation, setEditedReservation] = useState({
        ...reservation,
        cliente: { ...reservation.cliente },
        fecha: normalizeFecha(reservation.fecha)
    });

    const [availableSlots, setAvailableSlots] = useState([]);

    // Debug: verificar la inicialización de la fecha
    useEffect(() => {
        console.log('📅 Modal de edición inicializado:', {
            reservationOriginal: reservation.fecha,
            editedReservationFecha: editedReservation.fecha,
            type: typeof editedReservation.fecha
        });
    }, []);

    // Forzar re-inicialización si cambia la reserva
    useEffect(() => {
        const fechaNormalizada = normalizeFecha(reservation.fecha);
        console.log('📅 Reserva cambió, re-inicializando:', {
            reservationId: reservation.id,
            fechaOriginal: reservation.fecha,
            fechaNormalizada: fechaNormalizada
        });
        
        setEditedReservation({
            ...reservation,
            cliente: { ...reservation.cliente },
            fecha: fechaNormalizada
        });
    }, [reservation.id, reservation.fecha]);

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
        
        // Validaciones básicas primero
        if (!editedReservation.fecha) {
            showNotification('error', 'Por favor selecciona una fecha.');
            return;
        }
        
        if (!editedReservation.turno) {
            showNotification('error', 'Por favor selecciona un turno.');
            return;
        }
        
        if (!editedReservation.horario) {
            showNotification('error', 'Por favor selecciona un horario.');
            return;
        }
        
        // Validaciones de negocio (menos restrictivas en edición)
        if (isTurnoDisabled(editedReservation.turno)) {
            showNotification('error', 'El turno seleccionado no está disponible para esta fecha.');
            return;
        }
        
        if (availableSlots.length > 0 && !availableSlots.includes(editedReservation.horario)) {
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
        <div 
            className={styles.modalOverlay} 
            onClick={(e) => {
                // Solo cerrar si se hace click directamente en el overlay
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            onMouseDown={(e) => {
                // Prevenir que el mousedown en el overlay interfiera con inputs
                if (e.target !== e.currentTarget) {
                    e.stopPropagation();
                }
            }}
        >
            <div 
                className={styles.modalContent}
                onClick={(e) => {
                    // Prevenir que clicks en el contenido cierren el modal
                    e.stopPropagation();
                }}
            >
                <div className={styles.modalHeader}>
                    <div className={styles.modalIcon}>
                        <Edit2 size={24} color="white" />
                    </div>
                    <div className={styles.modalTitleContainer}>
                        <h2 className={styles.modalTitle}>Modificar Reserva</h2>
                        <p className={styles.modalSubtitle}>
                            Código: {reservation.reservationId || reservation.id}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.modalCloseButton}
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                <span className={styles.formLabelIcon}>👤</span>
                                Nombre del Cliente
                            </label>
                            <input
                                type="text"
                                value={editedReservation.cliente.nombre}
                                onChange={(e) => setEditedReservation({
                                    ...editedReservation,
                                    cliente: { ...editedReservation.cliente, nombre: e.target.value }
                                })}
                                className={styles.formInput}
                                placeholder="Nombre completo"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                <span className={styles.formLabelIcon}>📱</span>
                                Teléfono
                            </label>
                            <input
                                type="text"
                                value={editedReservation.cliente.telefono}
                                onChange={(e) => setEditedReservation({
                                    ...editedReservation,
                                    cliente: { ...editedReservation.cliente, telefono: e.target.value }
                                })}
                                className={styles.formInput}
                                placeholder="Número de teléfono"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                <span className={styles.formLabelIcon}>📅</span>
                                Fecha
                            </label>
                            <div style={{position: 'relative'}}>
                                <input
                                    type="date"
                                    min={minDateString}
                                    max={maxDateString}
                                    value={editedReservation.fecha || ''}
                                    onInput={(e) => {
                                        e.stopPropagation();
                                        const nuevaFecha = e.target.value;
                                        console.log('📅 onInput - Fecha cambiada:', nuevaFecha);
                                        setEditedReservation(prevState => ({
                                            ...prevState,
                                            fecha: nuevaFecha,
                                            horario: ''
                                        }));
                                    }}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        const nuevaFecha = e.target.value;
                                        console.log('📅 onChange - Fecha cambiada:', nuevaFecha);
                                        setEditedReservation(prevState => ({
                                            ...prevState,
                                            fecha: nuevaFecha,
                                            horario: ''
                                        }));
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('📅 Click en input de fecha');
                                    }}
                                    onFocus={(e) => {
                                        e.stopPropagation();
                                        console.log('📅 Focus en input de fecha');
                                    }}
                                    onBlur={(e) => {
                                        const nuevaFecha = e.target.value;
                                        console.log('📅 onBlur - Fecha final:', nuevaFecha);
                                        setEditedReservation(prevState => ({
                                            ...prevState,
                                            fecha: nuevaFecha,
                                            horario: ''
                                        }));
                                    }}
                                    className={styles.formInput}
                                    style={{
                                        pointerEvents: 'auto',
                                        zIndex: 10,
                                        position: 'relative'
                                    }}
                                    required
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('📅 Click en botón de fecha');
                                        const input = e.target.previousElementSibling;
                                        if (input) {
                                            input.focus();
                                            input.showPicker && input.showPicker();
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        zIndex: 11
                                    }}
                                >
                                    📅
                                </button>
                            </div>
                            <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                                Debug: {editedReservation.fecha || 'Sin fecha'}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                <span className={styles.formLabelIcon}>⏰</span>
                                Turno
                            </label>
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
                                <option value="mediodia" disabled={isTurnoDisabled('mediodia')}>
                                    🌞 Mediodía
                                </option>
                                <option value="noche" disabled={isTurnoDisabled('noche')}>
                                    🌙 Noche
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                <span className={styles.formLabelIcon}>👥</span>
                                Personas
                            </label>
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
                                    <option key={num} value={num}>
                                        {num} {num === 1 ? 'persona' : 'personas'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                <span className={styles.formLabelIcon}>🕐</span>
                                Horario
                            </label>
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
                                    <option key={slot} value={slot}>{slot} hs</option>
                                ))}
                            </select>
                            {availableSlots.length === 0 && editedReservation.fecha && editedReservation.turno && editedReservation.personas && (
                                <div className={styles.errorMessage}>
                                    <AlertTriangle size={14} />
                                    No hay horarios disponibles para esta configuración
                                </div>
                            )}
                            {availableSlots.length > 0 && editedReservation.fecha && editedReservation.turno && editedReservation.personas && (
                                <div className={styles.successMessage}>
                                    <CheckCircle size={14} />
                                    {availableSlots.length} horario{availableSlots.length > 1 ? 's' : ''} disponible{availableSlots.length > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.modalButtonSecondary}
                        >
                            <X size={16} />
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.modalButtonPrimary}
                            disabled={!editedReservation.horario}
                        >
                            <CheckCircle size={16} />
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

// Componente para la lista de espera
const WaitingListView = ({ waitingList, onConfirmReservation, onDeleteReservation, onMarkAsNotified, getAvailableSlots, HORARIOS, formatDate, showNotification, showConfirmation }) => {
  const [confirmingReservation, setConfirmingReservation] = useState(null);
  const [selectedHorario, setSelectedHorario] = useState('');

  const handleConfirmClick = (waitingReservation) => {
    // Verificar si hay cupos disponibles
    const availableSlots = getAvailableSlots(waitingReservation.fecha, waitingReservation.turno);
    
    if (availableSlots.length === 0) {
      showNotification('error', 'No hay cupos disponibles para este turno. No se puede confirmar la reserva.');
      return;
    }

    setConfirmingReservation(waitingReservation);
    setSelectedHorario(waitingReservation.horario); // Usar horario preferido como default
  };

  const handleConfirmReservation = async () => {
    if (!selectedHorario) {
      showNotification('error', 'Por favor selecciona un horario.');
      return;
    }

    try {
      const { id, reservationId } = await onConfirmReservation(confirmingReservation.id, confirmingReservation, selectedHorario);
      
      // Generar mensaje para WhatsApp
      const mensaje = `🎉 ¡RESERVA CONFIRMADA!

Hola ${confirmingReservation.cliente.nombre}! Tu reserva ha sido confirmada exitosamente.

📅 *DETALLES DE TU RESERVA:*
• Código de gestión: *${reservationId}*
• Fecha: ${formatDate(confirmingReservation.fecha)}
• Turno: ${confirmingReservation.turno === 'mediodia' ? 'Mediodía' : 'Noche'}
• Horario: ${selectedHorario}
• Personas: ${confirmingReservation.personas} personas
• Mesa asignada: Mesa reservada ✅

⚠️ *IMPORTANTE:*
• Llega puntual a tu horario reservado
• Presenta este código al llegar: *${reservationId}*
• Para cancelar, avisa con 2 horas de anticipación

📍 Dirección: [Dirección del restaurante]
📞 Consultas: [Teléfono del restaurante]

¡Te esperamos en Rosaura! 🌹✨`;

      const phoneNumber = confirmingReservation.cliente.telefono;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensaje)}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      
      showNotification('success', `Reserva confirmada exitosamente. Código: ${reservationId}`);
      setConfirmingReservation(null);
      setSelectedHorario('');
    } catch (error) {
      showNotification('error', error.message || 'Error al confirmar la reserva.');
    }
  };

  const handleDeleteWaitingReservation = async (waitingReservation) => {
    const confirmed = await showConfirmation({
      title: 'Eliminar de lista de espera',
      message: `¿Estás seguro de que quieres eliminar a ${waitingReservation.cliente.nombre} de la lista de espera?`,
      confirmText: 'Eliminar'
    });

    if (confirmed) {
      try {
        await onDeleteReservation(waitingReservation.id);
        showNotification('success', 'Reserva eliminada de la lista de espera.');
      } catch (error) {
        showNotification('error', 'Error al eliminar la reserva de la lista de espera.');
      }
    }
  };

  const handleMarkAsNotified = async (waitingReservation) => {
    try {
      await onMarkAsNotified(waitingReservation.id);
      showNotification('success', 'Marcada como notificada.');
    } catch (error) {
      showNotification('error', 'Error al marcar como notificada.');
    }
  };

  const sortedWaitingList = [...waitingList].sort((a, b) => {
    // Ordenar por fecha primero, luego por hora de creación
    if (a.fecha !== b.fecha) {
      return new Date(a.fecha) - new Date(b.fecha);
    }
    return new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt) - 
           new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt);
  });

  if (sortedWaitingList.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center text-gray-500">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Clock size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes en espera</h3>
          <p className="text-gray-500">
            Las nuevas solicitudes aparecerán aquí cuando no haya cupos disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lista de Espera</h2>
              <p className="text-sm text-gray-500">
                {sortedWaitingList.length} solicitude{sortedWaitingList.length !== 1 ? 's' : ''} pendiente{sortedWaitingList.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6">
          {sortedWaitingList.map((waitingReservation) => {
            const availableSlots = getAvailableSlots(waitingReservation.fecha, waitingReservation.turno);
            const hasAvailableSlots = availableSlots.length > 0;
            
            return (
              <div 
                key={waitingReservation.id} 
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  hasAvailableSlots 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Header con cliente y estado */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${hasAvailableSlots ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <h3 
                      className="font-semibold text-gray-900 flex items-center gap-2 cursor-help" 
                      title={`ID: ${waitingReservation.waitingId}`}
                    >
                      <span className="text-lg">👤</span>
                      {waitingReservation.cliente.nombre}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAvailableSlots ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle size={14} className="mr-1" />
                        Cupo disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock size={14} className="mr-1" />
                        En espera
                      </span>
                    )}
                    {waitingReservation.notified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <MessageCircle size={12} className="mr-1" />
                        Notificado
                      </span>
                    )}
                  </div>
                </div>

                {/* Información de la reserva en una fila compacta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <span className="font-medium text-gray-900">{formatDate(waitingReservation.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{waitingReservation.turno === 'mediodia' ? '🌞' : '🌙'}</span>
                      <span className="font-medium text-gray-900">
                        {waitingReservation.turno === 'mediodia' ? 'Mediodía' : 'Noche'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👥</span>
                      <span className="font-medium text-gray-900">{waitingReservation.personas}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🕐</span>
                      <span className="font-medium text-gray-900">{waitingReservation.horario}hs</span>
                    </div>
                  </div>
                  
                  {/* Botones en línea horizontal */}
                  <div className="flex items-center gap-2">
                    {hasAvailableSlots && (
                      <button
                        onClick={() => handleConfirmClick(waitingReservation)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        <CheckCircle size={14} />
                        Confirmar
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        const mensaje = hasAvailableSlots 
                          ? `🎉 ¡Buenas noticias! Se liberó un cupo para tu reserva.

📅 *Solicitud de reserva #${waitingReservation.waitingId}*
• Fecha: ${formatDate(waitingReservation.fecha)}
• Turno: ${waitingReservation.turno === 'mediodia' ? 'Mediodía' : 'Noche'}
• Horario deseado: ${waitingReservation.horario}
• Personas: ${waitingReservation.personas}

✅ *¡Tu mesa está disponible!*
Responde "SÍ CONFIRMO" para asegurar tu reserva.
Si no respondes en las próximas 2 horas, el cupo se liberará.

¡Te esperamos en Rosaura! 🌹`
                          : `Hola ${waitingReservation.cliente.nombre}! 

Te contactamos sobre tu solicitud de reserva #${waitingReservation.waitingId}:
📅 Fecha: ${formatDate(waitingReservation.fecha)}
🕐 Turno: ${waitingReservation.turno === 'mediodia' ? 'Mediodía' : 'Noche'}
👥 ${waitingReservation.personas} personas

Actualmente estás en nuestra lista de espera. Te notificaremos apenas se libere un cupo.

¡Gracias por tu paciencia! 🌹`;
                        window.open(`https://wa.me/${waitingReservation.cliente.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
                      }}
                      className={`flex items-center gap-1 ${hasAvailableSlots ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200`}
                    >
                      <MessageCircle size={14} />
                      {hasAvailableSlots ? 'Avisar' : 'Contactar'}
                    </button>

                    {!waitingReservation.notified && (
                      <button
                        onClick={() => handleMarkAsNotified(waitingReservation)}
                        className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        <Check size={14} />
                        Notificar
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteWaitingReservation(waitingReservation)}
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de confirmación de reserva mejorado */}
      {confirmingReservation && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setConfirmingReservation(null)}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <CheckCircle size={24} color="white" />
              </div>
              <div className={styles.modalTitleContainer}>
                <h3 className={styles.modalTitle}>Confirmar Reserva</h3>
                <p className={styles.modalSubtitle}>
                  De lista de espera a reserva confirmada
                </p>
              </div>
              <button
                onClick={() => {
                  setConfirmingReservation(null);
                  setSelectedHorario('');
                }}
                className={styles.modalCloseButton}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalForm}>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-semibold text-gray-900">{confirmingReservation.cliente.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-semibold text-gray-900">{confirmingReservation.cliente.telefono}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-semibold text-gray-900">{formatDate(confirmingReservation.fecha)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Turno</p>
                    <p className="font-semibold text-gray-900">
                      {confirmingReservation.turno === 'mediodia' ? '🌞 Mediodía' : '🌙 Noche'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Personas</p>
                    <p className="font-semibold text-gray-900">👥 {confirmingReservation.personas}</p>
                  </div>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <span className={styles.formLabelIcon}>🕐</span>
                  Seleccionar horario final
                </label>
                <select
                  value={selectedHorario}
                  onChange={(e) => setSelectedHorario(e.target.value)}
                  className={styles.formSelect}
                  required
                >
                  <option value="">Elegir horario disponible</option>
                  {HORARIOS[confirmingReservation.turno].map(horario => {
                    const availableSlots = getAvailableSlots(confirmingReservation.fecha, confirmingReservation.turno);
                    const isAvailable = availableSlots.includes(horario);
                    return (
                      <option key={horario} value={horario} disabled={!isAvailable}>
                        {horario} hs {!isAvailable ? '(Sin cupo)' : '✅'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Importante</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Al confirmar esta reserva, se ocupará un cupo del turno y se enviará una notificación por WhatsApp al cliente.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={() => {
                    setConfirmingReservation(null);
                    setSelectedHorario('');
                  }}
                  className={styles.modalButtonSecondary}
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReservation}
                  disabled={!selectedHorario}
                  className={styles.modalButtonPrimary}
                >
                  <MessageCircle size={16} />
                  Confirmar y Notificar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

export const AdminView = ({ data, auth, onLogout, onSetBlacklist, onUpdateReservation, onDeleteReservation, onConfirmWaitingReservation, onDeleteWaitingReservation, onMarkAsNotified, getAvailableSlotsForEdit, getAvailableSlots, isValidDate, formatDate, HORARIOS }) => {
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
            {auth.role === 'admin' && (
              <button 
                onClick={() => setAdminView('tablemap')} 
                className={adminView === 'tablemap' ? styles.tabActive : styles.tabInactive}
              >
                Mapa de Mesas
              </button>
            )}
            {auth.role === 'admin' && (
              <button 
                onClick={() => setAdminView('waitinglist')} 
                className={adminView === 'waitinglist' ? styles.tabActive : styles.tabInactive}
              >
                Lista de Espera ({data.waitingList ? data.waitingList.length : 0})
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

        {adminView === 'tablemap' && (
          <TableMap 
            reservations={data.reservas}
            formatDate={formatDate}
          />
        )}

        {adminView === 'waitinglist' && (
          <WaitingListView 
            waitingList={data.waitingList || []}
            onConfirmReservation={onConfirmWaitingReservation}
            onDeleteReservation={onDeleteWaitingReservation}
            onMarkAsNotified={onMarkAsNotified}
            getAvailableSlots={getAvailableSlots}
            HORARIOS={HORARIOS}
            formatDate={formatDate}
            showNotification={showNotification}
            showConfirmation={showConfirmation}
          />
        )}
      </div>
    </div>
  );
};