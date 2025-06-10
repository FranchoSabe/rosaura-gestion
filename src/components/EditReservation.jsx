import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const HORARIOS = {
  mediodia: ['12:00', '12:30', '13:00', '13:30', '14:00'],
  noche: ['20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30']
};

const MAX_PERSONAS_POR_TURNO = 24;

const EditReservation = ({ reservation, onClose, formatDate, onSave }) => {
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

    // Validar que el horario tenga cupo disponible
    const slots = await calculateAvailableSlots(editedReservation.fecha, selectedTurno);
    const cupoDisponible = slots[editedReservation.horario] >= editedReservation.personas;

    if (!cupoDisponible) {
      alert('Lo sentimos, no hay cupo disponible para el horario seleccionado.');
      return;
    }

    await onSave(editedReservation);
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-white">Modificar Reserva</h2>
        <button
          onClick={onClose}
          className="text-white opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-white opacity-70 mb-1">Código de Reserva</p>
          <p className="font-medium text-white">{editedReservation.reservationId}</p>
        </div>

        <div>
          <label className="text-sm text-white opacity-70 block mb-1">Fecha</label>
          <DatePicker
            selected={editedReservation.fecha}
            onChange={(date) => setEditedReservation({ ...editedReservation, fecha: date })}
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
            maxDate={new Date().setMonth(new Date().getMonth() + 1)}
            className="w-full bg-black bg-opacity-40 text-white p-2 rounded-lg border border-white border-opacity-20"
          />
        </div>

        <div>
          <label className="text-sm text-white opacity-70 block mb-1">Turno</label>
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
            className="w-full bg-black bg-opacity-40 text-white p-2 rounded-lg border border-white border-opacity-20"
          >
            <option value="mediodia">Mediodía</option>
            <option value="noche">Noche</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-white opacity-70 block mb-1">Horario</label>
          <select
            value={editedReservation.horario}
            onChange={(e) => setEditedReservation({ ...editedReservation, horario: e.target.value })}
            className="w-full bg-black bg-opacity-40 text-white p-2 rounded-lg border border-white border-opacity-20"
          >
            {HORARIOS[selectedTurno].map(horario => (
              <option 
                key={horario} 
                value={horario}
                disabled={availableSlots[horario] < editedReservation.personas}
              >
                {horario} {availableSlots[horario] < editedReservation.personas ? '(Sin cupo)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-white opacity-70 block mb-1">Personas</label>
          <select
            value={editedReservation.personas}
            onChange={(e) => setEditedReservation({ ...editedReservation, personas: parseInt(e.target.value) })}
            className="w-full bg-black bg-opacity-40 text-white p-2 rounded-lg border border-white border-opacity-20"
          >
            {[...Array(6)].map((_, i) => (
              <option 
                key={i + 1} 
                value={i + 1}
                disabled={availableSlots[editedReservation.horario] < (i + 1)}
              >
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-white opacity-70 block mb-1">Nombre</label>
          <input
            type="text"
            value={editedReservation.cliente.nombre}
            onChange={(e) => setEditedReservation({
              ...editedReservation,
              cliente: { ...editedReservation.cliente, nombre: e.target.value }
            })}
            className="w-full bg-black bg-opacity-40 text-white p-2 rounded-lg border border-white border-opacity-20"
          />
        </div>

        <div>
          <label className="text-sm text-white opacity-70 block mb-1">Comentarios</label>
          <textarea
            value={editedReservation.cliente.comentarios || ''}
            onChange={(e) => setEditedReservation({
              ...editedReservation,
              cliente: { ...editedReservation.cliente, comentarios: e.target.value }
            })}
            className="w-full bg-black bg-opacity-40 text-white p-2 rounded-lg border border-white border-opacity-20 h-24 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-green-600 bg-opacity-20 text-white py-3 px-4 rounded-xl hover:bg-opacity-30 transition-all duration-200"
        >
          <Save size={20} />
          Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default EditReservation; 