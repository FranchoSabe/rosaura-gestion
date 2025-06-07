import React from 'react';
import { Calendar, Clock, Users, Phone, Mail, MessageCircle, ChevronLeft, Check, AlertCircle, User, Sun, Moon } from 'lucide-react';

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
    setIsAdmin,
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
            <button onClick={() => setCurrentScreen('fecha-personas')} className="w-full bg-green-700 hover:bg-green-800 font-semibold py-4 px-8 rounded-lg text-lg mb-4 transition-colors">Hacé tu reserva</button>
            <button onClick={() => window.open('https://wa.me/5491123456789', '_blank')} className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-4 px-8 rounded-lg text-lg flex items-center justify-center gap-2 transition-colors"><MessageCircle size={20} />Comunicate con nosotros por WhatsApp</button>
          </div>
          <button onClick={() => setIsAdmin(true)} className="absolute bottom-4 text-sm opacity-50 hover:opacity-100">Admin</button>
        </div>
      </div>
    );
  }

  if (currentScreen === 'fecha-personas') {
    return (
      <ReservationFlowLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('landing')} className="text-gray-200 hover:text-white mr-4"><ChevronLeft size={24} /></button>
          <h1 className="text-2xl font-bold text-white">Tu Reserva</h1>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2"><Calendar size={16} className="inline mr-2" />Fecha</label>
            <input type="date" value={reservaData.fecha} onChange={(e) => setReservaData({ ...reservaData, fecha: e.target.value })} className="w-full p-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white appearance-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Turno</label>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setReservaData({...reservaData, turno: 'mediodia'})} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${reservaData.turno === 'mediodia' ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-200 hover:bg-white hover:bg-opacity-10'}`}><Sun size={18}/> Mediodía</button>
              <button onClick={() => setReservaData({...reservaData, turno: 'noche'})} className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${reservaData.turno === 'noche' ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-200 hover:bg-white hover:bg-opacity-10'}`}><Moon size={18}/> Noche</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2"><Users size={16} className="inline mr-2" />Cantidad de personas</label>
            <select value={reservaData.personas} onChange={(e) => setReservaData({ ...reservaData, personas: parseInt(e.target.value) })} className="w-full p-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white">
                {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num} className="bg-gray-800">{num} persona{num > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <button onClick={handleDateAndTurnoSubmit} className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors">Consultar disponibilidad</button>
        </div>
      </ReservationFlowLayout>
    );
  }
  
  // --- PANTALLA DE HORARIO ---
  if (currentScreen === 'horario') {
    return (
      <ReservationFlowLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentScreen('fecha-personas')} className="text-gray-200 hover:text-white mr-4"><ChevronLeft size={24} /></button>
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
                  className={`p-4 rounded-lg border-2 ${reservaData.horario === slot ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-200 hover:bg-white hover:bg-opacity-10'}`}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto mb-4" size={48} />
              <p>No hay horarios disponibles para esta fecha y turno.</p>
              <button onClick={() => setCurrentScreen('fecha-personas')} className="mt-4 text-blue-400 hover:text-blue-300">Volver a seleccionar fecha</button>
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
          <button onClick={() => setCurrentScreen('horario')} className="text-gray-200 hover:text-white mr-4"><ChevronLeft size={24} /></button>
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
              className="w-full p-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white"
              placeholder="Tu nombre"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              <Phone size={16} className="inline mr-2" />Teléfono
            </label>
            <input
              type="tel"
              value={reservaData.cliente.telefono}
              onChange={(e) => setReservaData({
                ...reservaData,
                cliente: {...reservaData.cliente, telefono: e.target.value}
              })}
              className="w-full p-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white"
              placeholder="11 2345-6789"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              <Mail size={16} className="inline mr-2" />Email (opcional)
            </label>
            <input
              type="email"
              value={reservaData.cliente.email}
              onChange={(e) => setReservaData({
                ...reservaData,
                cliente: {...reservaData.cliente, email: e.target.value}
              })}
              className="w-full p-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white"
              placeholder="tu@email.com"
            />
          </div>
          
          <button
            onClick={handleContactoSubmit}
            disabled={!reservaData.cliente.nombre || !reservaData.cliente.telefono}
            className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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
                cliente: { nombre: '', telefono: '', email: '', comentarios: '' }
              });
            }} 
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </ReservationFlowLayout>
    );
  }
  
  return <div>Cargando...</div>
};