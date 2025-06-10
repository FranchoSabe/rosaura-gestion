import React, { useState } from 'react';
import { ChevronDown, ThumbsDown, MessageCircle, Edit2 } from 'lucide-react';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Se asume que ReservationsTable se pasa como prop o se importa
const FutureReservations = ({ reservations, ReservationsTable, onSetBlacklist, onUpdateReservation, onDeleteReservation, getAvailableSlotsForEdit, isValidDate, HORARIOS }) => {
    const [expandedDay, setExpandedDay] = useState(null);

    // Obtener las fechas de las reservas futuras (a partir de la próxima semana)
    const getFutureReservationDates = () => {
        const today = new Date();
        const startOfNextWeek = new Date(today);
        startOfNextWeek.setDate(today.getDate() - today.getDay() + 8); // Lunes de la próxima semana
        startOfNextWeek.setHours(0, 0, 0, 0);

        const futureDates = reservations
            .filter(r => new Date(r.fecha) >= startOfNextWeek)
            .map(r => r.fecha);
        
        // Devolver fechas únicas y ordenadas
        return [...new Set(futureDates)].sort((a, b) => new Date(a) - new Date(b));
    };

    const getReservationsForDay = (date) => {
        return reservations.filter(r => r.fecha === date);
    };

    const futureDates = getFutureReservationDates();

    return (
        <div className="space-y-4">
            {futureDates.length > 0 ? futureDates.map(date => {
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
                                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
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
                                />
                            </div>
                        )}
                    </div>
                );
            }) : (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                    No hay reservas programadas para fechas futuras (después de esta semana).
                </div>
            )}
        </div>
    );
};

export default FutureReservations; 