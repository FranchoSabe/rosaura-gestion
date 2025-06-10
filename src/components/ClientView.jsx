import React, { useState } from 'react';
import { Calendar, Clock, Users, Phone, Mail, MessageCircle, ChevronLeft, Check, AlertCircle, User, Sun, Moon, Search, X, Edit2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import "../datepicker-custom.css";
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

export const ClientView = ({ 
    LOGO_URL, BACKGROUND_IMAGE_URL,
    onAdminClick,
    currentScreen, setCurrentScreen,
    reservaData, setReservaData,
    availableSlots,
    showConfirmation, setShowConfirmation,
    handleDateAndTurnoSubmit, handleHorarioSelect, handleContactoSubmit,
    formatDate,
    handleSearchReservation, handleDeleteReservation
}) => {

  const [showSearchForm, setShowSearchForm] = useState(false);
  const [foundReservation, setFoundReservation] = useState(null);
  const [isModifying, setIsModifying] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState(null);

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

  if (currentScreen === 'landing') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow">
            <div className="mt-8 mb-8 bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-2xl">
              <div className="text-center mb-6">
                <p className="text-xl text-white font-medium">Bienvenido al portal de reservas de</p>
              </div>
              <div className="flex justify-center">
                {LOGO_URL ? <img src={LOGO_URL} alt="Rosaura Logo" className="h-60" /> : <h1 className="text-4xl md:text-6xl font-bold mb-2" style={{ fontFamily: 'cursive' }}>Rosaura</h1>}
              </div>
            </div>
            <div className="space-y-4 mb-4">
              <button onClick={() => setCurrentScreen('fecha-personas')} className={styles.mainButton}>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-2xl max-w-md w-full">
              <SearchReservationForm
                onSearch={handleSearch}
                onClose={() => setShowSearchForm(false)}
              />
            </div>
          </div>
        )}

        {foundReservation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-2xl max-w-md w-full">
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
    const isDayDisabled = (date) => {
      if (date.getDay() === 1) return true;
      if (date > maxDate) return true;
      if (date < today) return true;
      return false;
    };
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="mb-6">
          <button onClick={() => {
            setCurrentScreen('landing');
            setReservaData({
              fecha: '',
              personas: null,
              turno: '',
              horario: '',
              cliente: { 
                nombre: '', 
                telefono: '', 
                codigoPais: '54',
                comentarios: '' 
              }
            });
          }} className={styles.backButton}><ChevronLeft size={16} /></button>
          <h1 className="text-xl font-bold text-white inline-block">Seleccionar fecha</h1>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              <Calendar size={20} className="inline-block align-text-bottom mr-2" />Fecha
            </label>
            <div className={styles.dateContainer}>
              <DatePicker
                selected={reservaData.fecha ? new Date(reservaData.fecha) : null}
                onChange={date => setReservaData({ ...reservaData, fecha: date })}
                minDate={today}
                maxDate={maxDate}
                filterDate={date => !isDayDisabled(date)}
                placeholderText="Seleccionar fecha"
                dateFormat="yyyy-MM-dd"
                popperPlacement="bottom"
                calendarClassName="custom-green-calendar"
                customInput={
                  <button
                    className={reservaData.fecha ? styles.dateButtonSelected : styles.dateButtonUnselected}
                    type="button"
                  >
                    <span>{reservaData.fecha ? formatDate(reservaData.fecha) : 'Seleccionar fecha'}</span>
                  </button>
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              <Clock size={20} className="inline-block align-text-bottom mr-2" />Turno
            </label>
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
          <div>
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
          <button 
            onClick={handleDateAndTurnoSubmit} 
            disabled={!reservaData.personas || !reservaData.fecha || !reservaData.turno}
            className={styles.mainButton}
          >
            Consultar disponibilidad
          </button>
        </div>
      </ClientLayout>
    );
  }
  
  if (currentScreen === 'horario') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
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
            <h1 className={styles.title}>Datos de contacto</h1>
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
                {reservaData.isModifying ? 'Guardar cambios' : 'Confirmar reserva'}
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
            <p className="text-xl text-white opacity-80 font-medium">Tu reserva fue confirmada</p>
            <p className="text-5xl font-bold text-white my-2">{reservaData.reservationId}</p>
          </div>
          
          <div className="bg-green-600 bg-opacity-60 p-3 rounded-xl border border-green-400 border-opacity-80 shadow-lg">
            <p className="text-lg text-white font-bold text-center mb-2">
              ¡Importante! Con este código puedes:
            </p>
            <div className="space-y-1">
              <div className="w-full text-base text-white opacity-80 flex items-center justify-center gap-2 py-1 px-3">
                <Search size={18} />
                Consultar tu reserva
              </div>
              <button
                onClick={() => handleCancelReservation(reservaData)}
                className="w-full text-base text-white opacity-80 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 py-1 px-3 rounded-lg hover:bg-white hover:bg-opacity-10"
              >
                <X size={18} />
                Cancelar tu reserva
              </button>
            </div>
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
      </ClientLayout>
    );
  }
  
  return <div>Cargando...</div>
};