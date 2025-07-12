import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, MessageCircle, ChevronLeft, Check, AlertCircle, User, Sun, Moon, FileSearch, X, Edit2, Feather, Heart, ChevronRight } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import "../datepicker-custom.css";
import ClientLayout from './ClientLayout';
import styles from './ClientView.module.css';
import buttonStyles from '../styles/shared/Buttons.module.css';
import ReservationDetails from './ReservationDetails';
import { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import { PhoneInput } from '../shared/components/ui/Input';
import { formatDateToString } from '../utils';
// Importing the new UI components
import { Button, Card, ProgressIndicator } from '../shared/components/ui';

// Registrar el locale español
registerLocale('es', es);

const SearchReservationForm = ({ onSearch, onClose }) => {
  const [searchData, setSearchData] = useState({
    reservationId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchData);
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchHeader}>
        <h2 className={styles.searchTitle}>Gestionar Reserva</h2>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <div className={styles.fieldGroup}>
          <label className={styles.labelWithIcon}>
                            <FileSearch size={18} />Código de Reserva
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
          <p className={styles.helpText}>Ingresa el código que recibiste en tu confirmación</p>
        </div>
        <button
          type="submit"
          className={buttonStyles.primaryButton}
        >
          <FileSearch size={18} />
          Buscar Reserva
        </button>
      </form>
    </div>
  );
};

const ReservationConfirmationModal = ({ reservation, onClose, formatDate }) => {
  if (!reservation) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalCenter}>
          <div className={styles.successIcon}>
            <Check className="text-green-400" size={32} />
          </div>
          
          <h2 className={styles.modalTitle}>Recibimos tu solicitud</h2>
          
          <div className={styles.successMessage}>
            <p className={styles.successMessageText}>
              En breve recibirás un mensaje de WhatsApp nuestro con la confirmación de tu reserva.
            </p>
            <p className={styles.successMessageBold}>
              ¡Muchas Gracias!
            </p>
          </div>

          <div className={styles.reservationSummary}>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Código de Reserva</p>
              <p className={styles.summaryValue}>{reservation.reservationId}</p>
            </div>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Fecha</p>
              <p className={styles.summaryValueMedium}>{formatDate(reservation.fecha)}</p>
            </div>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Horario</p>
              <p className={styles.summaryValueMedium}>{reservation.horario}</p>
            </div>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Personas</p>
              <p className={styles.summaryValueMedium}>{reservation.personas}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={styles.successButton}
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
  
  // Estado para ayuda del teléfono
  const [showPhoneHelp, setShowPhoneHelp] = useState(false);

  const sliderRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

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
    
    // Generar hasta 5 días disponibles (sin lunes)
    while (dayCount < 5 && i < 14) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Verificar si el día está disponible (no es lunes)
      const isMonday = date.getDay() === 1;
      if (!isMonday) {
        days.push({
          date: date,
          dateString: formatDateToString(date),
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
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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
    const dateString = formatDateToString(date);
    const fechaObj = new Date(dateString + "T00:00:00");
    const dayOfWeek = fechaObj.getDay();
    
    // Verificar si el día está cerrado
    if (dayOfWeek === 1) return 'closed'; // Lunes cerrado ambos turnos
    
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
                        <div className={`${styles.availabilityIndicator} ${styles.redAvailability}`}></div>
        );
      case 'low':
        return (
                        <div className={`${styles.availabilityIndicator} ${styles.orangeAvailability}`}></div>
        );
      case 'available':
        return (
                        <div className={`${styles.availabilityIndicator} ${styles.greenAvailability}`}></div>
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
                        <div className={`${styles.availabilityIndicatorSmall} ${styles.redAvailability}`}></div>
        );
      case 'low':
        return (
                        <div className={`${styles.availabilityIndicatorSmall} ${styles.orangeAvailability}`}></div>
        );
      case 'available':
        return (
                        <div className={`${styles.availabilityIndicatorSmall} ${styles.greenAvailability}`}></div>
        );
      default:
        return null;
    }
  };

  // Seleccionar fecha predeterminada al montar la pantalla
  useEffect(() => {
    if (!reservaData.fecha) {
      const todayLocal = new Date();
      todayLocal.setHours(0, 0, 0, 0);
      setReservaData(prev => ({ ...prev, fecha: todayLocal }));
    }
  }, []);

  useEffect(() => {
    // center scroll when fecha cambia
    if (sliderRef.current && reservaData.fecha) {
      const children = Array.from(sliderRef.current.children);
      const sel = children.find(ch=> new Date(ch.getAttribute('data-date'))?.toDateString() === new Date(reservaData.fecha).toDateString());
      if(sel){
        sel.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
      }
    }
  }, [reservaData.fecha]);

  const handleSliderScroll = () => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (!sliderRef.current) return;
      const slider = sliderRef.current;
      const sliderRect = slider.getBoundingClientRect();
      const centerX = sliderRect.left + sliderRect.width / 2;

      let closestEl = null;
      let closestDist = Infinity;

      Array.from(slider.children).forEach(node => {
        const rect = node.getBoundingClientRect();
        const nodeCenter = rect.left + rect.width / 2;
        const dist = Math.abs(nodeCenter - centerX);
        if (dist < closestDist) {
          closestDist = dist;
          closestEl = node;
        }
      });

      if (closestEl) {
        const dateAttr = closestEl.getAttribute('data-date');
        if (dateAttr) {
          const dateObj = new Date(dateAttr);
          if (!reservaData.fecha || dateObj.toDateString() !== new Date(reservaData.fecha).toDateString()) {
            setReservaData(prev => ({ ...prev, fecha: dateObj }));
          }
        }
      }
    }, 25); // debounce 25ms
  };

  if (currentScreen === 'landing') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={`${styles.screenContainer} ${styles.flex} ${styles.flexCol} ${styles.minHScreen}`}>
          <div className={styles.flexGrow}>
            {/* Sección hero profesional SIN Card - animación original */}
            <div className={styles.heroSection}>
              <p className={styles.heroWelcome}>Bienvenido a</p>
              {LOGO_URL ? (
                <img src={LOGO_URL} alt="Rosaura Logo" className={styles.logoImage} />
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
            </div>
            
            {/* Acciones principales con mismo ancho */}
            <div className={`${styles.buttonContainer} ${styles.actionsCompact}`}>
              <div className={styles.actionsUniform}>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => setCurrentScreen('fecha-select')} 
                  className={styles.uniformActionButton}
                  icon="left"
                >
                  <Calendar size={20} />
                  Hacer una reserva
                </Button>
                
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => window.open('https://wa.me/5492213995351', '_blank')} 
                  className={styles.uniformActionButton}
                  icon="left"
                >
                  <MessageCircle size={20} />
                  WhatsApp
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowSearchForm(true)} 
                  className={styles.uniformActionButton}
                  icon="left"
                >
                  <FileSearch size={20} />
                  Gestionar reserva
                </Button>
              </div>
            </div>
            
            {/* Horarios como texto directo sobre el fondo */}
            <div className={styles.horariosDirectos}>
              <div className={styles.horariosHeader}>
                <Clock size={18} className={styles.horariosIcon} />
                <h3 className={styles.horariosTitle}>Horarios de Atención</h3>
              </div>
              <div className={styles.horariosGrid}>
                <div className={styles.horarioItem}>
                  <span className={styles.turnoLabel}>Mediodía</span>
                  <span className={styles.horarioDetalle}>Mar-Dom 12 a 15</span>
                </div>
                <div className={styles.horarioItem}>
                  <span className={styles.turnoLabel}>Noche</span>
                  <span className={styles.horarioDetalle}>Mar-Sáb 20 a 23</span>
                </div>
                <div className={styles.horarioItem}>
                  <span className={styles.cerradoLabel}>Lunes cerrado</span>
                </div>
              </div>
              <button 
                onClick={() => {/* TODO: Abrir modal de info completa */}}
                className={styles.masInfoButton}
              >
                Ver más información →
              </button>
            </div>
          </div>
          
          {/* Botón admin posicionado discretamente en esquina superior derecha */}
          <div className={styles.adminButtonContainer}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onAdminClick} 
              className={styles.adminButton}
            >
              Admin
            </Button>
          </div>
        </div>

        {showSearchForm && !foundReservation && (
          <div className={`${styles.modalOverlay} ${styles.fixed} ${styles.inset0} ${styles.bgBlack} ${styles.bgOpacity50} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.p4}`}>
            <Card variant="glass" padding="lg" className={`${styles.modalContent} ${styles.maxWMd} ${styles.wFull}`}>
              <SearchReservationForm
                onSearch={handleSearch}
                onClose={() => setShowSearchForm(false)}
              />
            </Card>
          </div>
        )}

        {foundReservation && (
          <div className={`${styles.modalOverlay} ${styles.fixed} ${styles.inset0} ${styles.bgBlack} ${styles.bgOpacity50} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.p4}`}>
            <Card variant="glass" padding="lg" className={`${styles.modalContent} ${styles.maxWMd} ${styles.wFull}`}>
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
            </Card>
          </div>
        )}
      </ClientLayout>
    );
  }

  // Nueva pantalla: solo fecha (hoy/mañana/+ fechas)
  if (currentScreen === 'fecha-select') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    const weekDays = generateWeekDays();
    
    const isDayDisabled = (date) => {
      if (date.getDay() === 1) return true; // Lunes cerrado
      if (date > maxDate) return true;
      if (date < today) return true;
      return false;
    };
    
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={styles.enhancedScreenContainer}>
          {/* Progress Indicator */}
          <ProgressIndicator currentStep="fecha" />
          
          {/* Selección de fecha */}
          <div className={styles.enhancedDateSection}>
            <div className={styles.enhancedSectionHeader}>
              <div className={styles.enhancedSectionTitle}>
                <Calendar size={24} />
                Fecha
              </div>
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
                      comentarios: '' 
                    }
                  });
                }} 
                className={styles.backButtonStyled}
              >
                <ChevronLeft size={18} />
              </button>
            </div>
            
            {/* Grid de 3 tarjetas: Hoy, Mañana, +Fechas */}
            <div className={styles.enhancedDateGrid} style={{gridTemplateColumns:'repeat(2,1fr)'}}>
              {[0,1].map((offset) => {
                const dateObj = new Date();
                dateObj.setDate(dateObj.getDate() + offset);
                const label = getDayLabel(dateObj, offset);
                const isSelected = reservaData.fecha && new Date(reservaData.fecha).toDateString() === dateObj.toDateString();
                return (
                  <button
                    key={`quick-${offset}`}
                    onClick={() => setReservaData({...reservaData, fecha: dateObj})}
                    className={`${styles.enhancedDateButton} ${isSelected ? styles.enhancedDateButtonSelected : ''}`}
                    type="button"
                  >
                    <div className={styles.enhancedDateButtonContent}>
                      <span className={styles.enhancedDateLabel}>{label}</span>
                      <span className={styles.enhancedDateDay}>{formatDayDisplay(dateObj)}</span>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => setShowDatePicker(true)}
                className={`${styles.enhancedMoreDatesButton} ${styles.moreDatesFull}`}
              >
                <Calendar size={16} />
                <span>+ Fechas</span>
              </button>
            </div>
          </div>

          {/* Botón continuar a seleccionar turno */}
          <Button 
            variant="primary"
            size="lg"
            onClick={() => setCurrentScreen('turno-select')} 
            disabled={!reservaData.fecha}
            fullWidth
          >
            Continuar
          </Button>
        </div>

        {/* Modal del calendario completo */}
        {showDatePicker && (
          <div className={`${styles.fixed} ${styles.inset0} ${styles.bgBlack} ${styles.bgOpacity50} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.p4} ${styles.z50}`}>
            <div className={`${styles.bgBlack} ${styles.bgOpacity90} ${styles.backdropBlurSm} ${styles.roundedXl} ${styles.p4} ${styles.border} ${styles.borderWhite} ${styles.borderOpacity20} ${styles.shadow2xl} ${styles.maxWSm} ${styles.wFull} ${styles.mx4}`}>
              <div className={`${styles.flex} ${styles.justifyBetween} ${styles.itemsCenter} ${styles.mb4}`}>
                <h2 className={`${styles.textXl} ${styles.textWhite} ${styles.fontMedium}`}>Seleccionar fecha</h2>
                <button 
                  onClick={() => setShowDatePicker(false)} 
                  className={`${styles.textWhite} ${styles.hoverTextGray300}`}
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
                
              </div>
            </div>
          </div>
        )}
      </ClientLayout>
    );
  }

  // Nueva pantalla: Selección de turno solamente
  if (currentScreen === 'turno-select') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={styles.enhancedScreenContainer}>
          {/* Progress Indicator */}
          <ProgressIndicator currentStep="turno" />
          
          <div className={styles.enhancedTurnoSection}>
            <div className={styles.enhancedSectionHeader}>
              <div className={styles.enhancedSectionTitle}>
                <Clock size={24} /> Turno
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentScreen('fecha-select')}
                leftIcon={<ChevronLeft size={18} />}
                className={styles.backButtonStyled}
              />
            </div>
            <div className={styles.enhancedTurnoGrid}>
              <Button 
                variant={reservaData.turno === 'mediodia' ? "primary" : "secondary"}
                size="lg"
                onClick={() => setReservaData({...reservaData, turno:'mediodia'})}
                leftIcon={<Sun size={24} className={styles.textYellow200} />}
                className={`${styles.py4} ${styles.textLg}`}
              >
                Mediodía
              </Button>
              <Button 
                variant={reservaData.turno === 'noche' ? "primary" : "secondary"}
                size="lg"
                onClick={() => setReservaData({...reservaData, turno:'noche'})}
                leftIcon={<Moon size={24} className={styles.textBlue300} />}
                className={`${styles.py4} ${styles.textLg}`}
              >
                Noche
              </Button>
            </div>
          </div>
          <Button 
            variant="primary"
            size="lg"
            onClick={() => setCurrentScreen('personas-disponibilidad')} 
            disabled={!reservaData.turno}
            fullWidth
          >
            Continuar
          </Button>
        </div>
      </ClientLayout>
    );
  }

  // Nueva pantalla: solo personas y consulta de disponibilidad
  if (currentScreen === 'personas-disponibilidad') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={styles.enhancedScreenContainer}>
          {/* Progress Indicator */}
          <ProgressIndicator currentStep="personas" />
          
          {/* Header con información de fecha y turno */}
          <div className={styles.enhancedSectionHeader}>
            <div className={styles.enhancedSectionTitle}>
              <Users size={24} />
              Cantidad de personas
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentScreen('fecha-select')}
              leftIcon={<ChevronLeft size={18} />}
              className={styles.backButtonStyled}
            />
          </div>

          {/* Información contextual */}
          <Card variant="glass" padding="md" className={styles.mb4}>
            <div className={`${styles.textCenter} ${styles.spaceY2}`}>
              <p className={`${styles.textSm} ${styles.textGray200} ${styles.opacity90}`}>
                {formatDate(reservaData.fecha)}
              </p>
              <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.gap2}`}>
                {reservaData.turno === 'mediodia' ? (
                  <Sun size={20} className={styles.textYellow200} />
                ) : (
                  <Moon size={20} className={styles.textBlue300} />
                )}
                <span className={`${styles.textBase} ${styles.fontMedium} ${styles.textWhite}`}>
                  Turno {reservaData.turno === 'mediodia' ? 'mediodía' : 'noche'}
                </span>
              </div>
            </div>
          </Card>

          {/* Selección de cantidad de personas */}
          <div className={`${styles.grid} ${styles.gridCols3} ${styles.gap3} ${styles.mb4}`}>
            {[1, 2, 3, 4, 5, 6].map(num => (
              <Button
                key={num}
                variant={reservaData.personas === num ? "primary" : "secondary"}
                size="lg"
                onClick={() => setReservaData({ ...reservaData, personas: num })}
                className={`${styles.py3} ${styles.textLg}`}
              >
                {num}
              </Button>
            ))}
          </div>

          {/* Botón para 7+ personas */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              const mensaje = `Hola, quiero hacer una reserva para ${reservaData.fecha ? formatDate(reservaData.fecha) : 'un día'} para 7 o más personas en el turno ${reservaData.turno === 'mediodia' ? 'mediodía' : 'noche'}`;
              const encodedMensaje = encodeURIComponent(mensaje);
              window.open(`https://wa.me/5492213995351?text=${encodedMensaje}`, '_blank');
            }}
            leftIcon={<MessageCircle size={18} />}
            className={styles.mb4}
          >
            7+ personas
          </Button>

          {/* Botón para consultar disponibilidad */}
          <Button 
            variant="primary"
            size="lg"
            onClick={handleDateAndTurnoSubmit} 
            disabled={!reservaData.personas}
            fullWidth
          >
            Consultar disponibilidad
          </Button>
        </div>
      </ClientLayout>
    );
  }

  // Mantengo la pantalla original de fecha-personas para compatibilidad con modificaciones
  if (currentScreen === 'fecha-personas') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    const weekDays = generateWeekDays();
    
    const isDayDisabled = (date) => {
      if (date.getDay() === 1) return true; // Lunes cerrado
      if (date > maxDate) return true;
      if (date < today) return true;
      return false;
    };
    
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={styles.spaceY6}>
          {/* Selección de fecha */}
          <div className={styles.formSection}>
            <div className={`${styles.flex} ${styles.justifyBetween} ${styles.itemsCenter} ${styles.mb2}`}>
              <label className={`${styles.block} ${styles.textSm} ${styles.fontMedium} ${styles.textGray200} ${styles.flex} ${styles.itemsCenter}`}>
                <Calendar size={18} className={`${styles.inlineBlock} ${styles.alignTextBottom} ${styles.mr2}`} />Fecha
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
                      comentarios: '' 
                    }
                  });
                }} 
                className={styles.backButtonStyled}
              >
                <ChevronLeft size={18} />
              </button>
            </div>
            <div className={styles.spaceY2}>
              <div className={`${styles.grid} ${styles.gridCols3} ${styles.gap3}`}>
                {weekDays.map((day) => {
                  const isSelected = reservaData.fecha && 
                    new Date(reservaData.fecha).toDateString() === day.date.toDateString();
                  
                  return (
                    <Button
                      key={day.dateString}
                      variant={isSelected ? "primary" : "secondary"}
                      size="lg"
                      data-date={day.dateString}
                      onClick={(e) => {
                        setReservaData({ ...reservaData, fecha: day.date });
                        e.currentTarget.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
                      }}
                      className={`${styles.flex} ${styles.flexCol} ${styles.itemsCenter} ${styles.py3}`}
                      type="button"
                    >
                      <span className={`${styles.textSm} ${styles.fontMedium}`}>{day.label}</span>
                      <span className={`${styles.textSm} ${styles.opacity75}`}>{formatDayDisplay(day.date)}</span>
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowDatePicker(true);
                  }}
                  leftIcon={<Calendar size={16} />}
                  className={`${styles.flex} ${styles.flexCol} ${styles.itemsCenter} ${styles.py3}`}
                >
                  + Fechas
                </Button>
              </div>
            </div>
          </div>

          {/* Selección de turno */}
          <div className={styles.formSection}>
            <label className={`${styles.block} ${styles.textSm} ${styles.fontMedium} ${styles.textGray200} ${styles.mb2} ${styles.flex} ${styles.itemsCenter}`}>
              <Clock size={20} className={`${styles.inlineBlock} ${styles.alignTextBottom} ${styles.mr2}`} />Turno
            </label>
            <div className={`${styles.grid} ${styles.gridCols2} ${styles.gap4}`}>
              <Button
                variant={reservaData.turno === 'mediodia' ? "primary" : "secondary"}
                size="lg"
                onClick={() => setReservaData({...reservaData, turno: 'mediodia'})}
                leftIcon={<Sun size={20} className={styles.textYellow200} />}
              >
                Mediodía
              </Button>
              <Button
                variant={reservaData.turno === 'noche' ? "primary" : "secondary"}
                size="lg"
                onClick={() => setReservaData({...reservaData, turno: 'noche'})}
                leftIcon={<Moon size={20} className={styles.textBlue300} />}
              >
                Noche
              </Button>
            </div>
          </div>

          {/* Selección de cantidad de personas */}
          <div className={styles.formSection}>
            <label className={`${styles.block} ${styles.textSm} ${styles.fontMedium} ${styles.textGray200} ${styles.mb2}`}>
              <Users size={20} className={`${styles.inlineBlock} ${styles.alignTextBottom} ${styles.mr2}`} />Cantidad de personas
            </label>
            <div className={`${styles.grid} ${styles.gridCols3} ${styles.gap2} ${styles.mb2}`}>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <Button
                  key={num}
                  variant={reservaData.personas === num ? "primary" : "secondary"}
                  size="lg"
                  onClick={() => setReservaData({ ...reservaData, personas: num })}
                  className={`${styles.py3} ${styles.textLg}`}
                >
                  {num}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const mensaje = `Hola, quiero hacer una reserva para ${reservaData.fecha ? formatDate(reservaData.fecha) : 'un día'} para 7 o más personas en el turno ${reservaData.turno === 'mediodia' ? 'mediodía' : 'noche'}`;
                const encodedMensaje = encodeURIComponent(mensaje);
                window.open(`https://wa.me/5492213995351?text=${encodedMensaje}`, '_blank');
              }}
              leftIcon={<MessageCircle size={18} />}
            >
              7+ personas
            </Button>
          </div>

          {/* Botón para consultar disponibilidad */}
          <Button 
            variant="primary"
            size="lg"
            onClick={handleDateAndTurnoSubmit} 
            disabled={!reservaData.personas}
            fullWidth
          >
            Consultar disponibilidad
          </Button>
        </div>

        {/* Modal del calendario completo */}
        {showDatePicker && (
          <div className={`${styles.fixed} ${styles.inset0} ${styles.bgBlack} ${styles.bgOpacity50} ${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.p4} ${styles.z50}`}>
            <div className={`${styles.bgBlack} ${styles.bgOpacity90} ${styles.backdropBlurSm} ${styles.roundedXl} ${styles.p4} ${styles.border} ${styles.borderWhite} ${styles.borderOpacity20} ${styles.shadow2xl} ${styles.maxWSm} ${styles.wFull} ${styles.mx4}`}>
              <div className={`${styles.flex} ${styles.justifyBetween} ${styles.itemsCenter} ${styles.mb4}`}>
                <h2 className={`${styles.textXl} ${styles.textWhite} ${styles.fontMedium}`}>Seleccionar fecha</h2>
                <button 
                  onClick={() => setShowDatePicker(false)} 
                  className={`${styles.textWhite} ${styles.hoverTextGray300}`}
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
        <div className={styles.enhancedScreenContainer}>
          {/* Progress Indicator */}
          <ProgressIndicator currentStep="personas" />
          
          {/* Header con botón volver y título */}
          <div className={styles.enhancedSectionHeader}>
            <div className={styles.enhancedSectionTitle}>
              <Clock size={24} />
              Horarios disponibles
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentScreen(reservaData.isModifying ? 'fecha-personas' : 'personas-disponibilidad')}
              leftIcon={<ChevronLeft size={18} />}
              className={styles.backButtonStyled}
            />
          </div>

          {/* Información contextual */}
          <Card variant="glass" padding="md" className={styles.mb4}>
            <div className={`${styles.textCenter} ${styles.spaceY2}`}>
              <p className={`${styles.textSm} ${styles.textGray200} ${styles.opacity90}`}>
                Disponibilidad para {formatDate(reservaData.fecha)}
              </p>
              <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyCenter} ${styles.gap2}`}>
                {reservaData.turno === 'mediodia' ? (
                  <Sun size={20} className={styles.textYellow200} />
                ) : (
                  <Moon size={20} className={styles.textBlue300} />
                )}
                <span className={`${styles.textBase} ${styles.fontMedium} ${styles.textWhite}`}>
                  Turno {reservaData.turno === 'mediodia' ? 'mediodía' : 'noche'}
                </span>
              </div>
              <p className={`${styles.textSm} ${styles.textGray400}`}>
                {reservaData.personas} {reservaData.personas === 1 ? 'persona' : 'personas'}
              </p>
            </div>
          </Card>

          {/* Grid de horarios o mensaje de sin disponibilidad */}
          {availableSlots.length > 0 ? (
            <div className={`${styles.grid} ${styles.gridCols2} ${styles.gap3} ${styles.mb6}`}>
              {availableSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={reservaData.horario === slot ? "primary" : "secondary"}
                  size="lg"
                  onClick={() => handleHorarioSelect(slot)}
                  className={`${styles.py3} ${styles.textLg}`}
                >
                  {slot}
                </Button>
              ))}
            </div>
          ) : (
            <Card variant="glass" padding="lg" className={`${styles.textCenter} ${styles.py3}`}>
              <AlertCircle className={`${styles.mx4} ${styles.mb4} ${styles.textGray400}`} size={48} />
              <h3 className={`${styles.textLg} ${styles.fontMedium} ${styles.textWhite} ${styles.mb2}`}>
                Sin horarios disponibles
              </h3>
              <p className={`${styles.textSm} ${styles.textGray200} ${styles.mb4}`}>
                No encontramos cupos libres para esta fecha y turno.
              </p>
              <Button 
                variant="outline" 
                size="md"
                onClick={() => setCurrentScreen(reservaData.isModifying ? 'fecha-personas' : 'personas-disponibilidad')}
                leftIcon={<ChevronLeft size={16} />}
              >
                Volver a seleccionar
              </Button>
            </Card>
          )}
        </div>
      </ClientLayout>
    );
  }

  if (currentScreen === 'contacto') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={styles.enhancedScreenContainer}>
          {/* Progress Indicator */}
          <ProgressIndicator currentStep="contacto" />
          
          {/* Header con botón volver y título */}
          <div className={styles.enhancedSectionHeader}>
            <div className={styles.enhancedSectionTitle}>
              <User size={24} />
              {reservaData.willGoToWaitingList ? 'Lista de Espera' : 'Datos de contacto'}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentScreen('horario')}
              leftIcon={<ChevronLeft size={18} />}
              className={styles.backButtonStyled}
            />
          </div>

          {/* Información contextual de la reserva */}
          <Card variant="glass" padding="md" className={styles.mb4}>
            <div className={`${styles.flex} ${styles.justifyBetween} ${styles.itemsCenter} ${styles.mb3}`}>
              <div>
                <p className={`${styles.textSm} ${styles.textGray200} ${styles.opacity90}`}>
                  {formatDate(reservaData.fecha)} • {reservaData.horario}
                </p>
                <p className={`${styles.textBase} ${styles.fontMedium} ${styles.textWhite}`}>
                  {reservaData.personas} {reservaData.personas === 1 ? 'persona' : 'personas'}
                </p>
              </div>
              <div className={`${styles.flex} ${styles.itemsCenter} ${styles.gap2}`}>
                {reservaData.turno === 'mediodia' ? (
                  <Sun size={18} className={styles.textYellow200} />
                ) : (
                  <Moon size={18} className={styles.textBlue300} />
                )}
              </div>
            </div>
          </Card>

          {/* Alerta para lista de espera */}
          {reservaData.willGoToWaitingList && (
            <Card variant="gradient" padding="md" className={styles.mb4}>
              <div className={`${styles.flex} ${styles.itemsCenter} ${styles.gap3}`}>
                <AlertCircle size={20} className={styles.textYellow200} />
                <div>
                  <p className={`${styles.textSm} ${styles.fontMedium} ${styles.textWhite}`}>
                    No hay cupos disponibles
                  </p>
                  <p className={`${styles.textXs} ${styles.textGray200} ${styles.opacity90}`}>
                    Te avisaremos por WhatsApp si se libera un lugar
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Formulario en Card */}
          <Card variant="glass" padding="lg">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (reservaData.isModifying) {
                handleModificationSubmit();
              } else {
                handleContactoSubmit();
              }
            }} className={styles.spaceY6}>
              
              {/* Campo Nombre */}
              <div>
                <label className={`${styles.block} ${styles.textSm} ${styles.fontMedium} ${styles.textGray200} ${styles.mb2} ${styles.flex} ${styles.itemsCenter}`}>
                  <User size={16} className={styles.mr2} />
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={reservaData.cliente.nombre}
                  onChange={(e) => setReservaData({
                    ...reservaData,
                    cliente: {...reservaData.cliente, nombre: e.target.value}
                  })}
                  className={styles.input}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              {/* Campo Teléfono */}
              <div>
                <div className={`${styles.flex} ${styles.itemsCenter} ${styles.justifyBetween} ${styles.mb2}`}>
                  <label className={`${styles.block} ${styles.textSm} ${styles.fontMedium} ${styles.textGray200} ${styles.flex} ${styles.itemsCenter}`}>
                    <Phone size={16} className={styles.mr2} />
                    Teléfono (WhatsApp)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPhoneHelp(!showPhoneHelp)}
                    leftIcon={<AlertCircle size={14} />}
                    className={`${styles.textXs} ${styles.textGray400}`}
                  >
                    Ayuda
                  </Button>
                </div>
                
                <PhoneInput
                  value={reservaData.cliente.telefono}
                  onChange={(value) => setReservaData({
                    ...reservaData,
                    cliente: {...reservaData.cliente, telefono: value || ''}
                  })}
                  className={`${styles.input} ${styles.phoneInputField}`}
                  placeholder="Ingresa tu número de WhatsApp"
                  required
                  isValid={
                    reservaData.cliente.telefono ? 
                      (isValidPhoneNumber(reservaData.cliente.telefono) ? true : false)
                      : null
                  }
                />

                {/* Ayuda contextual */}
                {showPhoneHelp && (
                  <Card variant="elevated" padding="sm" className={styles.mt2}>
                    <p className={`${styles.textBlue300} ${styles.textSm} ${styles.fontMedium} ${styles.mb2}`}>
                      💡 Consejos:
                    </p>
                    <ul className={`${styles.textBlue200} ${styles.textXs} ${styles.spaceY2}`}>
                      <li>• Selecciona tu país en el selector</li>
                      <li>• Ingresa solo números móviles con WhatsApp</li>
                      <li>• Sin el 0 inicial ni el 15 para Argentina</li>
                    </ul>
                  </Card>
                )}

                {/* Indicador de número válido */}
                {reservaData.cliente.telefono && isValidPhoneNumber(reservaData.cliente.telefono) && (
                  <p className={`${styles.mt1} ${styles.textSm} ${styles.textGreen400} ${styles.flex} ${styles.itemsCenter}`}>
                    <Check size={14} className={styles.mr1} />
                    Número válido para WhatsApp
                  </p>
                )}
              </div>

              {/* Campo Comentarios */}
              <div>
                <label className={`${styles.block} ${styles.textSm} ${styles.fontMedium} ${styles.textGray200} ${styles.mb2} ${styles.flex} ${styles.itemsCenter}`}>
                  <MessageCircle size={16} className={styles.mr2} />
                  Aclaraciones (opcional)
                </label>
                <textarea
                  value={reservaData.cliente.comentarios}
                  onChange={(e) => setReservaData({
                    ...reservaData,
                    cliente: {...reservaData.cliente, comentarios: e.target.value}
                  })}
                  className={styles.textarea}
                  placeholder="Ej: Alergias, preferencias de mesa, ocasión especial, etc."
                  rows={3}
                />
              </div>

              {/* Botón de envío */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={
                  !reservaData.cliente.nombre || 
                  !reservaData.cliente.telefono || 
                  !isValidPhoneNumber(reservaData.cliente.telefono || '') ||
                  reservaData.cliente.nombre.length < 2
                }
                rightIcon={<Check size={20} />}
              >
                {reservaData.isModifying ? 'Guardar cambios' : (reservaData.willGoToWaitingList ? 'Agregar a lista de espera' : 'Confirmar reserva')}
              </Button>
            </form>
          </Card>
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
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleCancelReservation(reservaData)}
              leftIcon={<X size={18} />}
              fullWidth
            >
              Cancelar tu reserva
            </Button>
            
            <Button 
              variant="primary"
              size="lg"
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
              leftIcon={<Check size={20} />}
              fullWidth
            >
              Continuar
            </Button>
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
              Si se libera un cupo para tu fecha y turno, te enviaremos un mensaje de WhatsApp al número {reservaData.cliente.telefono} para que confirmes tu reserva.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const mensaje = `Hola! Me comunico por mi solicitud en lista de espera #${reservaData.waitingId} para el día ${formatDate(reservaData.fecha)} turno ${reservaData.turno === 'mediodia' ? 'mediodía' : 'noche'}`;
                window.open(`https://wa.me/5492213995351?text=${encodeURIComponent(mensaje)}`, '_blank');
              }}
              leftIcon={<MessageCircle size={18} />}
              fullWidth
            >
              Contactanos por WhatsApp
            </Button>
            
            <Button 
              variant="primary"
              size="lg"
              onClick={() => {
                setCurrentScreen('landing');
                setReservaData({
                  fecha: '',
                  personas: 2,
                  turno: '',
                  horario: '',
                  cliente: { nombre: '', telefono: '', comentarios: '' }
                });
                setShowWaitingListModal(false);
              }}
              leftIcon={<Check size={20} />}
              fullWidth
            >
              Continuar
            </Button>
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