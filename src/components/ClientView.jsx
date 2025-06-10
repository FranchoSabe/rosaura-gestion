import React, { useState } from 'react';
import { Calendar, Clock, Users, Phone, Mail, MessageCircle, ChevronLeft, Check, AlertCircle, User, Sun, Moon, Search, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import "../datepicker-custom.css";
import ClientLayout from './ClientLayout';
import styles from './ClientView.module.css';

const SearchReservationForm = ({ onSearch, onClose }) => {
  const [searchData, setSearchData] = useState({
    nombre: '',
    telefono: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Buscar mi reserva</h2>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            <User size={20} className="inline-block align-text-bottom mr-2" />Nombre completo
          </label>
          <input
            type="text"
            value={searchData.nombre}
            onChange={(e) => setSearchData({ ...searchData, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ingresa tu nombre"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            <Phone size={20} className="inline-block align-text-bottom mr-2" />Teléfono
          </label>
          <input
            type="tel"
            value={searchData.telefono}
            onChange={(e) => setSearchData({ ...searchData, telefono: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ingresa tu teléfono"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-150"
        >
          <Search size={20} className="inline-block align-text-bottom mr-2" />
          Buscar Reserva
        </button>
      </form>
    </div>
  );
};

const ReservationDetails = ({ reservation, onClose, formatDate }) => {
  const getWhatsAppCancelMessage = (reserva) => {
    const fecha = formatDate(reserva.fecha);
    const mensaje = `Hola! Quisiera cancelar mi reserva para el día ${fecha} a las ${reserva.horario} hs a nombre de ${reserva.cliente.nombre}`;
    return encodeURIComponent(mensaje);
  };

  const getWhatsAppModifyMessage = (reserva) => {
    const fecha = formatDate(reserva.fecha);
    const mensaje = `Hola! Quisiera modificar mi reserva para el día ${fecha} a las ${reserva.horario} hs a nombre de ${reserva.cliente.nombre}`;
    return encodeURIComponent(mensaje);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Detalles de la Reserva</h2>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          <X size={24} />
        </button>
      </div>
      <div className="bg-white rounded-lg p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500">Nombre</p>
          <p className="font-medium">{reservation.cliente.nombre}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Fecha</p>
          <p className="font-medium">{formatDate(reservation.fecha)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Horario</p>
          <p className="font-medium">{reservation.horario}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Personas</p>
          <p className="font-medium">{reservation.personas}</p>
        </div>
        <div className="pt-4 space-y-2">
          <a
            href={`https://wa.me/5492213995351?text=${getWhatsAppModifyMessage(reservation)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            Solicitar Modificación
          </a>
          <a
            href={`https://wa.me/5492213995351?text=${getWhatsAppCancelMessage(reservation)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <X size={20} />
            Solicitar Cancelación
          </a>
        </div>
      </div>
    </div>
  );
};

export const ClientView = ({ 
    LOGO_URL, BACKGROUND_IMAGE_URL, 
    reservaData, setReservaData, 
    currentScreen, setCurrentScreen, 
    availableSlots,
    showConfirmation, setShowConfirmation,
    onAdminClick,
    handleDateAndTurnoSubmit, handleHorarioSelect, handleContactoSubmit,
    formatDate,
    onSearchReservation 
}) => {

  const [showSearchForm, setShowSearchForm] = useState(false);
  const [foundReservation, setFoundReservation] = useState(null);

  const handleSearch = async (searchData) => {
    const result = await onSearchReservation(searchData);
    if (result) {
      setFoundReservation(result);
    } else {
      alert('No se encontró ninguna reserva con los datos proporcionados.');
    }
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
                onChange={date => setReservaData({ ...reservaData, fecha: date ? date.toISOString().split('T')[0] : '' })}
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
                <Sun size={20} className="inline-block align-text-bottom" /> Mediodía
              </button>
              <button 
                onClick={() => setReservaData({...reservaData, turno: 'noche'})} 
                className={reservaData.turno === 'noche' ? styles.turnoButtonSelected : styles.turnoButtonUnselected}
              >
                <Moon size={20} className="inline-block align-text-bottom" /> Noche
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
        <div className="mb-6">
          <button onClick={() => setCurrentScreen('horario')} className={styles.backButton}><ChevronLeft size={16} /></button>
          <h1 className="text-xl font-bold text-white inline-block">Datos de reserva</h1>
        </div>
        <div className="space-y-4">
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
            onClick={handleContactoSubmit}
            disabled={!reservaData.cliente.nombre || !reservaData.cliente.telefono || reservaData.cliente.telefono.length < 8}
            className={styles.mainButton}
          >
            Confirmar reserva
          </button>
        </div>
      </ClientLayout>
    );
  }

  if (currentScreen === 'confirmacion') {
    return (
      <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className={styles.confirmationContainer}>
          <Check className={styles.confirmationIcon} size={64} />
          <h1 className={styles.confirmationTitle}>¡Reserva confirmada!</h1>
          <div className={styles.confirmationDetails}>
            <p className={styles.confirmationDetail}><strong>Fecha:</strong> {formatDate(reservaData.fecha)}</p>
            <p className={styles.confirmationDetail}><strong>Turno:</strong> {reservaData.turno === 'mediodia' ? 'Mediodía' : 'Noche'}</p>
            <p className={styles.confirmationDetail}><strong>Horario:</strong> {reservaData.horario}</p>
            <p className={styles.confirmationDetail}><strong>Personas:</strong> {reservaData.personas}</p>
            <p className={styles.confirmationDetail}><strong>Nombre:</strong> {reservaData.cliente.nombre}</p>
            <p className={styles.confirmationDetail}><strong>Teléfono:</strong> {reservaData.cliente.telefono}</p>
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
            }} 
            className={styles.mainButton}
          >
            Volver al inicio
          </button>
        </div>
      </ClientLayout>
    );
  }
  
  return <div>Cargando...</div>
};