import React, { useState } from 'react';
import { Calendar, Clock, Users, Phone, MessageCircle, ChevronLeft, Check, AlertCircle, User, Sun, Moon, Search, X, Edit2 } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import "../datepicker-custom.css";

// Registrar el locale español
registerLocale('es', es);
import ClientLayout from './ClientLayout';
import styles from './ClientView.module.css';
import ReservationDetails from './ReservationDetails';

const SearchReservationForm = ({ onSearch, onClose }) => {
  const [searchData, setSearchData] = useState({
    reservationId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white font-medium">Gestionar Reserva</h2>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <Search size={20} className="inline-block align-text-bottom mr-2" />Código de Reserva
          </label>
          <input
            type="text"
            value={searchData.reservationId}
            onChange={(e) => setSearchData({ ...searchData, reservationId: e.target.value.toUpperCase() })}
            className={styles.input}
            placeholder="Ingresa el código de tu reserva (ej: ABC123)"
            required
            maxLength={6}
            pattern="[A-Z0-9]{6}"
            title="El código debe tener 6 caracteres (letras y números)"
          />
          <p className="text-sm text-white opacity-70 mt-1">Ingresa el código que recibiste en tu confirmación</p>
        </div>
        <button
          type="submit"
          className={styles.mainButton}
        >
          <Search size={20} />
          Buscar Reserva
        </button>
      </form>
    </div>
  );
};

const ReservationConfirmationModal = ({ reservation, onClose, formatDate }) => {
  if (!reservation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-black bg-opacity-90 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-2xl max-w-md w-full">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 bg-opacity-20 rounded-full mb-4">
            <Check className="text-green-400" size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-4">Recibimos tu solicitud</h2>
          
          <div className="bg-green-600 bg-opacity-20 p-4 rounded-xl border border-green-400 border-opacity-40">
            <p className="text-white text-center">
              En breve recibirás un mensaje de WhatsApp nuestro con la confirmación de tu reserva.
            </p>
            <p className="text-white text-center font-semibold mt-2">
              ¡Muchas Gracias!
            </p>
          </div>

          <div className="space-y-2 text-left bg-black bg-opacity-40 p-4 rounded-lg">
            <div>
              <p className="text-sm text-white opacity-70">Código de Reserva</p>
              <p className="font-bold text-lg text-white">{reservation.reservationId}</p>
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
          </div>

          <button
            onClick={onClose}
            className="w-full bg-green-600 bg-opacity-80 text-white py-3 px-4 rounded-xl hover:bg-opacity-100 transition-all duration-200 font-semibold"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ClientView = ({ 
  LOGO_URL, BACKGROUND_IMAGE_URL,
  onAdminClick,
  currentScreen, setCurrentScreen,
  reservaData, setReservaData,
  availableSlots,
  showConfirmation, setShowConfirmation,
  handleDateAndTurnoSubmit, handleHorarioSelect, handleContactoSubmit,
  formatDate,
  handleSearchReservation, handleDeleteReservation,
  showReservationModal, setShowReservationModal,
  showWaitingListModal, setShowWaitingListModal,
  waitingList = [],
  allReservations = []
}) => {

  const [showSearchForm, setShowSearchForm] = useState(false);
  const [foundReservation, setFoundReservation] = useState(null);
  const [isModifying, setIsModifying] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSearch = async (searchData) => {
    const result = await handleSearchReservation(searchData);
    if (result) {
      setFoundReservation(result);
    } else {
      alert('No se encontró ninguna reserva con los datos proporcionados.');
    }
  };

  const handleStartModification = (reservation) => {
    const reservationDate = new Date(reservation.fecha + "T00:00:00");
    
    setEditingReservationId(reservation.reservationId);

    setReservaData({
      ...reservation,
      fecha: reservationDate,
      isModifying: true
    });

    setFoundReservation(null);
    setShowSearchForm(false);
    
    setCurrentScreen('fecha-personas');
  };

  const handleModificationSubmit = async () => {
    try {
      const newReservation = await handleContactoSubmit(true);
      
      if (newReservation) {
        await handleDeleteReservation(editingReservationId);
        setEditingReservationId(null);
        setReservaData(prev => ({ ...prev, isModifying: false }));
      }
    } catch (error) {
      console.error("Error al modificar la reserva:", error);
      alert("Error al modificar la reserva. Por favor, intenta nuevamente.");
      setReservaData(prev => ({ ...prev, isModifying: false }));
      setEditingReservationId(null);
    }
  };

  const handleContactReservation = (reservation) => {
    const mensaje = `Hola! Me comunico por mi reserva #${reservation.reservationId} para el día ${formatDate(reservation.fecha)} a las ${reservation.horario} hs`;
    window.open(`https://wa.me/5492213995351?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleCancelReservation = (reservation) => {
    const mensaje = `Hola! Quisiera cancelar mi reserva #${reservation.reservationId} para el día ${formatDate(reservation.fecha)} a las ${reservation.horario} hs`;
    window.open(`https://wa.me/5492213995351?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // Helper function para generar días disponibles de la semana
  const generateWeekDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dayCount = 0;
    let i = 0;
    
    // Generar hasta 5 días disponibles (sin lunes) para hacer espacio a "más fechas"
    while (dayCount < 5 && i < 14) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Verificar si el día está disponible (no es lunes)
      const isMonday = date.getDay() === 1;
      if (!isMonday) {
        days.push({
          date: date,
          dateString: date.toISOString().split('T')[0],
          label: getDayLabel(date, i),
          isToday: i === 0,
          isTomorrow: i === 1
        });
        dayCount++;
      }
      i++;
    }
    
    return days;
  };

  // Helper function para obtener la etiqueta del día
  const getDayLabel = (date, dayIndex) => {
    if (dayIndex === 0) return 'Hoy';
    if (dayIndex === 1) return 'Mañana';
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dayNames[date.getDay()];
  };

  // Helper function para formatear fecha para mostrar día y número
  const formatDayDisplay = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  };

  // Función para verificar la disponibilidad de un día específico para un turno
  const getDayAvailability = (date, turno = null, personas = null) => {
    const dateString = date.toISOString().split('T')[0];
    const fechaObj = new Date(dateString + "T00:00:00");
    const dayOfWeek = fechaObj.getDay();
    
    // Verificar si el día está cerrado
    if (dayOfWeek === 1) return 'closed'; // Lunes cerrado
    
    // Si no hay turno o personas seleccionadas, no mostrar indicador
    if (!turno || !personas) return 'no-turno';
    
    // Si es domingo y turno noche, está cerrado
    if (dayOfWeek === 0 && turno === 'noche') return 'closed';
    
    // Capacidad total por turno
    const capacidadTotal = {
      'pequena': { max: 4, size: 2 },  // 4 mesas para 1-2 personas
      'mediana': { max: 4, size: 4 },  // 4 mesas para 3-4 personas  
      'grande': { max: 1, size: 6 }    // 1 mesa para 5-6 personas
    };
    
    // Calcular disponibilidad solo para el turno seleccionado
    const reservasDelTurno = allReservations.filter(
      r => r.fecha === dateString && r.turno === turno
    );
    
    const mesasOcupadas = {
      pequena: reservasDelTurno.filter(r => r.personas <= 2).length,
      mediana: reservasDelTurno.filter(r => r.personas > 2 && r.personas <= 4).length,
      grande: reservasDelTurno.filter(r => r.personas > 4).length
    };
    
    // Verificar disponibilidad específica para la cantidad de personas
    let hayDisponibilidad = false;
    
    if (personas <= 2) {
      hayDisponibilidad = mesasOcupadas.pequena < capacidadTotal.pequena.max;
    } else if (personas <= 4) {
      hayDisponibilidad = mesasOcupadas.mediana < capacidadTotal.mediana.max;
    } else {
      hayDisponibilidad = mesasOcupadas.grande < capacidadTotal.grande.max;
    }
    
    if (!hayDisponibilidad) {
      return 'full'; // Sin disponibilidad para esta cantidad de personas
    }
    
    // Calcular disponibilidad general
    const disponibilidad = (capacidadTotal.pequena.max - mesasOcupadas.pequena) +
                          (capacidadTotal.mediana.max - mesasOcupadas.mediana) +
                          (capacidadTotal.grande.max - mesasOcupadas.grande);
    
    const capacidadMaxima = 9; // 9 mesas por turno (4+4+1)
    
    // Determinar el tipo de disponibilidad
    if (disponibilidad <= capacidadMaxima * 0.3) {
      return 'low'; // Poca disponibilidad (30% o menos)
    } else {
      return 'available'; // Buena disponibilidad
    }
  };

  // Función para obtener el indicador visual según la disponibilidad
  const getAvailabilityIndicator = (date) => {
    const availability = getDayAvailability(date, reservaData.turno, reservaData.personas);
    
    switch (availability) {
      case 'closed':
      case 'no-turno':
        return null; // No mostrar indicador para días cerrados o sin turno
      case 'full':
        return (
          <div className="absolute top-2 right-2 bg-red-400 bg-opacity-80 rounded-full w-1.5 h-1.5 shadow-md"></div>
        );
      case 'low':
        return (
          <div className="absolute top-2 right-2 bg-orange-400 bg-opacity-80 rounded-full w-1.5 h-1.5 shadow-md"></div>
        );
      case 'available':
        return (
          <div className="absolute top-2 right-2 bg-green-400 bg-opacity-80 rounded-full w-1.5 h-1.5 shadow-md"></div>
        );
      default:
        return null;
    }
  };

  // Función para obtener el indicador para el calendario extendido
  const getCalendarAvailabilityIndicator = (date) => {
    const availability = getDayAvailability(date, reservaData.turno, reservaData.personas);
    
    switch (availability) {
      case 'closed':
      case 'no-turno':
        return null;
      case 'full':
        return (
          <div className="absolute top-1.5 right-1.5 bg-red-400 bg-opacity-80 rounded-full w-1.5 h-1.5 shadow-sm"></div>
        );
      case 'low':
        return (
          <div className="absolute top-1.5 right-1.5 bg-orange-400 bg-opacity-80 rounded-full w-1.5 h-1.5 shadow-sm"></div>
        );
      case 'available':
        return (
          <div className="absolute top-1.5 right-1.5 bg-green-400 bg-opacity-80 rounded-full w-1.5 h-1.5 shadow-sm"></div>
        );
      default:
        return null;
    }
  };

  if (currentScreen === 'landing') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={`${styles.screenContainer} flex flex-col min-h-screen`}>
          <div className="flex-grow">
            {/* Nueva sección hero profesional */}
            <div className={styles.heroSection}>
              <p className={styles.heroWelcome}>Bienvenido a</p>
              {LOGO_URL ? (
                <img src={LOGO_URL} alt="Rosaura Logo" className="h-60 mx-auto" />
              ) : (
                <h1 className={styles.heroTitle}>
                  <span className="letter">R</span>
                  <span className="letter">o</span>
                  <span className="letter">s</span>
                  <span className="letter">a</span>
                  <span className="letter">u</span>
                  <span className="letter">r</span>
                  <span className="letter">a</span>
                </h1>
              )}
              <p className={styles.heroSubtitle}>Reservas online</p>
            </div>
            
            <div className={`${styles.buttonContainer} space-y-4 mb-4`}>
              <button onClick={() => setCurrentScreen('fecha-personas')} className={styles.mainButton}>
                <Calendar size={20} />
                Hacé tu reserva
              </button>
              <button 
                onClick={() => window.open('https://wa.me/5492213995351', '_blank')} 
                className={styles.secondaryButton}
              >
                <MessageCircle size={20} className="text-green-500" />
                Envianos un WhatsApp
              </button>
              <button 
                onClick={() => setShowSearchForm(true)} 
                className={styles.secondaryButton}
              >
                <Search size={20} />
                Gestionar mi reserva
              </button>
            </div>
          </div>
          <div className="mt-auto pb-4">
            <button onClick={onAdminClick} className={styles.adminButton}>
              Admin
            </button>
          </div>
        </div>

        {showSearchForm && !foundReservation && (
          <div className={`${styles.modalOverlay} fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4`}>
            <div className={`${styles.modalContent} bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-2xl max-w-md w-full`}>
              <SearchReservationForm
                onSearch={handleSearch}
                onClose={() => setShowSearchForm(false)}
              />
            </div>
          </div>
        )}

        {foundReservation && (
          <div className={`${styles.modalOverlay} fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4`}>
            <div className={`${styles.modalContent} bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-2xl max-w-md w-full`}>
              <ReservationDetails
                reservation={foundReservation}
                onClose={() => {
                  setFoundReservation(null);
                  setShowSearchForm(false);
                }}
                formatDate={formatDate}
                onEdit={() => handleStartModification(foundReservation)}
                onCancel={() => handleCancelReservation(foundReservation)}
                onContact={() => handleContactReservation(foundReservation)}
              />
            </div>
          </div>
        )}
      </ClientLayout>
    );
  }

  if (currentScreen === 'fecha-personas') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    const weekDays = generateWeekDays();
    
    const isDayDisabled = (date) => {
      if (date.getDay() === 1) return true;
      if (date > maxDate) return true;
      if (date < today) return true;
      return false;
    };
    
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="space-y-6">
          {/* Selección de turno */}
          <div className={styles.formSection}>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-200 flex items-center">
                <Clock size={20} className="inline-block align-text-bottom mr-2" />Turno
              </label>
              <button 
                onClick={() => {
                  setCurrentScreen('landing');
                  setReservaData({
                    fecha: '',
                    personas: '',
                    turno: '',
                    horario: '',
                    cliente: { 
                      nombre: '', 
                      telefono: '', 
                      codigoPais: '54',
                      comentarios: '' 
                    }
                  });
                }} 
                className="text-green-700 text-lg font-medium hover:text-green-500 transition-colors"
              >
                Volver
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setReservaData({...reservaData, turno: 'mediodia'})} 
                className={reservaData.turno === 'mediodia' ? styles.turnoButtonSelected : styles.turnoButtonUnselected}
              >
                <Sun size={20} className="inline-block align-text-bottom text-yellow-200" /> Mediodía
              </button>
              <button
                onClick={() => setReservaData({...reservaData, turno: 'noche'})} 
                className={reservaData.turno === 'noche' ? styles.turnoButtonSelected : styles.turnoButtonUnselected}
              >
                <Moon size={20} className="inline-block align-text-bottom text-blue-300" /> Noche
              </button>
            </div>
          </div>

          {/* Selección de cantidad de personas */}
          <div className={styles.formSection}>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              <Users size={20} className="inline-block align-text-bottom mr-2" />Cantidad de personas
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => setReservaData({ ...reservaData, personas: num })}
                  className={reservaData.personas === num ? styles.personasButtonSelected : styles.personasButtonUnselected}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const mensaje = `Hola, quiero hacer una reserva para ${reservaData.fecha ? formatDate(reservaData.fecha) : 'un día'} para 7 o más personas en el turno ${reservaData.turno === 'mediodia' ? 'mediodía' : 'noche'}`;
                const encodedMensaje = encodeURIComponent(mensaje);
                window.open(`https://wa.me/5492213995351?text=${encodedMensaje}`, '_blank');
              }}
              className={styles.secondaryButton}
            >
              <MessageCircle size={18} />
              <span>7+</span>
            </button>
          </div>

          {/* Selección de fecha */}
          <div className={styles.formSection}>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-200 flex items-center">
                <Calendar size={20} className="inline-block align-text-bottom mr-2" />Fecha
              </label>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3">
                {weekDays.map((day) => {
                  const isSelected = reservaData.fecha && 
                    new Date(reservaData.fecha).toDateString() === day.date.toDateString();
                  // Solo mostrar indicador si hay turno Y personas seleccionadas
                  const availabilityIndicator = (reservaData.turno && reservaData.personas) ? getAvailabilityIndicator(day.date) : null;
                  
                  return (
                    <button
                      key={day.dateString}
                      onClick={() => setReservaData({ ...reservaData, fecha: day.date })}
                      className={`${isSelected ? styles.dateButtonSelected : styles.dateButtonUnselected} 
                        flex flex-col items-center py-3 relative`}
                      type="button"
                    >
                      <span className="text-sm font-medium">{day.label}</span>
                      <span className="text-xs opacity-75">{formatDayDisplay(day.date)}</span>
                      {availabilityIndicator}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setShowDatePicker(true);
                  }}
                  className={`${styles.dateButtonUnselected} flex flex-col items-center py-3 relative`}
                >
                  <span className="text-sm font-medium">+ Fechas</span>
                  <Calendar size={16} className="text-gray-400 mt-1" />
                </button>
              </div>
              {/* Solo mostrar leyenda si hay turno Y personas seleccionadas */}
              {(reservaData.turno && reservaData.personas) && (
                  <div className="mt-3 text-center">
                    <div className="flex items-center justify-center gap-4 text-xs text-white opacity-70">
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 bg-green-400 bg-opacity-80 rounded-full shadow-sm"></span>
                        <span>Disponible</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 bg-orange-400 bg-opacity-80 rounded-full shadow-sm"></span>
                        <span>Poca disponibilidad</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 bg-red-400 bg-opacity-80 rounded-full shadow-sm"></span>
                        <span>Sin lugar</span>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Botón para consultar disponibilidad */}
          <button 
            onClick={handleDateAndTurnoSubmit} 
            disabled={!reservaData.personas || !reservaData.fecha || !reservaData.turno}
            className={styles.mainButton}
          >
            Consultar disponibilidad
          </button>
        </div>

        {/* Modal del calendario completo */}
        {showDatePicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-black bg-opacity-90 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20 shadow-2xl max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-white font-medium">Seleccionar fecha</h2>
                <button 
                  onClick={() => setShowDatePicker(false)} 
                  className="text-white hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="w-full">
                <DatePicker
                  selected={reservaData.fecha}
                  onChange={(date) => {
                    if (date) {
                      const selectedDate = new Date(date);
                      selectedDate.setHours(0, 0, 0, 0);
                      
                      // Verificar que no sea lunes
                      if (selectedDate.getDay() !== 1) {
                        setReservaData({ ...reservaData, fecha: selectedDate });
                        setShowDatePicker(false);
                      } else {
                        alert('Los lunes permanecemos cerrados. Por favor selecciona otro día.');
                      }
                    }
                  }}
                  minDate={new Date()}
                  maxDate={(() => {
                    const maxDate = new Date();
                    maxDate.setMonth(maxDate.getMonth() + 1);
                    return maxDate;
                  })()}
                  filterDate={(date) => {
                    // Filtrar lunes
                    return date.getDay() !== 1;
                  }}
                  renderDayContents={(day, date) => (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <span>{day}</span>
                      {/* Solo mostrar indicador en calendario si hay turno Y personas seleccionadas */}
                      {date && reservaData.turno && reservaData.personas && getCalendarAvailabilityIndicator(date)}
                    </div>
                  )}
                  inline
                  locale="es"
                  dateFormat="dd/MM/yyyy"
                  calendarClassName="custom-green-calendar"
                  className="w-full"
                />
              </div>
              
              <div className="mt-4 text-center space-y-2">
                <p className="text-sm text-white opacity-70">
                  Los lunes permanecemos cerrados
                </p>
                {/* Solo mostrar leyenda en calendario si hay turno Y personas seleccionadas */}
                {(reservaData.turno && reservaData.personas) && (
                    <div className="flex items-center justify-center gap-4 text-xs text-white opacity-70">
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 bg-green-400 bg-opacity-80 rounded-full shadow-sm"></span>
                        <span>Disponible</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 bg-orange-400 bg-opacity-80 rounded-full shadow-sm"></span>
                        <span>Poca disponibilidad</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 bg-red-400 bg-opacity-80 rounded-full shadow-sm"></span>
                        <span>Sin lugar</span>
                      </div>
                    </div>
                 )}
              </div>
            </div>
          </div>
        )}
      </ClientLayout>
    );
  }
  
  if (currentScreen === 'horario') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={`${styles.screenContainer}`}>
        <div className="mb-6">
          <button onClick={() => setCurrentScreen('fecha-personas')} className={styles.backButton}><ChevronLeft size={16} /></button>
          <h1 className="text-xl font-bold text-white inline-block">Horarios</h1>
        </div>
        <div className="space-y-4">
          <p className="text-center text-gray-200">
            Disponibilidad turno {reservaData.turno === 'mediodia' ? 'mediodía' : 'noche'} el {formatDate(reservaData.fecha)}
          </p>
          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {availableSlots.map((slot) => (
                <button 
                  key={slot} 
                  onClick={() => handleHorarioSelect(slot)}
                  className={reservaData.horario === slot ? styles.turnoButtonSelected : styles.turnoButtonUnselected}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto mb-4" size={48} />
              <p>No hay horarios disponibles para esta fecha y turno.</p>
              <button onClick={() => setCurrentScreen('fecha-personas')} className={styles.secondaryButton}>Volver a seleccionar fecha</button>
            </div>
          )}
        </div>
        </div>
      </ClientLayout>
    );
  }

  if (currentScreen === 'contacto') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={styles.container}>
          <button onClick={() => setCurrentScreen('horario')} className={styles.backButton}>
            <ChevronLeft size={20} />
            Volver
          </button>
          <div className={styles.formContainer}>
            <h1 className={styles.title}>
              {reservaData.willGoToWaitingList ? 'Lista de Espera - Tus datos' : 'Datos de contacto'}
            </h1>
            {reservaData.willGoToWaitingList && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <p className="text-sm">
                  <strong>No hay cupos disponibles</strong> para esta fecha y turno. 
                  Ingresá tus datos y te avisaremos por WhatsApp si se libera un lugar.
                </p>
              </div>
            )}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (reservaData.isModifying) {
                handleModificationSubmit();
              } else {
                handleContactoSubmit();
              }
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center">
                  <User size={16} className="mr-2" />Nombre completo
                </label>
                <input
                  type="text"
                  value={reservaData.cliente.nombre}
                  onChange={(e) => setReservaData({
                    ...reservaData,
                    cliente: {...reservaData.cliente, nombre: e.target.value}
                  })}
                  className={styles.input}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center">
                  <Phone size={16} className="mr-2" />Teléfono (WhatsApp)
                </label>
                <div className="flex gap-2">
                  <select
                    value={reservaData.cliente.codigoPais || '54'}
                    onChange={(e) => setReservaData({
                      ...reservaData,
                      cliente: {...reservaData.cliente, codigoPais: e.target.value}
                    })}
                    className={styles.select}
                  >
                    <option value="54">+54 (AR)</option>
                    <option value="598">+598 (UY)</option>
                    <option value="55">+55 (BR)</option>
                    <option value="56">+56 (CL)</option>
                    <option value="57">+57 (CO)</option>
                    <option value="51">+51 (PE)</option>
                    <option value="58">+58 (VE)</option>
                    <option value="593">+593 (EC)</option>
                    <option value="595">+595 (PY)</option>
                    <option value="591">+591 (BO)</option>
                  </select>
                  <input
                    type="tel"
                    value={reservaData.cliente.telefono}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 15) {
                        setReservaData({
                          ...reservaData,
                          cliente: {...reservaData.cliente, telefono: value}
                        });
                      }
                    }}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className={styles.input}
                    placeholder="221 1234567"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-200">Ingresá el número sin el 0 inicial ni el 15</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center">
                  <MessageCircle size={16} className="mr-2" />Aclaraciones (opcional)
                </label>
                <textarea
                  value={reservaData.cliente.comentarios}
                  onChange={(e) => setReservaData({
                    ...reservaData,
                    cliente: {...reservaData.cliente, comentarios: e.target.value}
                  })}
                  className={styles.textarea}
                  placeholder="Ej: Alergias, preferencias de mesa, ocasión especial, etc."
                />
              </div>
              <button
                type="submit"
                disabled={!reservaData.cliente.nombre || !reservaData.cliente.telefono || reservaData.cliente.telefono.length < 8}
                className={styles.mainButton}
              >
                {reservaData.isModifying ? 'Guardar cambios' : (reservaData.willGoToWaitingList ? 'Agregar a lista de espera' : 'Confirmar reserva')}
              </button>
            </form>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (currentScreen === 'confirmacion') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 bg-opacity-20 rounded-full mb-3">
              <Check className="text-white" size={28} />
            </div>
            <p className="text-xl text-white opacity-80 font-medium">Tu código de reserva es:</p>
            <p className="text-5xl font-bold text-white my-2">{reservaData.reservationId}</p>
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-base text-white opacity-70 font-medium">Fecha</p>
              <p className="font-semibold text-lg text-white">{formatDate(reservaData.fecha)}</p>
            </div>
            <div>
              <p className="text-base text-white opacity-70 font-medium">Horario</p>
              <p className="font-semibold text-lg text-white">{reservaData.horario}</p>
            </div>
            <div>
              <p className="text-base text-white opacity-70 font-medium">Personas</p>
              <p className="font-semibold text-lg text-white">{reservaData.personas}</p>
            </div>
            <div>
              <p className="text-base text-white opacity-70 font-medium">Nombre</p>
              <p className="font-semibold text-lg text-white">{reservaData.cliente.nombre}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={() => handleCancelReservation(reservaData)}
              className="w-full flex items-center justify-center gap-2 bg-black bg-opacity-40 text-white py-3 px-4 rounded-xl hover:bg-opacity-60 transition-all duration-200"
            >
              <X size={18} />
              Cancelar tu reserva
            </button>
            
            <button 
              onClick={() => {
                setCurrentScreen('landing');
                setReservaData({
                  fecha: '',
                  personas: 2,
                  turno: '',
                  horario: '',
                  cliente: { nombre: '', telefono: '', comentarios: '' }
                });
                setFoundReservation(null);
                setShowSearchForm(false);
              }} 
              className={styles.mainButton}
            >
              <Check size={20} />
              Volver al inicio
            </button>
          </div>
        </div>

        {showReservationModal && (
          <ReservationConfirmationModal
            reservation={reservaData}
            onClose={() => setShowReservationModal(false)}
            formatDate={formatDate}
          />
        )}
      </ClientLayout>
    );
  }

  if (currentScreen === 'lista-espera') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-600 bg-opacity-20 rounded-full mb-3">
              <Clock className="text-white" size={28} />
            </div>
            <h1 className="text-xl text-white opacity-80 font-medium">Sin cupo disponible</h1>
            <p className="text-lg text-white my-2">¡Pero no te preocupes!</p>
          </div>
          
          <div className="bg-black bg-opacity-40 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-base text-white opacity-70 font-medium">Tu solicitud</p>
              <p className="font-semibold text-lg text-white">{formatDate(reservaData.fecha)}</p>
              <p className="text-white">{reservaData.turno === 'mediodia' ? 'Mediodía' : 'Noche'} • {reservaData.personas} personas</p>
              <p className="text-white">Horario preferido: {reservaData.horario}</p>
            </div>
            <div>
              <p className="text-base text-white opacity-70 font-medium">Código de espera</p>
              <p className="font-semibold text-lg text-white">{reservaData.waitingId}</p>
            </div>
          </div>

          <div className="bg-green-600 bg-opacity-20 rounded-xl p-4">
            <h3 className="text-white font-medium mb-2">📱 Te avisamos por WhatsApp</h3>
            <p className="text-white text-sm opacity-90">
              Si se libera un cupo para tu fecha y turno, te enviaremos un mensaje de WhatsApp al número {reservaData.cliente.codigoPais} {reservaData.cliente.telefono} para que confirmes tu reserva.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={() => {
                const mensaje = `Hola! Me comunico por mi solicitud en lista de espera #${reservaData.waitingId} para el día ${formatDate(reservaData.fecha)} turno ${reservaData.turno === 'mediodia' ? 'mediodía' : 'noche'}`;
                window.open(`https://wa.me/5492213995351?text=${encodeURIComponent(mensaje)}`, '_blank');
              }}
              className="w-full flex items-center justify-center gap-2 bg-green-600 bg-opacity-20 text-white py-3 px-4 rounded-xl hover:bg-opacity-30 transition-all duration-200"
            >
              <MessageCircle size={18} />
              Contactanos por WhatsApp
            </button>
            
            <button 
              onClick={() => {
                setCurrentScreen('landing');
                setReservaData({
                  fecha: '',
                  personas: 2,
                  turno: '',
                  horario: '',
                  cliente: { nombre: '', telefono: '', comentarios: '', codigoPais: '54' }
                });
                setShowWaitingListModal(false);
              }} 
              className={styles.mainButton}
            >
              <Check size={20} />
              Volver al inicio
            </button>
          </div>
        </div>

        {showWaitingListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-2xl max-w-md w-full">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-600 bg-opacity-20 rounded-full">
                  <Clock className="text-white" size={28} />
                </div>
                <h3 className="text-xl text-white font-medium">Agregado a lista de espera</h3>
                <p className="text-white opacity-80">
                  Te hemos agregado a nuestra lista de espera. Si se libera un cupo, te contactaremos por WhatsApp.
                </p>
                <button
                  onClick={() => setShowWaitingListModal(false)}
                  className="w-full bg-green-600 bg-opacity-20 text-white py-3 px-4 rounded-xl hover:bg-opacity-30 transition-all duration-200"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </ClientLayout>
    );
  }
  
  return <div>Cargando...</div>
};