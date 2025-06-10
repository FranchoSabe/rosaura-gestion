import React from 'react';
import { X, Edit2, MessageCircle, Trash2 } from 'lucide-react';

const ReservationDetails = ({ reservation, onClose, formatDate, onEdit, onCancel, onContact }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-white">Detalles de la Reserva</h2>
        <button
          onClick={onClose}
          className="text-white opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-white opacity-70">Código de Reserva</p>
          <p className="font-medium text-white">{reservation.reservationId}</p>
        </div>
        <div>
          <p className="text-sm text-white opacity-70">Fecha</p>
          <p className="font-medium text-white">{formatDate(reservation.fecha)}</p>
        </div>
        <div>
          <p className="text-sm text-white opacity-70">Horario</p>
          <p className="font-medium text-white">{reservation.horario}</p>
        </div>
        <div>
          <p className="text-sm text-white opacity-70">Personas</p>
          <p className="font-medium text-white">{reservation.personas}</p>
        </div>
        <div>
          <p className="text-sm text-white opacity-70">Nombre</p>
          <p className="font-medium text-white">{reservation.cliente.nombre}</p>
        </div>
        {reservation.cliente.comentarios && (
          <div>
            <p className="text-sm text-white opacity-70">Comentarios</p>
            <p className="font-medium text-white">{reservation.cliente.comentarios}</p>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4">
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 bg-black bg-opacity-40 text-white py-3 px-4 rounded-xl hover:bg-opacity-60 transition-all duration-200"
          >
            <Edit2 className="text-yellow-400" size={20} />
            Modificar Reserva
          </button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-2 bg-black bg-opacity-40 text-white py-3 px-4 rounded-xl hover:bg-opacity-60 transition-all duration-200"
          >
            <Trash2 className="text-red-500" size={20} />
            Cancelar Reserva
          </button>
        )}

        {onContact && (
          <button
            onClick={onContact}
            className="w-full flex items-center justify-center gap-2 bg-black bg-opacity-40 text-white py-3 px-4 rounded-xl hover:bg-opacity-60 transition-all duration-200"
          >
            <MessageCircle className="text-green-500" size={20} />
            Envianos un WhatsApp
          </button>
        )}
      </div>
    </div>
  );
};

export default ReservationDetails; 