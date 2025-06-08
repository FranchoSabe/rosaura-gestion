import React, { useState } from 'react';
import { Calendar, Clock, Users, Phone, Mail, MessageCircle, ChevronLeft, Check, AlertCircle, User, Sun, Moon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import "../datepicker-custom.css";

const ReservationFlowLayout = ({ children, BACKGROUND_IMAGE_URL }) => (
    <div className="min-h-screen bg-cover bg-center text-white relative" style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }}>
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="relative z-10 flex justify-center items-start pt-16 sm:pt-24 min-h-screen px-4">
        <div className="w-full max-w-md bg-black bg-opacity-20 backdrop-blur-lg rounded-xl p-6 sm:p-8 border border-white border-opacity-20">
          {children}
        </div>
      </div>
    </div>
);

export const ClientView = ({ 
    LOGO_URL, BACKGROUND_IMAGE_URL, 
    reservaData, setReservaData, 
    currentScreen, setCurrentScreen, 
    availableSlots,
    showConfirmation, setShowConfirmation,
    onAdminClick,
    handleDateAndTurnoSubmit, handleHorarioSelect, handleContactoSubmit, 
    formatDate 
}) => {

  if (currentScreen === 'landing') {
    return (
      <div className="min-h-screen bg-cover bg-center text-white relative" style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 min-h-screen flex flex-col justify-center items-center px-4 text-center">
          <div className="mb-8">{LOGO_URL ? <img src={LOGO_URL} alt="Rosaura Logo" className="h-24 mx-auto" /> : <h1 className="text-4xl md:text-6xl font-bold mb-2" style={{ fontFamily: 'cursive' }}>Rosaura</h1>}</div>
          <div className="mb-12 max-w-md">
            <p className="text-xl mb-8">Bienvenido al portal de reservas de Rosaura</p>
            <button onClick={() => setCurrentScreen('fecha-personas')} className={mainButtonClass}>Hacé tu reserva</button>
            <button onClick={() => window.open('https://wa.me/5492213995351', '_blank')} className={secondaryButtonClass}><MessageCircle size={20} />Comunicate con nosotros por WhatsApp</button>
          </div>
          <button onClick={onAdminClick} className={adminButtonClass}>Admin</button>
        </div>
      </div>
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
      <ReservationFlowLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('landing')} className="text-gray-200 hover:text-white hover:border-[#0c4900] mr-4 border-2 border-transparent rounded-lg p-1 transition-all"><ChevronLeft size={24} /></button>
          <h1 className="text-2xl font-bold text-white">Tu Reserva</h1>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2"><Calendar size={16} className="inline mr-2" />Fecha</label>
            <DatePicker
              selected={reservaData.fecha ? new Date(reservaData.fecha) : null}
              onChange={date => setReservaData({ ...reservaData, fecha: date ? date.toISOString().split('T')[0] : '' })}
              minDate={today}
              maxDate={maxDate}
              filterDate={date => !isDayDisabled(date)}
              placeholderText="Seleccionar fecha"
              dateFormat="yyyy-MM-dd"
              calendarClassName="custom-green-calendar"
              dayClassName={date =>
                isDayDisabled(date)
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : reservaData.fecha && new Date(reservaData.fecha).toDateString() === date.toDateString()
                    ? 'bg-white text-black border-white'
                    : 'text-[#0c4900] hover:bg-[#0c4900]/10 hover:text-[#0c4900] font-semibold rounded-full transition-colors'
              }
              popperPlacement="bottom"
              customInput={
                <button
                  className={`w-full p-3 rounded-lg border-2 flex items-center justify-between transition-all ${reservaData.fecha ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-200 hover:border-[#0c4900] hover:text-white'}`}
                  type="button"
                >
                  <span>{reservaData.fecha ? formatDate(reservaData.fecha) : 'Seleccionar fecha'}</span>
                  <Calendar size={18} className="ml-2" />
                </button>
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Turno</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setReservaData({...reservaData, turno: 'mediodia'})} 
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                  reservaData.turno === 'mediodia' 
                    ? 'bg-white text-black border-white hover:border-[#0c4900]' 
                    : 'border-gray-600 text-gray-200 hover:border-[#0c4900] hover:text-white'
                }`}
              >
                <Sun size={18}/> Mediodía
              </button>
              <button 
                onClick={() => setReservaData({...reservaData, turno: 'noche'})} 
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                  reservaData.turno === 'noche' 
                    ? 'bg-white text-black border-white hover:border-[#0c4900]' 
                    : 'border-gray-600 text-gray-200 hover:border-[#0c4900] hover:text-white'
                }`}
              >
                <Moon size={18}/> Noche
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2"><Users size={16} className="inline mr-2" />Cantidad de personas</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => setReservaData({ ...reservaData, personas: num })}
                  className={`p-3 rounded-lg border-2 flex items-center justify-center transition-all ${
                    reservaData.personas === num 
                      ? 'bg-white text-black border-white hover:border-[#0c4900]' 
                      : 'border-gray-600 text-gray-200 hover:border-[#0c4900] hover:text-white'
                  }`}
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
              className="w-full p-3 rounded-lg border-2 border-gray-600 text-gray-200 hover:border-[#0c4900] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              <span>7+</span>
            </button>
          </div>
          <button 
            onClick={handleDateAndTurnoSubmit} 
            disabled={!reservaData.personas || !reservaData.fecha || !reservaData.turno}
            className="w-full bg-[#0c4900] hover:bg-green-900 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Consultar disponibilidad
          </button>
        </div>
      </ReservationFlowLayout>
    );
  }
  
  // --- PANTALLA DE HORARIO ---
  if (currentScreen === 'horario') {
    return (
      <ReservationFlowLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('fecha-personas')} className="text-gray-200 hover:text-white hover:border-[#0c4900] mr-4 border-2 border-transparent rounded-lg p-1 transition-all"><ChevronLeft size={24} /></button>
          <h1 className="text-2xl font-bold text-white">Horario</h1>
        </div>
        <div className="space-y-4">
          <p className="text-center text-gray-200">Horarios disponibles para el {formatDate(reservaData.fecha)} - Turno {reservaData.turno === 'mediodia' ? 'mediodía' : 'noche'}</p>
          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {availableSlots.map((slot) => (
                <button 
                  key={slot} 
                  onClick={() => handleHorarioSelect(slot)}
                  className={`p-4 rounded-lg border-2 ${
                    reservaData.horario === slot 
                      ? 'bg-white text-black border-white hover:border-[#0c4900]' 
                      : 'border-gray-600 text-gray-200 hover:border-[#0c4900] hover:text-white'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto mb-4" size={48} />
              <p>No hay horarios disponibles para esta fecha y turno.</p>
              <button onClick={() => setCurrentScreen('fecha-personas')} className="mt-4 text-gray-200 hover:text-white border-2 border-transparent hover:border-[#0c4900] rounded-lg px-4 py-2 transition-all">Volver a seleccionar fecha</button>
            </div>
          )}
        </div>
      </ReservationFlowLayout>
    );
  }

  // --- PANTALLA DE CONTACTO ---
  if (currentScreen === 'contacto') {
    return (
      <ReservationFlowLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('horario')} className="text-gray-200 hover:text-white hover:border-[#0c4900] mr-4 border-2 border-transparent rounded-lg p-1 transition-all"><ChevronLeft size={24} /></button>
          <h1 className="text-2xl font-bold text-white">Tus datos</h1>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              <User size={16} className="inline mr-2" />Nombre completo
            </label>
            <input
              type="text"
              value={reservaData.cliente.nombre}
              onChange={(e) => setReservaData({
                ...reservaData,
                cliente: {...reservaData.cliente, nombre: e.target.value}
              })}
              className="w-full p-3 bg-white border border-[#0c4900] rounded-lg text-[#0c4900] placeholder-[#0c4900]/50 focus:border-[#0c4900] focus:ring-2 focus:ring-[#0c4900] focus:outline-none"
              placeholder="Tu nombre"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              <Phone size={16} className="inline mr-2" />Teléfono (WhatsApp)
            </label>
            <div className="flex gap-2">
              <select
                value={reservaData.cliente.codigoPais || '54'}
                onChange={(e) => setReservaData({
                  ...reservaData,
                  cliente: {...reservaData.cliente, codigoPais: e.target.value}
                })}
                className="w-24 p-3 bg-white border border-[#0c4900] rounded-lg text-[#0c4900] focus:border-[#0c4900] focus:ring-2 focus:ring-[#0c4900] focus:outline-none"
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
                  // Solo permitir números
                  const value = e.target.value.replace(/\D/g, '');
                  // Limitar a 15 dígitos (incluyendo código de área)
                  if (value.length <= 15) {
                    setReservaData({
                      ...reservaData,
                      cliente: {...reservaData.cliente, telefono: value}
                    });
                  }
                }}
                pattern="[0-9]*"
                inputMode="numeric"
                className="flex-1 p-3 bg-white border border-[#0c4900] rounded-lg text-[#0c4900] placeholder-[#0c4900]/50 focus:border-[#0c4900] focus:ring-2 focus:ring-[#0c4900] focus:outline-none"
                placeholder="221 1234567"
              />
            </div>
            <p className="mt-1 text-sm text-gray-200">Ingresá el número sin el 0 inicial ni el 15</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              <MessageCircle size={16} className="inline mr-2" />Aclaraciones (opcional)
            </label>
            <textarea
              value={reservaData.cliente.comentarios}
              onChange={(e) => setReservaData({
                ...reservaData,
                cliente: {...reservaData.cliente, comentarios: e.target.value}
              })}
              className="w-full p-3 bg-white border border-[#0c4900] rounded-lg text-[#0c4900] placeholder-[#0c4900]/50 focus:border-[#0c4900] focus:ring-2 focus:ring-[#0c4900] focus:outline-none min-h-[100px] resize-none"
              placeholder="Ej: Alergias, preferencias de mesa, ocasión especial, etc."
            />
          </div>
          
          <button
            onClick={handleContactoSubmit}
            disabled={!reservaData.cliente.nombre || !reservaData.cliente.telefono || reservaData.cliente.telefono.length < 8}
            className="w-full bg-[#0c4900] hover:bg-green-900 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Confirmar reserva
          </button>
        </div>
      </ReservationFlowLayout>
    );
  }

  // --- PANTALLA DE CONFIRMACIÓN ---
  if (currentScreen === 'confirmacion') {
    return (
      <ReservationFlowLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="text-center py-8">
          <Check className="mx-auto mb-6 text-green-500" size={64} />
          <h1 className="text-2xl font-bold mb-4">¡Reserva confirmada!</h1>
          <div className="bg-black bg-opacity-30 rounded-lg p-6 mb-6 text-left">
            <p className="mb-2"><strong>Fecha:</strong> {formatDate(reservaData.fecha)}</p>
            <p className="mb-2"><strong>Turno:</strong> {reservaData.turno === 'mediodia' ? 'Mediodía' : 'Noche'}</p>
            <p className="mb-2"><strong>Horario:</strong> {reservaData.horario}</p>
            <p className="mb-2"><strong>Personas:</strong> {reservaData.personas}</p>
            <p className="mb-2"><strong>Nombre:</strong> {reservaData.cliente.nombre}</p>
            <p className="mb-2"><strong>Teléfono:</strong> {reservaData.cliente.telefono}</p>
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
            className="w-full bg-[#0c4900] hover:bg-green-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </ReservationFlowLayout>
    );
  }
  
  return <div>Cargando...</div>
};

// Cambiar clases de botones principales y secundarios
// Botón principal
const mainButtonClass = "w-full bg-[#0c4900] hover:bg-[#0c4900] hover:border-2 hover:border-white text-white font-semibold py-4 px-8 rounded-lg text-lg mb-4 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0c4900] focus:ring-offset-2";
// Botón secundario
const secondaryButtonClass = "w-full border-2 border-gray-600 text-gray-200 hover:border-[#0c4900] hover:text-white font-semibold py-4 px-8 rounded-lg text-lg flex items-center justify-center gap-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0c4900] focus:ring-offset-2";
// Botón admin
const adminButtonClass = "absolute bottom-4 text-sm opacity-50 hover:opacity-100 text-gray-200 hover:text-[#0c4900] border-2 border-transparent hover:border-[#0c4900] rounded-lg px-2 py-1 transition-all";