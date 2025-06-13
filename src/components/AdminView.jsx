import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ThumbsDown, MessageCircle, Check, Edit2, Trash2, CheckCircle, X, XCircle, AlertTriangle, Sun, Moon, Clock, Printer, ChevronLeft, ChevronRight, Calendar, Users, Phone } from 'lucide-react';
import styles from './AdminView.module.css';
import TableMap from './TableMap';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import "../datepicker-custom.css";
import { TABLES_LAYOUT, DEFAULT_BLOCKED_TABLES, calculateAutoAssignments, setsAreEqual } from '../utils/mesaLogic';
import { saveTableAssignments, saveBlockedTables, loadBlockedTables, reassignTableManually, validateTableAssignment } from '../utils/mesaLogic';

// Registrar locale español para el DatePicker
registerLocale('es', es);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const NotificationContainer = ({ notifications, onClose }) => {
  if (notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-green-600" />;
      case 'error': return <XCircle size={20} className="text-red-600" />;
      case 'warning': return <AlertTriangle size={20} className="text-yellow-600" />;
      default: return <CheckCircle size={20} className="text-blue-600" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div key={notification.id} className={`flex items-center gap-3 p-4 border rounded-lg shadow-lg ${getStyles(notification.type)}`}>
          {getIcon(notification.type)}
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => onClose(notification.id)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

const ConfirmationModal = ({ confirmation, onConfirm, onCancel }) => {
  if (!confirmation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{confirmation.title}</h3>
        <p className="text-gray-600 mb-6">{confirmation.message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-yellow-500 mr-3" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Conflicto de Mesa Detectado</h3>
        </div>
        <div className="mb-6">
          <p className="text-gray-600 mb-3">{conflict.message}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>¿Deseas forzar la asignación?</strong> Esto reasignará la mesa y desasignará la reserva en conflicto.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onForce} 
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Forzar Asignación
          </button>
        </div>
      </div>
    </div>
  );
};

const EditReservationModal = ({ reservation, onClose, onSave, getAvailableSlotsForEdit, isValidDate, HORARIOS, showNotification }) => {
  const [editedReservation, setEditedReservation] = useState({
    cliente: { 
      ...reservation.cliente,
      comentarios: reservation.cliente.comentarios || ''
    },
    fecha: reservation.fecha,
    turno: reservation.turno,
    horario: reservation.horario,
    personas: reservation.personas
  });

  // Debug: Log inicial para verificar datos (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('EditReservationModal initialized');
    }
  }, []);

  const normalizeFecha = (fecha) => {
    if (!fecha) return '';
    if (fecha.includes('T')) {
      return fecha.split('T')[0];
    }
    return fecha;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    if (!editedReservation.cliente.nombre?.trim()) {
      showNotification('error', 'El nombre del cliente es obligatorio.');
      return;
    }
    
    if (!editedReservation.cliente.telefono?.trim()) {
      showNotification('error', 'El teléfono del cliente es obligatorio.');
      return;
    }
    
    if (!editedReservation.fecha) {
      showNotification('error', 'La fecha es obligatoria.');
      return;
    }
    
    if (!editedReservation.turno) {
      showNotification('error', 'El turno es obligatorio.');
      return;
    }
    
    if (!editedReservation.horario) {
      showNotification('error', 'El horario es obligatorio.');
      return;
    }
    
    if (!editedReservation.personas || editedReservation.personas < 1) {
      showNotification('error', 'La cantidad de personas es obligatoria.');
      return;
    }

    try {
      // Preparar los datos para guardar
      const dataToSave = {
        ...editedReservation,
        cliente: {
          ...editedReservation.cliente,
          nombre: editedReservation.cliente.nombre.trim(),
          telefono: editedReservation.cliente.telefono.trim(),
          comentarios: editedReservation.cliente.comentarios?.trim() || ''
        }
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Saving reservation data:', dataToSave);
      }
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      showNotification('error', 'Error al actualizar la reserva.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Editar Reserva</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={editedReservation.cliente.nombre}
                onChange={(e) => setEditedReservation({
                  ...editedReservation,
                  cliente: { ...editedReservation.cliente, nombre: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={editedReservation.cliente.telefono}
                onChange={(e) => setEditedReservation({
                  ...editedReservation,
                  cliente: { ...editedReservation.cliente, telefono: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={normalizeFecha(editedReservation.fecha)}
                onChange={(e) => setEditedReservation({
                  ...editedReservation,
                  fecha: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
              <select
                value={editedReservation.turno}
                onChange={(e) => setEditedReservation({
                  ...editedReservation,
                  turno: e.target.value,
                  horario: ''
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar turno</option>
                <option value="mediodia">🌞 Mediodía</option>
                <option value="noche">🌙 Noche</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
              <select
                value={editedReservation.horario}
                onChange={(e) => setEditedReservation({
                  ...editedReservation,
                  horario: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!editedReservation.turno}
              >
                <option value="">Seleccionar horario</option>
                {editedReservation.turno && HORARIOS[editedReservation.turno]?.map(horario => (
                  <option key={horario} value={horario}>{horario}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personas</label>
            <select
              value={editedReservation.personas}
              onChange={(e) => setEditedReservation({
                ...editedReservation,
                personas: parseInt(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar cantidad</option>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} persona{num !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
            <textarea
              value={editedReservation.cliente.comentarios || ''}
              onChange={(e) => setEditedReservation({
                ...editedReservation,
                cliente: { ...editedReservation.cliente, comentarios: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Comentarios adicionales (opcional)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReservationsTable = ({ 
  reservations, 
  onSetBlacklist, 
  onUpdateReservation, 
  onDeleteReservation, 
  showEditButton = false, 
  getAvailableSlotsForEdit, 
  isValidDate, 
  HORARIOS, 
  showNotification, 
  showConfirmation, 
  waitingList = [], 
  onConfirmWaitingReservation, 
  onDeleteWaitingReservation, 
  onMarkAsNotified, 
  getAvailableSlots, 
  formatDate,
  compactMode = false,
  assignmentMode = false,
  onReservationClick = null,
  selectedReservation = null,
  tableAssignments = {}
}) => {
  const [editingReservation, setEditingReservation] = useState(null);

  const handleSave = async (updatedData) => {
    try {
      console.log('Updating reservation:', editingReservation.id, updatedData);
      await onUpdateReservation(editingReservation.id, updatedData);
      setEditingReservation(null);
      showNotification('success', 'Reserva actualizada exitosamente.');
    } catch (error) {
      console.error('Error en handleSave:', error);
      showNotification('error', `Error al actualizar la reserva: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleDelete = async (reservation) => {
    const confirmed = await showConfirmation({
      title: 'Eliminar reserva',
      message: `¿Estás seguro de que quieres eliminar la reserva de ${reservation.cliente.nombre}?`,
      confirmText: 'Eliminar'
    });

    if (confirmed) {
      try {
        await onDeleteReservation(reservation.id);
        showNotification('success', 'Reserva eliminada exitosamente.');
      } catch (error) {
        showNotification('error', 'Error al eliminar la reserva.');
      }
    }
  };

  const handleBlacklist = async (reserva) => {
    const confirmed = await showConfirmation({
      title: 'Agregar a lista negra',
      message: `¿Estás seguro de que quieres agregar a ${reserva.cliente.nombre} a la lista negra?`,
      confirmText: 'Agregar'
    });

    if (confirmed) {
      try {
        await onSetBlacklist(reserva.cliente.id, true);
        showNotification('success', `${reserva.cliente.nombre} agregado a la lista negra.`);
      } catch (error) {
        showNotification('error', 'Error al agregar a la lista negra.');
      }
    }
  };

  const formatPhoneForWhatsApp = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('54')) {
      return cleaned;
    }
    if (cleaned.startsWith('9')) {
      return `54${cleaned}`;
    }
    return `549${cleaned}`;
  };

  const getWhatsAppMessage = (reserva) => {
    return `¡Hola ${reserva.cliente.nombre}! Te confirmamos tu reserva en Rosaura:

📅 Fecha: ${formatDate(reserva.fecha)}
⏰ Horario: ${reserva.horario} hs
👥 Personas: ${reserva.personas}
🎫 Código: ${reserva.reservationId}

¡Te esperamos! 🌹`;
  };

  if (reservations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No hay reservas para este turno.
      </div>
    );
  }

  return (
    <div className={`bg-white ${!compactMode ? 'rounded-lg shadow' : ''} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className={`bg-gray-50 ${compactMode ? 'text-xs' : ''}`}>
            <tr>
              <th className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${compactMode ? 'px-2 py-1' : ''}`}>
                Horario
              </th>
              <th className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${compactMode ? 'px-2 py-1' : ''}`}>
                Cliente
              </th>
              <th className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${compactMode ? 'px-2 py-1' : ''}`}>
                Personas
              </th>
              <th className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${compactMode ? 'px-2 py-1' : ''}`}>
                Comentarios
              </th>
              {tableAssignments && Object.keys(tableAssignments).length > 0 && (
                <th className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${compactMode ? 'px-2 py-1' : ''}`}>
                  Mesa
                </th>
              )}
              {!assignmentMode && (
                <th className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${compactMode ? 'px-2 py-1' : ''}`}>
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations
              .sort((a, b) => a.horario.localeCompare(b.horario))
              .map((reserva) => (
                <tr 
                  key={reserva.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    assignmentMode ? 'cursor-pointer' : ''
                  } ${
                    selectedReservation?.id === reserva.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => assignmentMode && onReservationClick && onReservationClick(reserva)}
                >
                  <td className={`px-3 py-2 whitespace-nowrap ${compactMode ? 'px-2 py-1 text-xs' : 'text-sm'}`}>
                    <div className={`font-medium text-gray-900 ${compactMode ? 'text-xs' : ''}`}>
                      {reserva.horario}
                    </div>
                  </td>
                  
                  <td className={`px-3 py-2 whitespace-nowrap ${compactMode ? 'px-2 py-1 text-xs' : 'text-sm'}`}>
                    <div>
                      <div className={`font-medium text-gray-900 ${compactMode ? 'text-xs' : ''}`}>
                        {reserva.cliente.nombre}
                      </div>
                      <div className={`text-gray-500 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                        {reserva.cliente.telefono}
                      </div>
                    </div>
                  </td>
                  
                  <td className={`px-3 py-2 whitespace-nowrap ${compactMode ? 'px-2 py-1 text-xs' : 'text-sm'}`}>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      reserva.personas <= 2 ? 'bg-green-100 text-green-800' :
                      reserva.personas <= 4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {reserva.personas}
                    </span>
                  </td>

                                     <td className={`px-3 py-2 whitespace-nowrap ${compactMode ? 'px-2 py-1 text-xs' : 'text-sm'}`}>
                     <div className="text-sm max-w-xs">
                       {reserva.cliente.comentarios ? (
                         <div className="text-xs text-gray-600 leading-relaxed italic">
                           {reserva.cliente.comentarios.length > 60 
                             ? `${reserva.cliente.comentarios.substring(0, 60)}...` 
                             : reserva.cliente.comentarios
                           }
                         </div>
                       ) : (
                         <span className="text-gray-300 text-xs">—</span>
                       )}
                     </div>
                   </td>

                  {tableAssignments && Object.keys(tableAssignments).length > 0 && (
                    <td className={`px-3 py-2 whitespace-nowrap ${compactMode ? 'px-2 py-1 text-xs' : 'text-sm'}`}>
                      {(reserva.mesaAsignada || tableAssignments[reserva.id]) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Mesa {reserva.mesaAsignada || tableAssignments[reserva.id]}
                        </span>
                      )}
                    </td>
                  )}
                  
                  {!assignmentMode && (
                    <td className={`px-3 py-2 whitespace-nowrap text-right ${compactMode ? 'px-2 py-1 text-xs' : 'text-sm'} font-medium`}>
                      <div className="flex items-center gap-1">
                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${formatPhoneForWhatsApp(reserva.cliente.telefono)}?text=${encodeURIComponent(getWhatsAppMessage(reserva))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-green-600 hover:text-green-900 transition-colors ${compactMode ? 'p-1' : 'p-2'}`}
                          title="Confirmar por WhatsApp"
                        >
                          <MessageCircle size={compactMode ? 14 : 16} />
                        </a>

                        {/* Editar */}
                        {showEditButton && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingReservation(reserva);
                            }}
                            className={`text-blue-600 hover:text-blue-900 transition-colors ${compactMode ? 'p-1' : 'p-2'}`}
                            title="Editar reserva"
                          >
                            <Edit2 size={compactMode ? 14 : 16} />
                          </button>
                        )}

                        {/* Eliminar */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(reserva);
                          }}
                          className={`text-red-600 hover:text-red-900 transition-colors ${compactMode ? 'p-1' : 'p-2'}`}
                          title="Eliminar reserva"
                        >
                          <Trash2 size={compactMode ? 14 : 16} />
                        </button>

                        {/* Lista negra */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlacklist(reserva);
                          }}
                          className={`text-gray-600 hover:text-gray-900 transition-colors ${compactMode ? 'p-1' : 'p-2'}`}
                          title="Agregar a lista negra"
                        >
                          <ThumbsDown size={compactMode ? 14 : 16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

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

// Componente para vista de clientes con lista negra
const WaitingListView = ({ waitingList, reservations, clients, onConfirmWaitingReservation, onDeleteWaitingReservation, onContactWaitingClient, onRejectWaitingReservation, getAvailableSlots, formatDate, HORARIOS, showNotification, showConfirmation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTurno, setSelectedTurno] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedWaiting, setSelectedWaiting] = useState(null);
  const [selectedHorario, setSelectedHorario] = useState('');
  const [selectedMesa, setSelectedMesa] = useState('');

  // Filtrar lista de espera por fecha y otros criterios
  const filteredWaitingList = waitingList.filter(waiting => {
    if (waiting.status === 'rejected') return false;
    
    // Filtro por fecha
    if (selectedDate && waiting.fecha !== selectedDate) return false;
    
    // Filtro por turno
    if (selectedTurno && waiting.turno !== selectedTurno) return false;
    
    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        waiting.cliente?.nombre?.toLowerCase().includes(searchLower) ||
        waiting.cliente?.telefono?.includes(searchTerm) ||
        waiting.waitingId?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Obtener historial de reservas para cada cliente filtrando por nombre Y teléfono
  const getClientHistory = (waiting) => {
    if (!waiting?.cliente || !reservations) return [];
    
    // Normalizar nombre y teléfono para buscar coincidencias
    const normalizedWaitingName = waiting.cliente.nombre.toLowerCase().trim();
    const normalizedWaitingPhone = waiting.cliente.telefono.replace(/\D/g, ''); // Solo números
    
    // Buscar todas las reservas con el mismo nombre Y teléfono
    return reservations.filter(reservation => {
      if (!reservation?.cliente?.nombre || !reservation?.cliente?.telefono) return false;
      
      const resNormalizedName = reservation.cliente.nombre.toLowerCase().trim();
      const resNormalizedPhone = reservation.cliente.telefono.replace(/\D/g, '');
      
      // Filtrar por nombre Y teléfono (ambos deben coincidir)
      return normalizedWaitingName === resNormalizedName && 
             normalizedWaitingPhone && resNormalizedPhone && 
             normalizedWaitingPhone === resNormalizedPhone;
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar por fecha más reciente
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '54' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('54')) {
      cleanPhone = '54' + cleanPhone;
    }
    return cleanPhone;
  };

  const handleContactClient = async (waiting) => {
    try {
      await onContactWaitingClient(waiting.id);
      
      const whatsappPhone = formatPhoneForWhatsApp(waiting.cliente.telefono);
      const fechaFormateada = formatDate(waiting.fecha);
      const turnoTexto = waiting.turno === 'mediodia' ? 'mediodía' : 'noche';
      
      const mensaje = `¡Hola ${waiting.cliente.nombre}! 🌹 
      
Tenemos buenas noticias. Hay disponibilidad para tu solicitud de reserva:
📅 ${fechaFormateada} - ${turnoTexto}
👥 ${waiting.personas} personas

Por favor confirma si quieres tomar esta reserva respondiendo "SÍ" a este mensaje. 

⏰ Si no recibimos confirmación en 30 minutos, el cupo será ofrecido a la siguiente persona en lista de espera.

¡Esperamos verte pronto en Rosaura!`;

      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappUrl, '_blank');
      
      showNotification('success', 'Cliente contactado. Esperando confirmación...');
    } catch (error) {
      showNotification('error', 'Error al contactar cliente');
    }
  };

  const handleConfirmReservation = (waiting) => {
    setSelectedWaiting(waiting);
    setSelectedHorario('');
    setSelectedMesa('');
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedHorario || !selectedMesa) {
      showNotification('error', 'Selecciona horario y mesa');
      return;
    }

    try {
      await onConfirmWaitingReservation(selectedWaiting.id, selectedWaiting, selectedHorario);
      showNotification('success', 'Reserva confirmada exitosamente');
      setShowConfirmModal(false);
      setSelectedWaiting(null);
    } catch (error) {
      showNotification('error', 'Error al confirmar reserva');
    }
  };

  const handleRejectReservation = async (waiting) => {
    const confirmed = await showConfirmation({
      title: 'Rechazar solicitud',
      message: `¿Estás seguro de rechazar la solicitud de ${waiting.cliente.nombre}?`,
      confirmText: 'Rechazar',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      try {
        await onRejectWaitingReservation(waiting.id, 'Rechazada por administración');
        showNotification('success', 'Solicitud rechazada');
      } catch (error) {
        showNotification('error', 'Error al rechazar solicitud');
      }
    }
  };

  const getStatusBadge = (waiting) => {
    if (waiting.contacted && waiting.awaitingConfirmation) {
      const now = new Date();
      const deadline = new Date(waiting.confirmationDeadline);
      const isExpired = now > deadline;
      
      if (isExpired) {
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 border border-red-200">
            <Clock size={12} className="mr-1" />
            Expirado
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="mr-1" />
            Esperando
          </span>
        );
      }
    }
    
    if (waiting.contacted) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          <MessageCircle size={12} className="mr-1" />
          Contactado
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-gray-50 text-gray-700 border border-gray-200">
        <Clock size={12} className="mr-1" />
        En espera
      </span>
    );
  };

  const availableHorarios = selectedWaiting ? getAvailableSlots(selectedWaiting.fecha, selectedWaiting.turno) : [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Lista de Espera</h2>
        <div className="text-sm text-gray-600">
          Total: {filteredWaitingList.length} solicitudes
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <input
            type="text"
            placeholder="Nombre, teléfono o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
          <select
            value={selectedTurno}
            onChange={(e) => setSelectedTurno(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los turnos</option>
            <option value="mediodia">Mediodía</option>
            <option value="noche">Noche</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDate(new Date().toISOString().split('T')[0]);
              setSelectedTurno('');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Teléfono</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Turno</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Pers.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Historial</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Notas</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWaitingList.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No hay solicitudes en lista de espera para los filtros seleccionados
                </td>
              </tr>
            ) : (
              filteredWaitingList.map((waiting) => {
                const clientHistory = getClientHistory(waiting);
                return (
                  <tr key={waiting.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium text-gray-900 whitespace-nowrap">{waiting.cliente.nombre}</div>
                        <div className="text-xs text-gray-500">{waiting.waitingId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <a 
                        href={`https://wa.me/${formatPhoneForWhatsApp(waiting.cliente.telefono)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 hover:underline text-sm whitespace-nowrap"
                      >
                        {waiting.cliente.telefono}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                        waiting.turno === 'mediodia' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {waiting.turno === 'mediodia' ? 'Mediodía' : 'Noche'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {waiting.personas}
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm">
                        <div className="text-gray-900 flex items-center gap-1 whitespace-nowrap">
                          <span>{clientHistory.length} total</span>
                          {clientHistory.filter(r => r.fecha >= new Date().toISOString().split('T')[0]).length > 0 && (
                            <span className="text-blue-600 font-medium">
                              • {clientHistory.filter(r => r.fecha >= new Date().toISOString().split('T')[0]).length} activa(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-sm max-w-xs">
                        {waiting.comentarios || waiting.cliente?.notasInternas || waiting.cliente?.comentarios ? (
                          <div className="space-y-1">
                            {waiting.comentarios && (
                              <div className="text-xs text-gray-700 p-1 bg-blue-50 rounded">
                                {waiting.comentarios.length > 50 
                                  ? `${waiting.comentarios.substring(0, 50)}...` 
                                  : waiting.comentarios
                                }
                              </div>
                            )}
                            {(waiting.cliente?.notasInternas || waiting.cliente?.comentarios) && (
                              <div className="text-xs text-gray-600 italic">
                                {(waiting.cliente?.notasInternas || waiting.cliente?.comentarios).length > 50 
                                  ? `${(waiting.cliente?.notasInternas || waiting.cliente?.comentarios).substring(0, 50)}...` 
                                  : (waiting.cliente?.notasInternas || waiting.cliente?.comentarios)
                                }
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {getStatusBadge(waiting)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => handleConfirmReservation(waiting)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          title="Confirmar reserva"
                        >
                          <Check size={10} className="mr-1" />
                          Confirmar
                        </button>
                        
                        <button
                          onClick={() => handleRejectReservation(waiting)}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          title="Rechazar solicitud"
                        >
                          <X size={10} className="mr-1" />
                          Rechazar
                        </button>
                        
                        <button
                          onClick={() => handleContactWaitingClient(waiting)}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                            waiting.contacted 
                              ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={waiting.contacted ? 'Ya contactado - Contactar nuevamente' : 'Contactar cliente'}
                        >
                          <MessageCircle size={10} className="mr-1" />
                          {waiting.contacted ? 'Recontactar' : 'Contactar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && selectedWaiting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmar Reserva</h3>
            <p className="text-gray-600 mb-4">
              Cliente: <strong>{selectedWaiting.cliente.nombre}</strong><br />
              Fecha: <strong>{formatDate(selectedWaiting.fecha)}</strong><br />
              Turno: <strong>{selectedWaiting.turno === 'mediodia' ? 'Mediodía' : 'Noche'}</strong><br />
              Personas: <strong>{selectedWaiting.personas}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Horario</label>
              <select
                value={selectedHorario}
                onChange={(e) => setSelectedHorario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar horario</option>
                {availableHorarios.map(horario => (
                  <option key={horario} value={horario}>{horario}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mesa</label>
              <select
                value={selectedMesa}
                onChange={(e) => setSelectedMesa(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar mesa</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(mesa => (
                  <option key={mesa} value={mesa}>Mesa {mesa}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Confirmar Reserva
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ClientsView = ({ clients, reservations, onSetBlacklist, onUpdateClientNotes, showNotification, showConfirmation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlacklist, setFilterBlacklist] = useState('withReservations'); // 'all', 'blacklisted', 'normal', 'withReservations'
  const [sortBy, setSortBy] = useState('ultimaReserva'); // 'nombre', 'telefono', 'ultimaReserva', 'totalReservas'
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState('');

  // Consolidar clientes duplicados y calcular estadísticas
  const consolidatedClients = useMemo(() => {
    const clientMap = new Map();
    
    clients.forEach(client => {
      // Normalizar nombre y teléfono para buscar duplicados
      const normalizedName = client.nombre.toLowerCase().trim();
      const normalizedPhone = client.telefono.replace(/\D/g, ''); // Solo números
      const key = `${normalizedName}_${normalizedPhone}`;
      
      if (clientMap.has(key)) {
        // Cliente duplicado encontrado, consolidar
        const existing = clientMap.get(key);
        // Mantener el más reciente o el que tenga más información
        if (!existing.ultimaReserva || (client.ultimaReserva && new Date(client.ultimaReserva) > new Date(existing.ultimaReserva))) {
          existing.ultimaReserva = client.ultimaReserva;
        }
        // Combinar comentarios si existen
        if (client.comentarios && !existing.comentarios) {
          existing.comentarios = client.comentarios;
        }
        // Mantener estado de lista negra si alguno lo tiene
        if (client.listaNegra) {
          existing.listaNegra = true;
        }
        // Agregar IDs consolidados
        existing.consolidatedIds = existing.consolidatedIds || [existing.id];
        existing.consolidatedIds.push(client.id);
      } else {
        clientMap.set(key, { ...client, consolidatedIds: [client.id] });
      }
    });
    
    return Array.from(clientMap.values());
  }, [clients]);

  // Calcular estadísticas de reservas por cliente
  const clientsWithStats = useMemo(() => {
    return consolidatedClients.map(client => {
      // Buscar todas las reservas para este cliente (por todos sus IDs consolidados)
      const clientReservations = reservations.filter(reservation => 
        client.consolidatedIds.includes(reservation.clienteId) ||
        (reservation.cliente && 
         client.consolidatedIds.some(id => id === reservation.cliente.id))
      );
      
      const today = new Date().toISOString().split('T')[0];
      const pastReservations = clientReservations.filter(r => r.fecha < today);
      const futureReservations = clientReservations.filter(r => r.fecha >= today);
      
      return {
        ...client,
        totalReservas: clientReservations.length,
        reservasPasadas: pastReservations.length,
        reservasFuturas: futureReservations.length,
        tieneReservasFuturas: futureReservations.length > 0,
        ultimaReservaReal: pastReservations.length > 0 ? 
          Math.max(...pastReservations.map(r => new Date(r.fecha))) : null
      };
    });
  }, [consolidatedClients, reservations]);

  // Filtrar y ordenar clientes
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clientsWithStats.filter(client => {
      const matchesSearch = 
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefono.includes(searchTerm);
      
      const matchesFilter = 
        filterBlacklist === 'all' ||
        (filterBlacklist === 'blacklisted' && client.listaNegra) ||
        (filterBlacklist === 'normal' && !client.listaNegra) ||
        (filterBlacklist === 'withReservations' && client.reservasPasadas > 0);
      
      return matchesSearch && matchesFilter;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'telefono':
          return a.telefono.localeCompare(b.telefono);
        case 'ultimaReserva':
          return new Date(b.ultimaReservaReal || b.ultimaReserva || 0) - new Date(a.ultimaReservaReal || a.ultimaReserva || 0);
        case 'totalReservas':
          return b.totalReservas - a.totalReservas;
        default:
          return 0;
      }
    });

    return filtered;
  }, [clientsWithStats, searchTerm, filterBlacklist, sortBy]);

  const handleToggleBlacklist = async (client) => {
    const newStatus = !client.listaNegra;
    const action = newStatus ? 'agregar a' : 'quitar de';
    
    const confirmed = await showConfirmation({
      title: `${newStatus ? 'Agregar a' : 'Quitar de'} lista negra`,
      message: `¿Estás seguro de que quieres ${action} la lista negra a ${client.nombre}?`,
      confirmText: newStatus ? 'Agregar' : 'Quitar'
    });

    if (confirmed) {
      try {
        await onSetBlacklist(client.id, newStatus);
        showNotification('success', `${client.nombre} ${newStatus ? 'agregado a' : 'quitado de'} la lista negra.`);
      } catch (error) {
        showNotification('error', 'Error al actualizar el estado del cliente.');
      }
    }
  };

  const getLastReservationDate = (client) => {
    const date = client.ultimaReservaReal || client.ultimaReserva;
    if (!date) return 'Sin reservas';
    return new Date(date).toLocaleDateString('es-AR');
  };

  const handleEditNotes = (client) => {
    setEditingNotes(client.id);
    setNotesText(client.notasInternas || '');
  };

  const handleSaveNotes = async () => {
    try {
      await onUpdateClientNotes(editingNotes, notesText);
      showNotification('success', 'Notas guardadas correctamente');
      setEditingNotes(null);
      setNotesText('');
    } catch (error) {
      console.error('Error al guardar notas:', error);
      showNotification('error', 'Error al guardar las notas');
    }
  };

  const handleCancelNotes = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  const blacklistedCount = consolidatedClients.filter(c => c.listaNegra).length;
  const normalCount = consolidatedClients.filter(c => !c.listaNegra).length;
  const withReservationsCount = clientsWithStats.filter(c => c.reservasPasadas > 0).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="mr-4">Total: <strong>{consolidatedClients.length}</strong></span>
              <span className="mr-4 text-blue-600">Con reservas: <strong>{withReservationsCount}</strong></span>
              <span className="mr-4 text-green-600">Normales: <strong>{normalCount}</strong></span>
              <span className="text-red-600">Lista negra: <strong>{blacklistedCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Controles de búsqueda y filtros */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filterBlacklist}
            onChange={(e) => setFilterBlacklist(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="withReservations">Con reservas pasadas</option>
            <option value="all">Todos los clientes</option>
            <option value="normal">Solo normales</option>
            <option value="blacklisted">Solo lista negra</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ultimaReserva">Más recientes primero</option>
            <option value="totalReservas">Por cantidad de reservas</option>
            <option value="nombre">Ordenar por nombre</option>
            <option value="telefono">Ordenar por teléfono</option>
          </select>
        </div>

        {/* Lista de clientes */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          {filteredAndSortedClients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || filterBlacklist !== 'all' 
                ? 'No se encontraron clientes con los filtros aplicados'
                : 'No hay clientes registrados'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reservas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Visita
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedClients.map((client) => (
                    <tr key={client.id} className={client.listaNegra ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.nombre}</div>
                          {client.comentarios && (
                            <div className="text-sm text-gray-500 truncate max-w-xs" title={client.comentarios}>
                              {client.comentarios}
                            </div>
                          )}
                          {client.consolidatedIds && client.consolidatedIds.length > 1 && (
                            <div className="text-xs text-blue-600">
                              Consolidado ({client.consolidatedIds.length} perfiles)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a
                          href={`https://wa.me/${client.telefono.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 hover:underline"
                        >
                          {client.telefono}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium text-gray-900">
                            Total: {client.totalReservas}
                          </div>
                          <div className="text-xs">
                            Pasadas: {client.reservasPasadas}
                          </div>
                          {client.tieneReservasFuturas && (
                            <div className="text-xs text-blue-600">
                              Futuras: {client.reservasFuturas}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getLastReservationDate(client)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm max-w-xs">
                          {client.notasInternas ? (
                            <div className="text-xs text-gray-600 leading-relaxed italic">
                              {client.notasInternas.length > 60 
                                ? `${client.notasInternas.substring(0, 60)}...` 
                                : client.notasInternas
                              }
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client.listaNegra ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <ThumbsDown size={12} className="mr-1" />
                            Lista Negra
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} className="mr-1" />
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleToggleBlacklist(client)}
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              client.listaNegra
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {client.listaNegra ? (
                              <>
                                <CheckCircle size={12} className="mr-1" />
                                Quitar
                              </>
                            ) : (
                              <>
                                <ThumbsDown size={12} className="mr-1" />
                                Lista negra
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleEditNotes(client)}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            <MessageCircle size={12} className="mr-1" />
                            Notas
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para editar notas internas */}
      {editingNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas Internas</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas privadas del cliente (solo visible para administradores)
              </label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Agregar notas sobre el cliente..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelNotes}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de vista panorama para mostrar resumen de reservas futuras
const PanoramaView = ({ reservations, formatDate, onGoToDailyView }) => {
  const [selectedTurnoPreview, setSelectedTurnoPreview] = useState(null);

  // Obtener próximos 7 días excluyendo lunes
  const getNext7Days = useCallback(() => {
    const days = [];
    const today = new Date();
    let currentDate = new Date(today);
    
    while (days.length < 7) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 1) { // Excluir lunes
        days.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, []);

  const next7Days = useMemo(() => getNext7Days(), [getNext7Days]);

  // Calcular estadísticas por día
  const getDayStats = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayReservations = reservations.filter(r => r.fecha === dateStr);
    
    const mediodiaReservations = dayReservations.filter(r => r.turno === 'mediodia');
    const nocheReservations = dayReservations.filter(r => r.turno === 'noche');
    
    const totalPersonasMediodia = mediodiaReservations.reduce((sum, r) => sum + r.personas, 0);
    const totalPersonasNoche = nocheReservations.reduce((sum, r) => sum + r.personas, 0);
    
    // Capacidad máxima aproximada por turno (basada en las mesas disponibles)
    const maxCapacityPerShift = 36; // 4*2 + 4*4 + 1*6 = 8 + 16 + 6 = 30, pero ajustamos a 36 para ser más realistas
    
    const isDomingo = date.getDay() === 0;
    
    return {
      date: dateStr,
      dayName: date.toLocaleDateString('es-AR', { weekday: 'long' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('es-AR', { month: 'short' }),
      totalReservations: dayReservations.length,
      mediodiaStats: {
        reservations: mediodiaReservations.length,
        personas: totalPersonasMediodia,
        ocupacion: Math.round((totalPersonasMediodia / maxCapacityPerShift) * 100)
      },
      nocheStats: isDomingo ? null : {
        reservations: nocheReservations.length,
        personas: totalPersonasNoche,
        ocupacion: Math.round((totalPersonasNoche / maxCapacityPerShift) * 100)
      },
      isDomingo,
      mediodiaReservations,
      nocheReservations
    };
  }, [reservations]);

  const getOccupancyColor = (ocupacion) => {
    if (ocupacion >= 90) return 'bg-red-500';
    if (ocupacion >= 70) return 'bg-orange-500';
    if (ocupacion >= 50) return 'bg-yellow-500';
    if (ocupacion >= 30) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const getOccupancyTextColor = (ocupacion) => {
    return ocupacion >= 30 ? 'text-white' : 'text-gray-700';
  };

  // Función para abrir preview de turno
  const handleTurnoClick = (date, turno, reservas) => {
    setSelectedTurnoPreview({
      date,
      turno,
      reservas,
      dateLabel: formatDate(date)
    });
  };

  // Función para ir a gestión diaria
  const handleGoToDailyView = (date, turno) => {
    if (onGoToDailyView) {
      onGoToDailyView(date, turno);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Panorama de Reservas - Próximos 7 Días</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {next7Days.map((date, index) => {
            const stats = getDayStats(date);
            
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-center mb-4">
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {stats.dayName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stats.dayNumber} {stats.month}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Mediodía */}
                  <div 
                    className="bg-white rounded-lg p-3 border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleTurnoClick(stats.date, 'mediodia', stats.mediodiaReservations)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-600">☀️</span>
                        <span className="text-sm font-medium text-gray-700">Mediodía</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {stats.mediodiaStats.reservations} reservas
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getOccupancyColor(stats.mediodiaStats.ocupacion)} transition-all duration-300`}
                          style={{ width: `${Math.min(stats.mediodiaStats.ocupacion, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getOccupancyColor(stats.mediodiaStats.ocupacion)} ${getOccupancyTextColor(stats.mediodiaStats.ocupacion)}`}>
                        {stats.mediodiaStats.ocupacion}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {stats.mediodiaStats.personas} personas
                    </div>
                  </div>

                  {/* Noche */}
                  {!stats.isDomingo ? (
                    <div 
                      className="bg-white rounded-lg p-3 border cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleTurnoClick(stats.date, 'noche', stats.nocheReservations)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-600">🌙</span>
                          <span className="text-sm font-medium text-gray-700">Noche</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {stats.nocheStats.reservations} reservas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getOccupancyColor(stats.nocheStats.ocupacion)} transition-all duration-300`}
                            style={{ width: `${Math.min(stats.nocheStats.ocupacion, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getOccupancyColor(stats.nocheStats.ocupacion)} ${getOccupancyTextColor(stats.nocheStats.ocupacion)}`}>
                          {stats.nocheStats.ocupacion}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {stats.nocheStats.personas} personas
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-3 border border-gray-300">
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-gray-400">🌙</span>
                        <span className="text-sm font-medium text-gray-400">Noche</span>
                      </div>
                      <div className="text-xs text-gray-400">Cerrado los domingos</div>
                    </div>
                  )}
                </div>

                {/* Total del día */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700">Total del día:</span>
                    <span className="text-xs font-bold text-gray-900">
                      {stats.totalReservations} reservas
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Leyenda de ocupación:</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>0-29% - Baja</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>30-49% - Moderada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>50-69% - Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>70-89% - Muy alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>90%+ - Completa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Preview del Turno */}
      {selectedTurnoPreview && (
        <TurnoPreviewModal
          preview={selectedTurnoPreview}
          onClose={() => setSelectedTurnoPreview(null)}
          onGoToDailyView={handleGoToDailyView}
        />
      )}
    </div>
  );
};

// Componente optimizado para vista "Hoy"
const TodayView = ({ reservations, onSetBlacklist, onUpdateReservation, onDeleteReservation, getAvailableSlotsForEdit, isValidDate, HORARIOS, showNotification, showConfirmation, formatDate, waitingList = [], onConfirmWaitingReservation, onDeleteWaitingReservation, onMarkAsNotified, onContactWaitingClient, onRejectWaitingReservation, getAvailableSlots, initialDate, initialTurno, onDateTurnoSet, onSaveBlockedTables, onLoadBlockedTables }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [selectedTurno, setSelectedTurno] = useState(initialTurno || 'mediodia');
  const [assignmentMode, setAssignmentMode] = useState(false);
  const [tableAssignments, setTableAssignments] = useState({});
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState({});
  const [pendingBlockedTables, setPendingBlockedTables] = useState(new Set());
  // Toggle para modificar cupos
  const [editCuposMode, setEditCuposMode] = useState(false);
  // Estados para conflictos de mesa
  const [conflict, setConflict] = useState(null);
  const [pendingTableAssignment, setPendingTableAssignment] = useState(null);

  // Layout de mesas - con tamaños estandarizados
  const TABLES_LAYOUT = [
    { id: 12, x: 50, y: 30, width: 70, height: 40, capacity: 4 }, // rectangular horizontal (tamaño estándar)
    { id: 13, x: 140, y: 30, width: 70, height: 40, capacity: 4 }, // rectangular horizontal (tamaño estándar)
    { id: 21, x: 50, y: 85, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (tamaño estándar)
    { id: 11, x: 50, y: 135, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (tamaño estándar)
    { id: 24, x: 140, y: 85, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (tamaño estándar)
    { id: 14, x: 190, y: 85, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (tamaño estándar)
    { id: 10, x: 50, y: 190, width: 70, height: 35, capacity: 4 }, // rectangular horizontal (igual que 12 y 13)
    { id: 9, x: 50, y: 235, width: 70, height: 35, capacity: 4 }, // rectangular horizontal (igual que 12 y 13)
    { id: 8, x: 50, y: 280, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (igual que 2)
    { id: 6, x: 140, y: 180, width: 35, height: 60, capacity: 4 }, // rectangular vertical (área igual que 12 y 13)
    { id: 7, x: 140, y: 250, width: 50, height: 70, capacity: 6 }, // rectangular vertical más grande (sin cambios)
    { id: 5, x: 220, y: 155, width: 35, height: 60, capacity: 4 }, // rectangular vertical (área igual que 12 y 13)
    { id: 4, x: 220, y: 225, width: 35, height: 60, capacity: 4 }, // rectangular vertical (área igual que 12 y 13)
    { id: 3, x: 220, y: 295, width: 35, height: 60, capacity: 4 }, // rectangular vertical (área igual que 12 y 13)
    { id: 2, x: 220, y: 365, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (sin cambios)
    { id: 1, x: 125, y: 365, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (igual que 2) - reposicionada
    { id: 31, x: 170, y: 365, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (igual que 2) - reposicionad
  ];

  // Orden de reserva de mesas - Actualizado
  const RESERVATION_ORDER = {
    2: [2, 8, 11, 21, 1, 31], // Mesas para 2 personas - Orden completo actualizado
    4: [9, 10, 6, 12, 13, 3],  // Mesas para 4 personas - Orden actualizado  
    6: [7]            // Mesa para 6 personas
  };

  // Funciones de navegación de fechas
  const goToPreviousDay = useCallback(() => {
    const currentDate = new Date(selectedDate);
    let previousDate;
    
    do {
      currentDate.setDate(currentDate.getDate() - 1);
      previousDate = currentDate.toISOString().split('T')[0];
    } while (new Date(previousDate).getDay() === 1); // Saltar lunes (cerrado)
    
    setSelectedDate(previousDate);
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    const currentDate = new Date(selectedDate);
    let nextDate;
    
    do {
      currentDate.setDate(currentDate.getDate() + 1);
      nextDate = currentDate.toISOString().split('T')[0];
    } while (new Date(nextDate).getDay() === 1); // Saltar lunes (cerrado)
    
    setSelectedDate(nextDate);
  }, [selectedDate]);

  const handleDateSelect = useCallback((date) => {
    if (date) {
      const selectedDateStr = date.toISOString().split('T')[0];
      setSelectedDate(selectedDateStr);
      setShowDatePicker(false);
    }
  }, []);

  // Verificar si un día está disponible (no es lunes, y si es domingo verificar turno)
  const isDayAvailable = useCallback((date, turno = null) => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 1) return false; // Lunes cerrado
    if (dayOfWeek === 0 && turno === 'noche') return false; // Domingos sin turno noche
    return true;
  }, []);

  // Filtrar reservas por fecha y turno seleccionados
  const reservationsForSelectedDate = useMemo(() => 
    reservations.filter(r => r.fecha === selectedDate), 
    [reservations, selectedDate]
  );

  const reservasTurnoSeleccionado = useMemo(() => 
    reservationsForSelectedDate.filter(r => r.turno === selectedTurno), 
    [reservationsForSelectedDate, selectedTurno]
  );

  // Obtener asignaciones de mesas desde las reservas guardadas en BD
  const getTableAssignments = useCallback((reservations) => {
    const assignments = {};
    
    reservations.forEach(reserva => {
      if (reserva.mesaAsignada) {
        assignments[reserva.id] = reserva.mesaAsignada;
      }
    });
    
    return assignments;
  }, []);

  // Cargar asignaciones desde la base de datos cuando cambian las reservas o el turno
  useEffect(() => {
    const savedAssignments = getTableAssignments(reservasTurnoSeleccionado);
    setTableAssignments(savedAssignments);
    setPendingAssignments(savedAssignments);
  }, [reservasTurnoSeleccionado, getTableAssignments]);

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

  // Cambiar a mediodía automáticamente si es domingo y está seleccionado noche
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
  }, [initialDate, initialTurno, onDateTurnoSet]);

  // Funciones de manejo
  const isMesaOcupada = (mesaId) => {
    return Object.values(tableAssignments).includes(mesaId);
  };

  const handleTableClick = async (tableId) => {
    if (assignmentMode && selectedReservation) {
      // Modo asignación manual: asignar reserva a mesa con validación de conflictos
      try {
        const result = await reassignTableManually(
          selectedReservation.id,
          tableId,
          reservationsForSelectedDate,
          onUpdateReservation,
          showNotification,
          false // No forzar inicialmente
        );

        if (result.hasConflict) {
          // Mostrar modal de conflicto
          setConflict({
            ...result,
            tableId,
            reservationId: selectedReservation.id
          });
          setPendingTableAssignment({
            reservationId: selectedReservation.id,
            tableId: tableId
          });
        } else {
          // Asignación exitosa
          setSelectedReservation(null);
          setAssignmentMode(false);
        }
      } catch (error) {
        showNotification('error', 'Error al asignar mesa');
      }
    } else if (editCuposMode) {
      // Solo permitir modificar bloqueos si está activado el modo cupos
      toggleTableBlock(tableId);
    }
  };

  // Función para forzar asignación después de conflicto
  const handleForceAssignment = async () => {
    if (pendingTableAssignment) {
      try {
        await reassignTableManually(
          pendingTableAssignment.reservationId,
          pendingTableAssignment.tableId,
          reservationsForSelectedDate,
          onUpdateReservation,
          showNotification,
          true // Forzar asignación
        );
        
        setConflict(null);
        setPendingTableAssignment(null);
        setSelectedReservation(null);
        setAssignmentMode(false);
      } catch (error) {
        showNotification('error', 'Error al forzar asignación');
      }
    }
  };

  // Función para cancelar asignación conflictiva
  const handleCancelConflict = () => {
    setConflict(null);
    setPendingTableAssignment(null);
  };

  const handleReservationClick = useCallback((reserva) => {
    if (!assignmentMode) return;
    setSelectedReservation(reserva);
  }, [assignmentMode]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Funciones para manejo de lista de espera
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '54' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('54')) {
      cleanPhone = '54' + cleanPhone;
    }
    return cleanPhone;
  };

  const handleContactWaitingClient = async (waiting) => {
    try {
      await onContactWaitingClient(waiting.id);
      
      const whatsappPhone = formatPhoneForWhatsApp(waiting.cliente.telefono);
      const fechaFormateada = formatDate(waiting.fecha);
      const turnoTexto = waiting.turno === 'mediodia' ? 'mediodía' : 'noche';
      
      const mensaje = `¡Hola ${waiting.cliente.nombre}! 🌹 
      
Tenemos buenas noticias. Hay disponibilidad para tu solicitud de reserva:
📅 ${fechaFormateada} - ${turnoTexto}
👥 ${waiting.personas} personas

Por favor confirma si quieres tomar esta reserva respondiendo "SÍ" a este mensaje. 

⏰ Si no recibimos confirmación en 30 minutos, el cupo será ofrecido a la siguiente persona en lista de espera.

¡Esperamos verte pronto en Rosaura!`;

      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappUrl, '_blank');
      
      showNotification('success', 'Cliente contactado. Esperando confirmación...');
    } catch (error) {
      showNotification('error', 'Error al contactar cliente');
    }
  };

  const handleQuickConfirmWaiting = async (waiting) => {
    try {
      const availableSlots = getAvailableSlots(waiting.fecha, waiting.turno);
      if (availableSlots.length === 0) {
        showNotification('error', 'No hay horarios disponibles para confirmar');
        return;
      }
      
      // Usar el primer horario disponible
      const selectedHorario = availableSlots[0];
      
      await onConfirmWaitingReservation(waiting.id, waiting, selectedHorario);
      showNotification('success', 'Reserva confirmada exitosamente');
    } catch (error) {
      showNotification('error', 'Error al confirmar reserva');
    }
  };

  const handleRejectWaiting = async (waiting) => {
    const confirmed = await showConfirmation({
      title: 'Rechazar solicitud',
      message: `¿Estás seguro de rechazar la solicitud de ${waiting.cliente.nombre}?`,
      confirmText: 'Rechazar',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      try {
        await onRejectWaitingReservation(waiting.id, 'Rechazada por administración');
        showNotification('success', 'Solicitud rechazada');
      } catch (error) {
        showNotification('error', 'Error al rechazar solicitud');
      }
    }
  };

  const getWaitingStatusBadge = (waiting) => {
    if (waiting.contacted && waiting.awaitingConfirmation) {
      const now = new Date();
      const deadline = new Date(waiting.confirmationDeadline);
      const isExpired = now > deadline;
      
      if (isExpired) {
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-red-50 text-red-700 border border-red-200">
            <Clock size={12} className="mr-1" />
            Expirado
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="mr-1" />
            Esperando
          </span>
        );
      }
    }
    
    if (waiting.contacted) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          <MessageCircle size={12} className="mr-1" />
          Contactado
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-gray-50 text-gray-700 border border-gray-200">
        <Clock size={12} className="mr-1" />
        En espera
      </span>
    );
  };

  // Filtrar lista de espera para el día seleccionado
  const waitingForSelectedDate = useMemo(() => 
    waitingList.filter(w => w.fecha === selectedDate && w.status !== 'rejected'), 
    [waitingList, selectedDate]
  );

  const waitingForSelectedTurno = useMemo(() => 
    waitingForSelectedDate.filter(w => w.turno === selectedTurno), 
    [waitingForSelectedDate, selectedTurno]
  );

  // Organizar reservas por turno
  const organizarReservasPorTurno = useCallback((reservations) => {
    const reservasPorTurno = { mediodia: [], noche: [] };

    reservations.forEach(reserva => {
      if (reserva.turno === 'mediodia') {
        reservasPorTurno.mediodia.push(reserva);
      } else if (reserva.turno === 'noche') {
        reservasPorTurno.noche.push(reserva);
      } else {
        const hora = parseInt(reserva.horario.split(':')[0]);
        if (hora < 18) {
          reservasPorTurno.mediodia.push(reserva);
        } else {
          reservasPorTurno.noche.push(reserva);
        }
      }
    });

    reservasPorTurno.mediodia.sort((a, b) => a.horario.localeCompare(b.horario));
    reservasPorTurno.noche.sort((a, b) => a.horario.localeCompare(b.horario));

    return reservasPorTurno;
  }, []);

  const reservasPorTurno = useMemo(() => organizarReservasPorTurno(reservationsForSelectedDate), [reservationsForSelectedDate, organizarReservasPorTurno]);

  // --- BLOQUEOS Y ASIGNACIÓN CENTRALIZADA ---
  const [blockedTables, setBlockedTables] = useState(() => {
    // Bloqueos predeterminados: 1,4,5,14,24
    return new Set([1, 4, 5, 14, 24]);
  });

  // Cargar bloqueos guardados al cambiar fecha/turno
  useEffect(() => {
    const loadSavedBlocked = async () => {
      try {
        const savedBlocked = await loadBlockedTables(selectedDate, selectedTurno, onLoadBlockedTables);
        if (savedBlocked && savedBlocked.size > 0) {
          setBlockedTables(savedBlocked);
          setPendingBlockedTables(savedBlocked);
        } else {
          // Si no hay guardados, usar predeterminados
          const predet = new Set([1, 4, 5, 14, 24]);
          setBlockedTables(predet);
          setPendingBlockedTables(predet);
        }
      } catch (error) {
        console.error('Error al cargar bloqueos:', error);
      }
    };
    
    loadSavedBlocked();
  }, [selectedDate, selectedTurno, onLoadBlockedTables]);

  // Recalcular asignaciones/bloqueos cada vez que cambian reservasTurnoSeleccionado
  useEffect(() => {
    const { assignments, blockedTables: calcBlocked } = calculateAutoAssignments(reservasTurnoSeleccionado, blockedTables);
    setTableAssignments(assignments);
    setPendingAssignments(assignments);
    if (!setsAreEqual(blockedTables, calcBlocked)) {
      setBlockedTables(calcBlocked);
      setPendingBlockedTables(calcBlocked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservasTurnoSeleccionado]);

  // Función para saber si una mesa está bloqueada
  const isMesaBloqueada = (mesaId) => blockedTables.has(mesaId);

  // Función de estado resumido
  const getMesaEstado = (mesaId) => {
    if (isMesaOcupada(mesaId)) return 'occupied';
    if (isMesaBloqueada(mesaId)) return 'blocked';
    return 'available';
  };

  // Función para alternar bloqueo de mesa
  const toggleTableBlock = (tableId) => {
    const newBlockedTables = new Set(pendingBlockedTables);
    if (newBlockedTables.has(tableId)) {
      newBlockedTables.delete(tableId);
    } else {
      // Solo bloquear si no está ocupada
      if (!isMesaOcupada(tableId)) {
        newBlockedTables.add(tableId);
      }
    }
    setPendingBlockedTables(newBlockedTables);
  };

  // Función para guardar cambios
  const handleSaveChanges = async () => {
    try {
      // Guardar asignaciones
      if (Object.keys(pendingAssignments).length > 0) {
        await saveTableAssignments(pendingAssignments, onUpdateReservation, showNotification);
      }
      
      // Guardar bloqueos
      if (!setsAreEqual(blockedTables, pendingBlockedTables)) {
        await saveBlockedTables(pendingBlockedTables, selectedDate, selectedTurno, onSaveBlockedTables, showNotification);
        setBlockedTables(pendingBlockedTables);
      }
      
      showNotification('success', 'Cambios guardados correctamente');
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      showNotification('error', 'Error al guardar los cambios');
    }
  };

  // Función para cancelar cambios
  const handleCancelChanges = () => {
    setPendingAssignments(tableAssignments);
    setPendingBlockedTables(blockedTables);
    setAssignmentMode(false);
    setSelectedReservation(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header con navegación de fechas y controles */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Navegación de fechas */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                title="Día anterior"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Seleccionar fecha"
                >
                  <Calendar size={16} />
                  <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
                </button>
                
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200">
                    <DatePicker
                      selected={new Date(selectedDate)}
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
                      calendarClassName="custom-green-calendar"
                    />
                  </div>
                )}
              </div>
              
              <button
                onClick={goToNextDay}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                title="Día siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            {/* Toggle Modo Asignar */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditCuposMode(!editCuposMode)}
                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                  editCuposMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {editCuposMode ? 'Modificando cupos' : 'Modificar cupos'}
              </button>
              <button
                onClick={() => setAssignmentMode(!assignmentMode)}
                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                  assignmentMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {assignmentMode ? 'Modo Asignación Activo' : 'Activar Asignación'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botones de turno */}
            <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setSelectedTurno('mediodia')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTurno === 'mediodia'
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Mediodía
              </button>
              <button
                onClick={() => setSelectedTurno('noche')}
                disabled={new Date(selectedDate).getDay() === 0} // Desactivar en domingos
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  new Date(selectedDate).getDay() === 0 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : selectedTurno === 'noche'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={new Date(selectedDate).getDay() === 0 ? 'Los domingos no hay turno noche' : ''}
              >
                Noche
              </button>
            </div>

            {/* Botón imprimir */}
            <button onClick={handlePrint} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
              <Printer size={16} />
              Imprimir
            </button>
          </div>
        </div>

        {/* Información del modo asignación */}
        {assignmentMode && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <span className="font-medium">🎯 Modo Asignación Activo</span>
              {selectedReservation ? (
                <span>- Reserva seleccionada: <strong>{selectedReservation.cliente.nombre}</strong> ({selectedReservation.personas} personas)</span>
              ) : (
                <span>- Selecciona una reserva y luego haz click en una mesa</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sección Lista de Espera para el día seleccionado */}
      {waitingForSelectedTurno.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
              ⏳ Lista de Espera - {formatDate(selectedDate)} - {selectedTurno === 'mediodia' ? 'Mediodía' : 'Noche'}
            </h3>
            <span className="text-sm text-amber-600 font-medium">
              {waitingForSelectedTurno.length} {waitingForSelectedTurno.length === 1 ? 'solicitud' : 'solicitudes'}
            </span>
          </div>
          
          <div className="bg-white border border-amber-200 rounded-lg overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Personas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Comentarios</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waitingForSelectedTurno.map((waiting) => {
                  // Obtener historial del cliente filtrando por nombre Y teléfono
                  const getClientHistory = (waiting) => {
                    if (!reservations || !waiting?.cliente?.nombre || !waiting?.cliente?.telefono) return [];
                    
                    // Normalizar nombre y teléfono para comparación
                    const normalizePhone = (phone) => {
                      return phone?.toString().replace(/\D/g, ''); // Solo números
                    };
                    
                    const waitingName = waiting.cliente.nombre.toLowerCase().trim();
                    const waitingPhone = normalizePhone(waiting.cliente.telefono);
                    
                    return reservations.filter(reserva => {
                      if (!reserva?.cliente?.nombre || !reserva?.cliente?.telefono) return false;
                      
                      const reservaName = reserva.cliente.nombre.toLowerCase().trim();
                      const reservaPhone = normalizePhone(reserva.cliente.telefono);
                      
                      // Filtrar por nombre Y teléfono (ambos deben coincidir)
                      return waitingName === reservaName && 
                             waitingPhone && reservaPhone && 
                             waitingPhone === reservaPhone;
                    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                  };
                  
                  const clientHistory = getClientHistory(waiting);
                  
                  return (
                    <tr key={waiting.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{waiting.cliente.nombre}</div>
                          <div className="text-xs text-gray-500">
                            ID: {waiting.waitingId}
                            {clientHistory.length > 0 && (
                              <span className="ml-2 text-blue-600">
                                • {clientHistory.length} reserva{clientHistory.length !== 1 ? 's' : ''} 
                                {clientHistory.filter(r => r.fecha >= new Date().toISOString().split('T')[0]).length > 0 && (
                                  <span className="font-medium">
                                    ({clientHistory.filter(r => r.fecha >= new Date().toISOString().split('T')[0]).length} activa{clientHistory.filter(r => r.fecha >= new Date().toISOString().split('T')[0]).length !== 1 ? 's' : ''})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a 
                          href={`https://wa.me/${formatPhoneForWhatsApp(waiting.cliente.telefono)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 hover:underline text-sm"
                        >
                          {waiting.cliente.telefono}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {waiting.personas}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm max-w-xs">
                          {waiting.comentarios || waiting.cliente?.notasInternas || waiting.cliente?.comentarios ? (
                            <div className="space-y-1">
                              {waiting.comentarios && (
                                <div className="text-xs text-gray-700 p-1 bg-blue-50 rounded">
                                  {waiting.comentarios.length > 40 
                                    ? `${waiting.comentarios.substring(0, 40)}...` 
                                    : waiting.comentarios
                                  }
                                </div>
                              )}
                              {(waiting.cliente?.notasInternas || waiting.cliente?.comentarios) && (
                                <div className="text-xs text-gray-600 italic">
                                  {(waiting.cliente?.notasInternas || waiting.cliente?.comentarios).length > 40 
                                    ? `${(waiting.cliente?.notasInternas || waiting.cliente?.comentarios).substring(0, 40)}...` 
                                    : (waiting.cliente?.notasInternas || waiting.cliente?.comentarios)
                                  }
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getWaitingStatusBadge(waiting)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleQuickConfirmWaiting(waiting)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            title="Confirmar reserva"
                          >
                            <Check size={10} className="mr-1" />
                            Confirmar
                          </button>
                          
                          <button
                            onClick={() => handleRejectWaiting(waiting)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Rechazar solicitud"
                          >
                            <X size={10} className="mr-1" />
                            Rechazar
                          </button>
                          
                          <button
                            onClick={() => handleContactWaitingClient(waiting)}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                              waiting.contacted 
                                ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={waiting.contacted ? 'Ya contactado - Contactar nuevamente' : 'Contactar cliente'}
                          >
                            <MessageCircle size={10} className="mr-1" />
                            {waiting.contacted ? 'Recontactar' : 'Contactar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex">
        {/* Mapa de Mesas - Lado Izquierdo */}
        <div className="w-1/2 p-6 border-r border-gray-200">
          {/* Controles de guardado */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-yellow-800">
                <strong>Cambios pendientes:</strong> 
                {Object.keys(pendingAssignments).length > 0 && ` ${Object.keys(pendingAssignments).length} asignaciones`}
                {!setsAreEqual(blockedTables, pendingBlockedTables) && ` • Bloqueos modificados`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelChanges}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <svg 
              viewBox="0 0 350 600" 
              className="w-full h-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fondo del restaurante */}
              <rect x="0" y="0" width="350" height="600" fill="#fafafa" stroke="#e5e7eb" strokeWidth="2" />
              
              {/* Líneas divisorias */}
              <line x1="190" y1="140" x2="260" y2="140" stroke="#374151" strokeWidth="2" />
              
              {/* Mesas */}
              {TABLES_LAYOUT.map((table) => {
                const isOcupada = Object.values(pendingAssignments).includes(table.id);
                const isBloqueada = pendingBlockedTables.has(table.id);
                const estado = isOcupada ? 'occupied' : isBloqueada ? 'blocked' : 'available';
                
                const strokeColor = isOcupada ? '#dc2626' : isBloqueada ? '#f59e0b' : '#0c4900';

                return (
                  <g key={table.id}>
                    <rect
                      x={table.x}
                      y={table.y}
                      width={table.width}
                      height={table.height}
                      fill="#ffffff"
                      stroke={strokeColor}
                      strokeWidth="2"
                      rx="3"
                      className="cursor-pointer"
                      onClick={() => handleTableClick(table.id)}
                    />
                    <text
                      x={table.x + table.width / 2}
                      y={table.y + table.height / 2 + ((isOcupada || isBloqueada) ? -5 : 6)}
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="bold"
                      fill="#0c4900"
                    >
                      {table.id}
                    </text>
                    {isOcupada && (
                      <circle
                        cx={table.x + table.width / 2}
                        cy={table.y + table.height / 2 + 10}
                        r="6"
                        fill="#dc2626"
                      />
                    )}
                    {isBloqueada && (
                      <circle
                        cx={table.x + table.width / 2}
                        cy={table.y + table.height / 2 + 10}
                        r="4"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}
              
              {/* Leyenda */}
              <g>
                <rect x="30" y="575" width="15" height="12" fill="#ffffff" stroke="#0c4900" strokeWidth="1" rx="1" />
                <text x="50" y="583" fontSize="9" fill="#6b7280">Libre</text>
                <rect x="80" y="575" width="15" height="12" fill="#ffffff" stroke="#dc2626" strokeWidth="1" rx="1" />
                <circle cx="87.5" cy="581" r="3" fill="#dc2626" />
                <text x="100" y="583" fontSize="9" fill="#6b7280">Reservada</text>
                <rect x="160" y="575" width="15" height="12" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" rx="1" />
                <circle cx="167.5" cy="581" r="2" fill="none" stroke="#f59e0b" strokeWidth="1" />
                <text x="180" y="583" fontSize="9" fill="#6b7280">Walk-in</text>
              </g>
            </svg>
          </div>

          {/* Orden de reserva */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Orden de Reserva</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><span className="font-medium">2 pers:</span> {RESERVATION_ORDER[2].join(' → ')}</div>
              <div><span className="font-medium">4 pers:</span> {RESERVATION_ORDER[4].join(' → ')}</div>
              <div><span className="font-medium">6 pers:</span> {RESERVATION_ORDER[6].join(' → ')}</div>
            </div>
          </div>
        </div>

        {/* Barra Lateral Derecha - Tabla de Reservas */}
        <div className="w-1/2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedTurno === 'mediodia' ? '☀️ Mediodía' : '🌙 Noche'} - {reservasPorTurno[selectedTurno].length} reservas
            </h3>
          </div>

          {/* Tabla de reservas moderna */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Indicador de modo asignación */}
            {assignmentMode && (
              <div className="bg-blue-50 border-b border-blue-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    <strong>Modo Asignación Activo</strong>
                    {selectedReservation && (
                      <span className="ml-2">
                        • Seleccionado: {selectedReservation.cliente?.nombre} ({selectedReservation.personas} personas)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-blue-600">
                    Haz clic en una reserva para seleccionarla, luego en una mesa para asignarla
                  </div>
                </div>
              </div>
            )}
            
            <ReservationsTable
              reservations={reservasPorTurno[selectedTurno]}
              onSetBlacklist={onSetBlacklist}
              onUpdateReservation={onUpdateReservation}
              onDeleteReservation={onDeleteReservation}
              showEditButton={!assignmentMode}
              getAvailableSlotsForEdit={getAvailableSlotsForEdit}
              isValidDate={isValidDate}
              HORARIOS={HORARIOS}
              showNotification={showNotification}
              showConfirmation={showConfirmation}
              waitingList={waitingList}
              onConfirmWaitingReservation={onConfirmWaitingReservation}
              onDeleteWaitingReservation={onDeleteWaitingReservation}
              onMarkAsNotified={onMarkAsNotified}
              getAvailableSlots={getAvailableSlots}
              formatDate={formatDate}
              compactMode={true}
              assignmentMode={assignmentMode}
              onReservationClick={(reserva) => {
                if (assignmentMode) {
                  setSelectedReservation(reserva);
                }
              }}
              selectedReservation={selectedReservation}
              tableAssignments={pendingAssignments}
            />
          </div>
        </div>
      </div>

      {/* Info de impresión */}
      <div className="hidden print:block p-4 text-center text-xs text-gray-500">
        Generado el {new Date().toLocaleString('es-AR')} | Rosaura - Sistema de Reservas
      </div>

      {/* Modal de Conflicto */}
      <ConflictModal
        conflict={conflict}
        onForce={handleForceAssignment}
        onCancel={handleCancelConflict}
      />
    </div>
  );
};

export const AdminView = ({ data, auth, onLogout, onSetBlacklist, onUpdateClientNotes, onUpdateReservation, onDeleteReservation, onConfirmWaitingReservation, onDeleteWaitingReservation, onMarkAsNotified, onContactWaitingClient, onRejectWaitingReservation, getAvailableSlotsForEdit, getAvailableSlots, isValidDate, formatDate, HORARIOS, onSaveBlockedTables, onLoadBlockedTables }) => {
  const [adminView, setAdminView] = useState('daily');
  const [notifications, setNotifications] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [selectedDateFromPanorama, setSelectedDateFromPanorama] = useState(null);
  const [selectedTurnoFromPanorama, setSelectedTurnoFromPanorama] = useState(null);

  // Función para mostrar notificaciones
  const showNotification = useCallback((type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-remove después de 4 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const closeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Función para mostrar confirmaciones
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

  const todayReservations = data.reservas.filter(r => r.fecha === new Date().toISOString().split('T')[0]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoSection}>
          <img src="/logo.png" alt="Rosaura" className={styles.logo} />
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Rosaura</h1>
            <p className={styles.subtitle}>Sistema de Reservas</p>
          </div>
        </div>
        <div className={styles.userSection}>
          <span className={styles.userName}>{auth.username}</span>
          <button onClick={onLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Notificaciones */}
      <NotificationContainer notifications={notifications} onClose={closeNotification} />

      {/* Confirmación Modal */}
      {confirmation && (
        <ConfirmationModal
          confirmation={confirmation}
          onConfirm={() => handleConfirmation(true)}
          onCancel={() => handleConfirmation(false)}
        />
      )}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsContent}>
          <div className={styles.tabsList}>
            <button 
              onClick={() => setAdminView('daily')} 
              className={adminView === 'daily' ? styles.tabActive : styles.tabInactive}
            >
              Gestión Diaria
            </button>
            <button 
              onClick={() => setAdminView('panorama')} 
              className={adminView === 'panorama' ? styles.tabActive : styles.tabInactive}
            >
              Panorama
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
        {adminView === 'daily' && (
          <TodayView 
            reservations={data.reservas}
            onSetBlacklist={onSetBlacklist}
            onUpdateReservation={onUpdateReservation}
            onDeleteReservation={onDeleteReservation}
            getAvailableSlotsForEdit={getAvailableSlotsForEdit}
            isValidDate={isValidDate}
            HORARIOS={HORARIOS}
            showNotification={showNotification}
            showConfirmation={showConfirmationDialog}
            formatDate={formatDate}
            waitingList={data.waitingList || []}
            onConfirmWaitingReservation={onConfirmWaitingReservation}
            onDeleteWaitingReservation={onDeleteWaitingReservation}
            onMarkAsNotified={onMarkAsNotified}
            onContactWaitingClient={onContactWaitingClient}
            onRejectWaitingReservation={onRejectWaitingReservation}
            getAvailableSlots={getAvailableSlots}
            initialDate={selectedDateFromPanorama}
            initialTurno={selectedTurnoFromPanorama}
            onDateTurnoSet={() => {
              setSelectedDateFromPanorama(null);
              setSelectedTurnoFromPanorama(null);
            }}
            onSaveBlockedTables={onSaveBlockedTables}
            onLoadBlockedTables={onLoadBlockedTables}
          />
        )}

        {adminView === 'panorama' && (
          <PanoramaView 
            reservations={data.reservas}
            formatDate={formatDate}
            onGoToDailyView={(date, turno) => {
              setSelectedDateFromPanorama(date);
              setSelectedTurnoFromPanorama(turno);
              setAdminView('daily');
            }}
          />
        )}

        {adminView === 'clients' && (
          <ClientsView 
            clients={data.clientes || []}
            reservations={data.reservas || []}
            onSetBlacklist={onSetBlacklist}
            onUpdateClientNotes={onUpdateClientNotes}
            showNotification={showNotification}
            showConfirmation={showConfirmationDialog}
          />
        )}

        {adminView === 'waitinglist' && (
          <WaitingListView 
            waitingList={data.waitingList || []}
            reservations={data.reservas || []}
            clients={data.clientes || []}
            onConfirmWaitingReservation={onConfirmWaitingReservation}
            onDeleteWaitingReservation={onDeleteWaitingReservation}
            onContactWaitingClient={onContactWaitingClient}
            onRejectWaitingReservation={onRejectWaitingReservation}
            getAvailableSlots={getAvailableSlots}
            formatDate={formatDate}
            HORARIOS={HORARIOS}
            showNotification={showNotification}
            showConfirmation={showConfirmationDialog}
          />
        )}
      </div>
    </div>
  );
}; 

// Componente Modal de Preview del Turno
const TurnoPreviewModal = ({ preview, onClose, onGoToDailyView }) => {
  // Layout de mesas - con tamaños estandarizados (idéntico a TodayView)
  const TABLES_LAYOUT = [
    { id: 12, x: 50, y: 30, width: 70, height: 40, capacity: 4 }, // rectangular horizontal (tamaño estándar)
    { id: 13, x: 140, y: 30, width: 70, height: 40, capacity: 4 }, // rectangular horizontal (tamaño estándar)
    { id: 21, x: 50, y: 85, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (tamaño estándar)
    { id: 11, x: 50, y: 135, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (tamaño estándar)
    { id: 24, x: 140, y: 85, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (tamaño estándar)
    { id: 14, x: 190, y: 85, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (tamaño estándar)
    { id: 10, x: 50, y: 190, width: 70, height: 35, capacity: 4 }, // rectangular horizontal (igual que 12 y 13)
    { id: 9, x: 50, y: 235, width: 70, height: 35, capacity: 4 }, // rectangular horizontal (igual que 12 y 13)
    { id: 8, x: 50, y: 280, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (igual que 2)
    { id: 6, x: 140, y: 180, width: 35, height: 60, capacity: 4 }, // rectangular vertical (área igual que 12 y 13)
    { id: 7, x: 140, y: 250, width: 50, height: 70, capacity: 6 }, // rectangular vertical más grande (sin cambios)
    { id: 5, x: 220, y: 155, width: 35, height: 60, capacity: 4 }, // rectangular vertical (área igual que 12 y 13)
    { id: 4, x: 220, y: 225, width: 35, height: 60, capacity: 4 }, // rectangular vertical (área igual que 12 y 13)
    { id: 3, x: 220, y: 295, width: 35, height: 60, capacity: 4 }, // rectangular vertical (área igual que 12 y 13)
    { id: 2, x: 220, y: 365, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (sin cambios)
    { id: 1, x: 135, y: 365, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (igual que 2) - reposicionada
    { id: 31, x: 180, y: 365, width: 40, height: 40, capacity: 2 }, // cuadrada pequeña (igual que 2) - reposicionada
  ];
  
  // Configuración de bloqueos por defecto para walk-ins (12 cupos)
  const DEFAULT_BLOCKED_TABLES = {
    2: [1, 31],  // 2 mesas de 2 personas = 4 cupos
    4: [4, 5],   // 2 mesas de 4 personas = 8 cupos
    // Total: 12 cupos para walk-ins
  };

  // Orden de reserva de mesas - Actualizado
  const RESERVATION_ORDER = {
    2: [2, 8, 11, 21, 1, 31], // Mesas para 2 personas - Orden completo actualizado
    4: [9, 10, 6, 12, 13, 3],  // Mesas para 4 personas - Orden actualizado  
    6: [7]            // Mesa para 6 personas
  };

  // Estado para mesas bloqueadas (Set)
  const [blockedTables, setBlockedTables] = useState(() => {
    const s = new Set();
    Object.values(DEFAULT_BLOCKED_TABLES).flat().forEach((id) => s.add(id));
    return s;
  });

  // Calcular asignaciones + bloqueos derivados usando la función pura
  const { assignments, blockedTables: calcBlocked } = useMemo(
    () => calculateAutoAssignments(preview.reservas, blockedTables),
    [preview.reservas, blockedTables]
  );

  useEffect(() => {
    if (!setsAreEqual(blockedTables, calcBlocked)) {
      setBlockedTables(calcBlocked);
    }
  }, [calcBlocked]);

  const tableAssignments = assignments;

  // Función para determinar si una mesa está ocupada
  const isMesaOcupada = (mesaId) => {
    return Object.values(tableAssignments).includes(mesaId);
  };
  
  // Función para determinar si una mesa está bloqueada
  const isMesaBloqueada = (mesaId) => {
    return blockedTables.has(mesaId);
  };
  
  // Función para obtener el estado de una mesa
  const getMesaStatus = (mesaId) => {
    if (isMesaOcupada(mesaId)) return 'occupied';
    if (isMesaBloqueada(mesaId)) return 'blocked';
    return 'available';
  };

  const handleGoToDaily = () => {
    onGoToDailyView(preview.date, preview.turno);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Preview - {preview.dateLabel}
            </h3>
            <p className="text-sm text-gray-600">
              {preview.turno === 'mediodia' ? '☀️ Mediodía' : '🌙 Noche'} • {preview.reservas.length} reservas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToDaily}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Calendar size={16} />
              Ir a Gestión Diaria
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mapa de Mesas */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Disposición de Mesas</h4>
              <div className="bg-white rounded-lg p-4 border">
                <svg 
                  viewBox="0 0 350 550" 
                  className="w-full h-auto"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Fondo del restaurante */}
                  <rect x="0" y="0" width="350" height="550" fill="#fafafa" stroke="#e5e7eb" strokeWidth="2" />
                  
                  {/* Líneas divisorias */}
                  <line x1="190" y1="142" x2="260" y2="142" stroke="#374151" strokeWidth="2" />
                  
                  {/* Mesas */}
                  {TABLES_LAYOUT.map((mesa) => {
                    const status = getMesaStatus(mesa.id);
                    const isOcupada = status === 'occupied';
                    const isBloqueada = status === 'blocked';
                    
                    // Colores según estado
                    const getStrokeColor = () => {
                      if (isOcupada) return "#dc2626"; // Rojo para ocupadas
                      if (isBloqueada) return "#f59e0b"; // Naranja para bloqueadas
                      return "#0c4900"; // Verde para libres
                    };
                    
                    return (
                      <g key={mesa.id}>
                        <rect
                          x={mesa.x}
                          y={mesa.y}
                          width={mesa.width}
                          height={mesa.height}
                          fill="#ffffff"
                          stroke={getStrokeColor()}
                          strokeWidth="2"
                          rx="4"
                        />
                        <text
                          x={mesa.x + mesa.width / 2}
                          y={mesa.y + mesa.height / 2 + ((isOcupada || isBloqueada) ? -5 : 6)}
                          textAnchor="middle"
                          fill="#0c4900"
                          fontSize="14"
                          fontWeight="bold"
                        >
                          {mesa.id}
                        </text>
                        {/* Círculo para mesas ocupadas */}
                        {isOcupada && (
                          <circle
                            cx={mesa.x + mesa.width / 2}
                            cy={mesa.y + mesa.height / 2 + 10}
                            r="6"
                            fill="#dc2626"
                          />
                        )}
                        {/* Círculo para mesas bloqueadas */}
                        {isBloqueada && (
                          <circle
                            cx={mesa.x + mesa.width / 2}
                            cy={mesa.y + mesa.height / 2 + 10}
                            r="4"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                          />
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Leyenda */}
                  <g>
                    <rect x="20" y="520" width="15" height="12" fill="#ffffff" stroke="#0c4900" strokeWidth="1" rx="1" />
                    <text x="40" y="528" fontSize="9" fill="#6b7280">Libre</text>
                    <rect x="80" y="520" width="15" height="12" fill="#ffffff" stroke="#dc2626" strokeWidth="1" rx="1" />
                    <circle cx="87.5" cy="526" r="3" fill="#dc2626" />
                    <text x="100" y="528" fontSize="9" fill="#6b7280">Reservada</text>
                    <rect x="160" y="520" width="15" height="12" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" rx="1" />
                    <circle cx="167.5" cy="526" r="2" fill="none" stroke="#f59e0b" strokeWidth="1" />
                    <text x="180" y="528" fontSize="9" fill="#6b7280">Walk-in</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Lista de Reservas */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Reservas del Turno ({preview.reservas.length})
              </h4>
              
              {preview.reservas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No hay reservas para este turno</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {preview.reservas
                    .sort((a, b) => a.horario.localeCompare(b.horario))
                    .map((reserva, index) => (
                    <div key={reserva.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                              {reserva.horario}
                            </span>
                            {(reserva.mesaAsignada || tableAssignments[reserva.id]) && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                Mesa {reserva.mesaAsignada || tableAssignments[reserva.id]}
                              </span>
                            )}
                          </div>
                          <div className="font-medium text-gray-900">
                            {reserva.cliente?.nombre || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <Users size={14} />
                              {reserva.personas} personas
                            </span>
                            {reserva.cliente?.telefono && (
                              <span className="ml-3 inline-flex items-center gap-1">
                                <Phone size={14} />
                                {reserva.cliente.telefono}
                              </span>
                            )}
                          </div>
                          {reserva.comentarios && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              "{reserva.comentarios}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer con resumen */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{preview.reservas.length}</div>
                <div className="text-sm text-gray-600">Reservas</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">
                  {preview.reservas.reduce((sum, r) => sum + r.personas, 0)}
                </div>
                <div className="text-sm text-gray-600">Personas</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.keys(tableAssignments).length}
                </div>
                <div className="text-sm text-gray-600">Mesas Ocupadas</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-600">
                  {blockedTables.size}
                </div>
                <div className="text-sm text-gray-600">Mesas Walk-in</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((preview.reservas.reduce((sum, r) => sum + r.personas, 0) / 36) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Ocupación</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 