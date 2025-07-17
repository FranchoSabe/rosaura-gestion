import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Calendar, Clock, Users, MessageSquare, AlertCircle, Sun, Moon } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import "../../../../datepicker-custom.css";
import { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import { PhoneInput } from '../../ui/Input';
import { sanitizeData } from '../../../../utils/validation';
import { formatDateToString } from '../../../../utils';
import styles from './index.module.css';

// Registrar locale español para el DatePicker
registerLocale('es', es);

const CreateReservationModal = ({ onClose, onSave, getAvailableSlots, isValidDate, HORARIOS, showNotification, isAdmin = false }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newReservation, setNewReservation] = useState({
    fecha: new Date(),
    turno: 'mediodia',
    horario: '12:00',
    personas: 2,
    cliente: {
      nombre: '',
      telefono: '', // Ahora maneja el número completo con código de país
      comentarios: ''
    }
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const updateSlots = async () => {
      const rawSlots = await getAvailableSlots(
        formatDateToString(newReservation.fecha),
        newReservation.turno
      );

      // Adaptar: si la función devuelve array de strings, transformamos
      const normalized = Array.isArray(rawSlots) && typeof rawSlots[0] === 'string' 
        ? HORARIOS[newReservation.turno].map(hor => ({
            horario: hor,
            cuposDisponibles: rawSlots.includes(hor) ? 6 : 0 // asumimos máx 6
          }))
        : rawSlots;

      setAvailableSlots(normalized);
    };
    updateSlots();
  }, [newReservation.fecha, newReservation.turno, getAvailableSlots]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevenir envíos duplicados
    if (isSaving) return;
    setIsSaving(true);

    // Validaciones
    if (!newReservation.cliente.nombre.trim()) {
      showNotification?.('error', 'El nombre es obligatorio');
      setIsSaving(false);
      return;
    }

    if (!newReservation.cliente.telefono.trim()) {
      showNotification?.('error', 'El teléfono es obligatorio');
      setIsSaving(false);
      return;
    }

    // Validación de teléfono más permisiva para admins
    if (isAdmin) {
      // Para admins: solo verificar que tenga al menos algunos números
      const hasNumbers = /\d{3,}/.test(newReservation.cliente.telefono);
      if (!hasNumbers) {
        showNotification?.('warning', 'El teléfono debe contener al menos algunos números');
        // Pero no bloquear la creación, solo advertir
      }
    } else {
      // Para clientes: validación estricta usando el número completo
      if (!isValidPhoneNumber(newReservation.cliente.telefono)) {
        showNotification?.('error', 'Formato de teléfono inválido');
        setIsSaving(false);
        return;
      }
    }

    // Verificar disponibilidad del horario seleccionado (saltear para admin)
    if (!isAdmin) {
      const slotsDisponibles = await getAvailableSlots(
        formatDateToString(newReservation.fecha),
        newReservation.turno
      );
      
      const horarioDisponible = slotsDisponibles.find(slot => 
        slot.horario === newReservation.horario && 
        slot.cuposDisponibles >= newReservation.personas
      );

      if (!horarioDisponible) {
        showNotification?.('error', 'El horario seleccionado no tiene cupos suficientes');
        setIsSaving(false);
        return;
      }
    }

    try {
      // Preparar datos con el formato correcto de teléfono
      const phoneNumber = parsePhoneNumber(newReservation.cliente.telefono);
      
      // Limpiar objeto cliente para eliminar campos undefined (Firebase no los acepta)
      const cleanCliente = {};
      cleanCliente.nombre = newReservation.cliente.nombre.trim();
      cleanCliente.telefono = phoneNumber ? phoneNumber.number.slice(1) : newReservation.cliente.telefono;
      
      // Solo agregar comentarios si existe y no está vacío
      if (newReservation.cliente.comentarios && newReservation.cliente.comentarios.trim()) {
        cleanCliente.comentarios = newReservation.cliente.comentarios.trim();
      }
      
      const reservationData = {
        ...newReservation,
        fecha: formatDateToString(newReservation.fecha),
        cliente: cleanCliente
      };

      // Sanitizar el objeto completo
      const sanitizedData = sanitizeData(reservationData);

      if (process.env.NODE_ENV === 'development') {
        console.log('Creating reservation data:', sanitizedData);
      }

      if (typeof onSave === 'function') {
        await onSave(sanitizedData);
        showNotification?.('success', 'Reserva creada exitosamente');
        onClose();
      } else {
        showNotification?.('error', 'Función de guardado no disponible');
        console.error('onSave prop is not a function:', onSave);
      }
    } catch (error) {
      showNotification?.('error', 'Error al crear la reserva');
      console.error('Error creating reservation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Calendar size={20} />
            Nueva Reserva {isAdmin && <span style={{color: '#f59e0b'}}>(Modo Admin)</span>}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Indicador de modo admin */}
          {isAdmin && (
            <div className={styles.adminNotice}>
              <strong>Modo Administrador:</strong> Puedes crear reservas sin restricciones de fecha o cupos.
            </div>
          )}

          {/* Fecha y Turno */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Calendar size={16} />
                Fecha
              </label>
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className={isAdmin ? "admin-professional-input" : styles.input}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: '0.75rem'
                }}
              >
                <span>
                  {newReservation.fecha.toLocaleDateString('es-AR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
                <Calendar size={16} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Clock size={16} />
                Turno
              </label>
              <div className={styles.turnoSelector}>
                <button
                  type="button"
                  onClick={() => {
                    setNewReservation({
                      ...newReservation,
                      turno: 'mediodia',
                      horario: HORARIOS['mediodia'][0]
                    });
                  }}
                  className={`${styles.turnoOption} ${newReservation.turno === 'mediodia' ? styles.turnoOptionSelected : styles.turnoOptionUnselected}`}
                >
                  <Sun size={16} />
                  Mediodía
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isAdmin || !newReservation.fecha || newReservation.fecha.getDay() !== 0) {
                      setNewReservation({
                        ...newReservation,
                        turno: 'noche',
                        horario: HORARIOS['noche'][0]
                      });
                    }
                  }}
                  disabled={!isAdmin && newReservation.fecha && newReservation.fecha.getDay() === 0}
                  className={`${styles.turnoOption} ${newReservation.turno === 'noche' ? styles.turnoOptionSelected : styles.turnoOptionUnselected}`}
                  title={!isAdmin && newReservation.fecha && newReservation.fecha.getDay() === 0 ? 'Cerrado domingos' : ''}
                >
                  <Moon size={16} />
                  Noche {!isAdmin && newReservation.fecha && newReservation.fecha.getDay() === 0 ? '(Cerrado domingos)' : ''}
                </button>
              </div>
            </div>
          </div>

          {/* Horario y Personas */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Clock size={16} />
                Horario
              </label>
              <select
                value={newReservation.horario}
                onChange={(e) => setNewReservation({ ...newReservation, horario: e.target.value })}
                className={styles.select}
              >
                {HORARIOS[newReservation.turno].map(horario => {
                  const slot = availableSlots.find(s => s.horario === horario);
                  const cuposDisponibles = slot ? slot.cuposDisponibles : 0;
                  const suficienteCupo = cuposDisponibles >= newReservation.personas;
                  
                  return (
                    <option 
                      key={horario} 
                      value={horario}
                      disabled={!isAdmin && !suficienteCupo}
                    >
                      {horario} {isAdmin 
                        ? `(Admin: sin restricciones)` 
                        : !suficienteCupo 
                          ? `(${cuposDisponibles} cupos)` 
                          : `(${cuposDisponibles} disponibles)`
                      }
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Users size={16} />
                Personas
              </label>
              <select
                value={newReservation.personas}
                onChange={(e) => setNewReservation({ ...newReservation, personas: parseInt(e.target.value) })}
                className={styles.select}
              >
                {[...Array(isAdmin ? 12 : 6)].map((_, i) => {
                  const personas = i + 1;
                  const slot = availableSlots.find(s => s.horario === newReservation.horario);
                  const cuposDisponibles = slot ? slot.cuposDisponibles : 0;
                  const disponible = cuposDisponibles >= personas;
                  
                  return (
                    <option 
                      key={personas} 
                      value={personas}
                      disabled={!isAdmin && !disponible}
                    >
                      {personas} persona{personas > 1 ? 's' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Nombre y Teléfono */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nombre completo *
              </label>
              <input
                type="text"
                value={newReservation.cliente.nombre}
                onChange={(e) => setNewReservation({
                  ...newReservation,
                  cliente: { ...newReservation.cliente, nombre: e.target.value }
                })}
                className={styles.input}
                placeholder="Ingresá el nombre completo"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Teléfono *
              </label>
              <PhoneInput
                value={newReservation.cliente.telefono}
                onChange={(value) => setNewReservation({
                  ...newReservation,
                  cliente: { ...newReservation.cliente, telefono: value || '' }
                })}
                className={styles.phoneInput}
                placeholder="Ingresa el número"
                required
                isValid={
                  newReservation.cliente.telefono ? 
                    (isAdmin ? 
                      // Para admins: solo verificar que tenga números
                      (/\d{3,}/.test(newReservation.cliente.telefono) ? true : false) :
                      // Para clientes: validación estricta
                      (isValidPhoneNumber(newReservation.cliente.telefono) ? true : false)
                    )
                    : null
                }
              />
            </div>
          </div>

          {/* Comentarios */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <MessageSquare size={16} />
              Comentarios (opcional)
            </label>
            <textarea
              value={newReservation.cliente.comentarios}
              onChange={(e) => setNewReservation({
                ...newReservation,
                cliente: { ...newReservation.cliente, comentarios: e.target.value }
              })}
              className={styles.textarea}
              placeholder="Alergias, preferencias, ocasión especial..."
            />
          </div>

          {/* Botones */}
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
              className={`${styles.button} ${styles.buttonPrimary} ${isSaving ? styles.buttonDisabled : ''}`}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className={styles.loadingSpinner} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Crear Reserva
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Popup del DatePicker centrado */}
      {showDatePicker && (
        <div 
          className={styles.datePickerOverlay}
          onClick={() => setShowDatePicker(false)}
        >
          <div 
            className={styles.datePickerPopup}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.datePickerHeader}>
              <h3>Seleccionar fecha</h3>
              <button 
                type="button"
                onClick={() => setShowDatePicker(false)}
                className={styles.datePickerCloseButton}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.datePickerContent}>
              <DatePicker
                selected={newReservation.fecha}
                onChange={(date) => {
                  setNewReservation({ ...newReservation, fecha: date });
                  setShowDatePicker(false);
                }}
                dateFormat="dd/MM/yyyy"
                locale="es"
                minDate={isAdmin ? null : new Date()}
                maxDate={isAdmin ? null : (() => {
                  const maxDate = new Date();
                  maxDate.setMonth(maxDate.getMonth() + 1);
                  return maxDate;
                })()}
                filterDate={isAdmin ? undefined : isValidDate}
                inline
                calendarClassName={isAdmin ? "admin-professional-calendar" : "custom-green-calendar"}
              />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default CreateReservationModal;