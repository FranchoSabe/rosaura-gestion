import React, { useState, useEffect } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { sanitizeData } from '../../utils/validation';

const EditReservationModal = ({ reservation, onClose, onSave, getAvailableSlotsForEdit, isValidDate, HORARIOS, showNotification, isAdmin = true }) => {
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

    // Validar teléfono con react-phone-number-input
    if (!isValidPhoneNumber(`+${editedReservation.cliente.codigoPais || '54'}${editedReservation.cliente.telefono}`)) {
      showNotification('error', 'Por favor, ingresa un número de teléfono válido.');
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
      // Preparar y sanitizar los datos para guardar
      const dataToSave = sanitizeData({
        ...editedReservation,
        cliente: {
          ...editedReservation.cliente,
          codigoPais: editedReservation.cliente.codigoPais || '54'
        }
      });
      
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
        {isAdmin && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-800">
                <strong>Modo Administrador:</strong> Puedes modificar cualquier horario sin restricciones de cupo.
              </p>
            </div>
          </div>
        )}
        
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
              <div className="flex gap-2">
                <select
                  value={editedReservation.cliente.codigoPais || '54'}
                  onChange={(e) => setEditedReservation({
                    ...editedReservation,
                    cliente: { ...editedReservation.cliente, codigoPais: e.target.value }
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  style={{ minWidth: '120px' }}
                >
                  <option value="54">+54</option>
                  <option value="598">+598</option>
                  <option value="55">+55</option>
                  <option value="1">+1</option>
                </select>
                <input
                  type="tel"
                  value={editedReservation.cliente.telefono || ''}
                  onChange={(e) => setEditedReservation({
                    ...editedReservation,
                    cliente: { ...editedReservation.cliente, telefono: e.target.value }
                  })}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    editedReservation.cliente.telefono ? 
                      (isValidPhoneNumber(`+${editedReservation.cliente.codigoPais || '54'}${editedReservation.cliente.telefono}`) ? 'border-green-500' : 'border-red-500') 
                      : 'border-gray-300'
                  }`}
                  placeholder="Ingresa el número"
                />
              </div>
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

export default EditReservationModal; 