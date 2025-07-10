import React, { useState, useEffect } from 'react';
import { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import { PhoneInput } from '../../ui/Input';
import { sanitizeData } from '../../../../utils/validation';
import styles from './index.module.css';

const EditReservationModal = ({ reservation, onClose, onSave, getAvailableSlotsForEdit, isValidDate, HORARIOS, showNotification, isAdmin = true }) => {
  // Función para formatear el teléfono existente a formato E.164
  const formatExistingPhone = (phone) => {
    if (!phone) return '';
    
    const phoneStr = phone.toString();
    
    // Si ya tiene el +, devolverlo tal como está
    if (phoneStr.startsWith('+')) {
      return phoneStr;
    }
    
    // Si no tiene +, agregarlo (asumiendo que ya tiene código de país)
    return `+${phoneStr}`;
  };

  const formattedPhone = formatExistingPhone(reservation.cliente?.telefono);
  
  const [editedReservation, setEditedReservation] = useState({
    cliente: { 
      ...reservation.cliente,
      telefono: formattedPhone, // Usar el número completo en formato E.164
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
    if (!isValidPhoneNumber(editedReservation.cliente.telefono)) {
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
      // Preparar los datos con el formato correcto de teléfono
      const phoneNumber = parsePhoneNumber(editedReservation.cliente.telefono);
      
      // Limpiar objeto cliente para eliminar campos undefined (Firebase no los acepta)
      const cleanCliente = {};
      Object.keys(editedReservation.cliente).forEach(key => {
        const value = editedReservation.cliente[key];
        if (value !== undefined && value !== null) {
          cleanCliente[key] = value;
        }
      });
      
      // Formatear teléfono
      if (phoneNumber) {
        cleanCliente.telefono = phoneNumber.number.slice(1);
      }
      
      const dataToSave = {
        ...editedReservation,
        cliente: cleanCliente
      };
      
      // Sanitizar después de formatear
      const sanitizedData = sanitizeData(dataToSave);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Saving reservation data:', sanitizedData);
      }
      
      await onSave(sanitizedData);
      showNotification?.('success', 'Reserva actualizada correctamente');
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      showNotification?.('error', 'Error al actualizar la reserva');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Editar Reserva</h3>
        {isAdmin && (
          <div className={styles.adminNotice}>
            <svg className={styles.adminNoticeIcon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className={styles.adminNoticeText}>
              <strong>Modo Administrador:</strong> Puedes modificar cualquier horario sin restricciones de cupo.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre</label>
              <input
                type="text"
                value={editedReservation.cliente.nombre}
                onChange={(e) => setEditedReservation({
                  ...editedReservation,
                  cliente: { ...editedReservation.cliente, nombre: e.target.value }
                })}
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Teléfono</label>
              <PhoneInput
                value={editedReservation.cliente.telefono}
                onChange={(value) => setEditedReservation({
                  ...editedReservation,
                  cliente: { ...editedReservation.cliente, telefono: value || '' }
                })}
                className={`${styles.input} ${styles.phoneInput}`}
                placeholder="Ingresa el número"
                required
                isValid={
                  editedReservation.cliente.telefono ? 
                    (isValidPhoneNumber(editedReservation.cliente.telefono) ? true : false) 
                    : null
                }
              />
            </div>
          </div>

          <div className={styles.formGridThree}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha</label>
              <input
                type="date"
                value={normalizeFecha(editedReservation.fecha)}
                onChange={(e) => setEditedReservation({
                  ...editedReservation,
                  fecha: e.target.value
                })}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Turno</label>
              <select
                value={editedReservation.turno}
                onChange={(e) => setEditedReservation({
                  ...editedReservation,
                  turno: e.target.value,
                  horario: ''
                })}
                className={styles.select}
                required
              >
                <option value="">Seleccionar turno</option>
                <option value="mediodia">🌞 Mediodía</option>
                <option value="noche">🌙 Noche</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Horario</label>
              <select
                value={editedReservation.horario}
                onChange={(e) => setEditedReservation({
                  ...editedReservation,
                  horario: e.target.value
                })}
                className={styles.select}
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Personas</label>
            <select
              value={editedReservation.personas}
              onChange={(e) => setEditedReservation({
                ...editedReservation,
                personas: parseInt(e.target.value)
              })}
              className={styles.select}
              required
            >
              <option value="">Seleccionar cantidad</option>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} persona{num !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Comentarios</label>
            <textarea
              value={editedReservation.cliente.comentarios || ''}
              onChange={(e) => setEditedReservation({
                ...editedReservation,
                cliente: { ...editedReservation.cliente, comentarios: e.target.value }
              })}
              className={styles.textarea}
              placeholder="Comentarios adicionales (opcional)"
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
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