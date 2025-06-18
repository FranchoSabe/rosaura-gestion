import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, Users, MessageSquare } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import "../../datepicker-custom.css";
import { isValidPhoneNumber } from 'react-phone-number-input';
import { sanitizeData } from '../../utils/validation';
import styles from './CreateReservationModal.module.css';

// Registrar locale español para el DatePicker
registerLocale('es', es);

const CreateReservationModal = ({ onClose, onSave, getAvailableSlots, isValidDate, HORARIOS, showNotification }) => {
  const [newReservation, setNewReservation] = useState({
    fecha: new Date(),
    turno: 'mediodia',
    horario: '12:00',
    personas: 2,
    cliente: {
      nombre: '',
      telefono: '',
      comentarios: ''
    }
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const updateSlots = async () => {
      const rawSlots = await getAvailableSlots(
        newReservation.fecha.toISOString().split('T')[0],
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
      showNotification('error', 'El nombre es obligatorio');
      setIsSaving(false);
      return;
    }

    if (!newReservation.cliente.telefono.trim()) {
      showNotification('error', 'El teléfono es obligatorio');
      setIsSaving(false);
      return;
    }

    if (!isValidPhoneNumber(newReservation.cliente.telefono, 'AR')) {
      showNotification('error', 'Formato de teléfono inválido');
      setIsSaving(false);
      return;
    }

    // Verificar disponibilidad del horario seleccionado
    const slotsDisponibles = await getAvailableSlots(
      newReservation.fecha.toISOString().split('T')[0],
      newReservation.turno
    );
    
    const horarioDisponible = slotsDisponibles.find(slot => 
      slot.horario === newReservation.horario && 
      slot.cuposDisponibles >= newReservation.personas
    );

    if (!horarioDisponible) {
      showNotification('error', 'El horario seleccionado no tiene cupos suficientes');
      setIsSaving(false);
      return;
    }

    try {
      // Sanitizar datos antes de enviar
      const reservationData = {
        ...newReservation,
        fecha: newReservation.fecha.toISOString().split('T')[0],
        cliente: {
          nombre: sanitizeData(newReservation.cliente.nombre),
          telefono: sanitizeData(newReservation.cliente.telefono),
          comentarios: sanitizeData(newReservation.cliente.comentarios || '')
        }
      };

      await onSave(reservationData);
      showNotification('success', 'Reserva creada exitosamente');
      onClose();
    } catch (error) {
      showNotification('error', 'Error al crear la reserva');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Calendar size={24} />
            Nueva Reserva
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Fecha */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Calendar size={16} />
              Fecha
            </label>
            <DatePicker
              selected={newReservation.fecha}
              onChange={(date) => setNewReservation({ ...newReservation, fecha: date })}
              dateFormat="dd/MM/yyyy"
              locale="es"
              minDate={new Date()}
              maxDate={(() => {
                const maxDate = new Date();
                maxDate.setMonth(maxDate.getMonth() + 1);
                return maxDate;
              })()}
              filterDate={isValidDate}
              className={styles.input}
              placeholderText="Seleccionar fecha"
            />
          </div>

          {/* Turno */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Clock size={16} />
              Turno
            </label>
            <select
              value={newReservation.turno}
              onChange={(e) => {
                const newTurno = e.target.value;
                setNewReservation({
                  ...newReservation,
                  turno: newTurno,
                  horario: HORARIOS[newTurno][0]
                });
              }}
              className={styles.select}
            >
              <option value="mediodia">Mediodía</option>
              <option 
                value="noche"
                disabled={newReservation.fecha && newReservation.fecha.getDay() === 0}
              >
                Noche {newReservation.fecha && newReservation.fecha.getDay() === 0 ? '(Cerrado domingos)' : ''}
              </option>
            </select>
          </div>

          {/* Horario */}
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
                    disabled={!suficienteCupo}
                  >
                    {horario} {!suficienteCupo ? `(${cuposDisponibles} cupos)` : `(${cuposDisponibles} disponibles)`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Personas */}
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
              {[...Array(6)].map((_, i) => {
                const personas = i + 1;
                const slot = availableSlots.find(s => s.horario === newReservation.horario);
                const cuposDisponibles = slot ? slot.cuposDisponibles : 0;
                const disponible = cuposDisponibles >= personas;
                
                return (
                  <option 
                    key={personas} 
                    value={personas}
                    disabled={!disponible}
                  >
                    {personas} persona{personas > 1 ? 's' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Nombre */}
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

          {/* Teléfono */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Teléfono *
            </label>
            <input
              type="tel"
              value={newReservation.cliente.telefono}
              onChange={(e) => setNewReservation({
                ...newReservation,
                cliente: { ...newReservation.cliente, telefono: e.target.value }
              })}
              className={styles.input}
              placeholder="+54 9 11 1234-5678"
              required
            />
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
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              <Save size={16} />
              {isSaving ? 'Guardando…' : 'Crear Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReservationModal; 