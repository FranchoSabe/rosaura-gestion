import { updateReservationCheckIn } from '../../firebase';

export const hasCheckedIn = (reservation) => reservation?.estadoCheckIn === 'confirmado';

export const performCheckIn = async (reservation, showNotification) => {
  try {
    await updateReservationCheckIn(reservation.id, {
      estadoCheckIn: 'confirmado',
      horaLlegada: new Date(),
    });
    if (showNotification) {
      showNotification('Check-in realizado correctamente', 'success');
    }
    return true;
  } catch (error) {
    console.error('Error en check-in:', error);
    if (showNotification) {
      showNotification('Error al realizar check-in', 'error');
    }
    throw error;
  }
};

export default { hasCheckedIn, performCheckIn };
