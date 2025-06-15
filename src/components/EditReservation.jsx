import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './EditReservation.module.css';

const HORARIOS = {
  mediodia: ['12:00', '12:30', '13:00', '13:30', '14:00'],
  noche: ['20:00', '20:15', '20:30', '20:45', '21:00', '21:15']
};

const MAX_PERSONAS_POR_TURNO = 24;

const EditReservation = ({ reservation, onClose, formatDate, onSave, isAdmin = false }) => {
  const [editedReservation, setEditedReservation] = useState({
    ...reservation,
    fecha: new Date(reservation.fecha)
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTurno, setSelectedTurno] = useState(
    reservation.horario < '15:00' ? 'mediodia' : 'noche'
  );

  // Función para obtener las reservas existentes para una fecha
  const getExistingReservations = async (fecha) => {
    try {
      const querySnapshot = await getDocs(collection(db, "reservas"));
      return querySnapshot.docs
        .map(doc => doc.data())
        .filter(res => res.fecha === fecha && res.reservationId !== reservation.reservationId);
    } catch (error) {
      console.error("Error al obtener reservas:", error);
      return [];
    }
  };

  // Función para calcular slots disponibles
  const calculateAvailableSlots = async (fecha, turno) => {
    const existingReservations = await getExistingReservations(
      fecha.toISOString().split('T')[0]
    );

    const slots = {};
    HORARIOS[turno].forEach(horario => {
      const reservasEnHorario = existingReservations.filter(r => r.horario === horario);
      const personasReservadas = reservasEnHorario.reduce((sum, r) => sum + r.personas, 0);
      slots[horario] = MAX_PERSONAS_POR_TURNO - personasReservadas;
    });

    return slots;
  };

  // Efecto para actualizar slots disponibles cuando cambia la fecha o turno
  useEffect(() => {
    const updateSlots = async () => {
      const slots = await calculateAvailableSlots(editedReservation.fecha, selectedTurno);
      setAvailableSlots(slots);
    };
    updateSlots();
  }, [editedReservation.fecha, selectedTurno]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Solo validar cupo disponible si no es administrador
    if (!isAdmin) {
      const slots = await calculateAvailableSlots(editedReservation.fecha, selectedTurno);
      const cupoDisponible = slots[editedReservation.horario] >= editedReservation.personas;

      if (!cupoDisponible) {
        alert('Lo sentimos, no hay cupo disponible para el horario seleccionado.');
        return;
      }
    }

    await onSave(editedReservation);
    onClose();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Modificar Reserva</h2>
        <button
          onClick={onClose}
          className={styles.closeButton}
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <p className={styles.infoText}>Código de Reserva</p>
          <p className={styles.codeDisplay}>{editedReservation.reservationId}</p>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Fecha</label>
          <DatePicker
            selected={editedReservation.fecha}
            onChange={(date) => setEditedReservation({ ...editedReservation, fecha: date })}
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
            maxDate={new Date().setMonth(new Date().getMonth() + 1)}
            filterDate={(date) => date.getDay() !== 1} // Excluir lunes (cerrado ambos turnos)
            className={styles.input}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Turno</label>
          <select
            value={selectedTurno}
            onChange={(e) => {
              const newTurno = e.target.value;
              setSelectedTurno(newTurno);
              setEditedReservation({
                ...editedReservation,
                turno: newTurno,
                horario: HORARIOS[newTurno][0]
              });
            }}
            className={styles.select}
          >
            <option value="mediodia">Mediodía</option>
            <option 
              value="noche" 
              disabled={editedReservation.fecha && editedReservation.fecha.getDay() === 0}
            >
              Noche {editedReservation.fecha && editedReservation.fecha.getDay() === 0 ? '(Cerrado domingos)' : ''}
            </option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Horario</label>
          <select
            value={editedReservation.horario}
            onChange={(e) => setEditedReservation({ ...editedReservation, horario: e.target.value })}
            className={styles.select}
          >
            {HORARIOS[selectedTurno].map(horario => (
              <option 
                key={horario} 
                value={horario}
                disabled={!isAdmin && availableSlots[horario] < editedReservation.personas}
              >
                {horario} {!isAdmin && availableSlots[horario] < editedReservation.personas ? '(Sin cupo)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Personas</label>
          <select
            value={editedReservation.personas}
            onChange={(e) => setEditedReservation({ ...editedReservation, personas: parseInt(e.target.value) })}
            className={styles.select}
          >
            {[...Array(6)].map((_, i) => (
              <option 
                key={i + 1} 
                value={i + 1}
                disabled={!isAdmin && availableSlots[editedReservation.horario] < (i + 1)}
              >
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Nombre</label>
          <input
            type="text"
            value={editedReservation.cliente.nombre}
            onChange={(e) => setEditedReservation({
              ...editedReservation,
              cliente: { ...editedReservation.cliente, nombre: e.target.value }
            })}
            className={styles.input}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Comentarios</label>
          <textarea
            value={editedReservation.cliente.comentarios || ''}
            onChange={(e) => setEditedReservation({
              ...editedReservation,
              cliente: { ...editedReservation.cliente, comentarios: e.target.value }
            })}
            className={styles.textarea}
          />
        </div>

        <button
          type="submit"
          className={styles.submitButton}
        >
          <Save size={20} />
          Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default EditReservation; 