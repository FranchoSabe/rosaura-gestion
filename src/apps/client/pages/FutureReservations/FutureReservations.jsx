import React, { useState } from 'react';
import { ChevronDown, ThumbsDown, MessageCircle, Edit2 } from 'lucide-react';
import styles from './FutureReservations.module.css';

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
            .filter(r => new Date(r.fecha + "T00:00:00") >= startOfNextWeek)
            .map(r => r.fecha);
        
        // Devolver fechas únicas y ordenadas
        return [...new Set(futureDates)].sort((a, b) => new Date(a + "T00:00:00") - new Date(b + "T00:00:00"));
    };

    const getReservationsForDay = (date) => {
        return reservations.filter(r => r.fecha === date);
    };

    const futureDates = getFutureReservationDates();

    return (
        <div className={styles.container}>
            {futureDates.length > 0 ? futureDates.map(date => {
                const dayReservations = getReservationsForDay(date);
                const isExpanded = expandedDay === date;

                return (
                    <div key={date} className={styles.dayItem}>
                        <button
                            onClick={() => setExpandedDay(isExpanded ? null : date)}
                            className={styles.dayButton}
                        >
                            <div className={styles.dayInfo}>
                                <span className={styles.dayDate}>{formatDate(date)}</span>
                                <span className={styles.reservationCount}>
                                    {dayReservations.length} reservas
                                </span>
                            </div>
                            <ChevronDown
                                className={`${styles.chevronIcon} ${isExpanded ? styles.expanded : ''}`}
                                size={20}
                            />
                        </button>
                        {isExpanded && dayReservations.length > 0 && (
                            <div className={styles.reservationsTableContainer}>
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
                <div className={styles.emptyState}>
                    No hay reservas programadas para fechas futuras (después de esta semana).
                </div>
            )}
        </div>
    );
};

export default FutureReservations; 