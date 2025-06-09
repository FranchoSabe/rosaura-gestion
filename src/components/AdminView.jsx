// src/components/AdminView.jsx

import React, { useState } from 'react';
import { ChevronDown, ThumbsDown, MessageCircle, Check } from 'lucide-react';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Componente reutilizable para las tablas de reservas
const ReservationsTable = ({ reservations, onSetBlacklist }) => {

    const isPastReservation = (fecha, horario) => {
        const now = new Date();
        const reservaDateTime = new Date(`${fecha}T${horario}`);
        return reservaDateTime < now;
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {reservations.length > 0 ? reservations.map(reserva => (
                        <tr key={reserva.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reserva.cliente.nombre}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reserva.horario}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reserva.personas}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                <a href={`https://wa.me/${reserva.cliente.telefono}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 inline-flex items-center gap-1">
                                    <MessageCircle size={14} /> Contactar
                                </a>
                                <a 
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (window.confirm(`¿Estás seguro de que quieres agregar a ${reserva.cliente.nombre} a la lista negra por no asistir?`)) {
                                        onSetBlacklist(reserva.clienteId, true);
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 ${!isPastReservation(reserva.fecha, reserva.horario) ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
                                    title={!isPastReservation(reserva.fecha, reserva.horario) ? "Solo para reservas pasadas" : "Marcar como No Asistió y añadir a Lista Negra"}
                                >
                                    <ThumbsDown size={14} /> No Asistió
                                </a>
                            </td>
                        </tr>
                    )) : <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No hay reservas para mostrar.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

// Componente reutilizable para la tabla de clientes
const ClientsTable = ({ clients, onSetBlacklist }) => {
    return (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Reservas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Visita</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {clients.map(cliente => (
                        <tr key={cliente.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{cliente.nombre}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{cliente.telefono}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{cliente.totalReservas}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(cliente.ultimaReserva)}</td>
                            <td className="px-6 py-4 text-sm font-medium">
                                <a href={`https://wa.me/${cliente.telefono}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 inline-flex items-center gap-1 mr-4">
                                    <MessageCircle size={14} /> Contactar
                                </a>
                                <a 
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (window.confirm(`¿Estás seguro de que quieres agregar a ${cliente.nombre} a la lista negra?`)) {
                                        onSetBlacklist(cliente.id, true);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                                    title="Añadir a lista negra"
                                >
                                    <ThumbsDown size={14} /> Añadir a lista negra
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const AdminView = ({ data, auth, onLogout, onSetBlacklist }) => {
  const [adminView, setAdminView] = useState('today');
  const [expandedDay, setExpandedDay] = useState(null);
  const [isBlacklistVisible, setIsBlacklistVisible] = useState(false);

  const getTodayReservations = () => { /* ... (código sin cambios) ... */ };
  const getWeekReservations = () => { /* ... (código sin cambios) ... */ };

  const todayReservations = data.reservas.filter(r => r.fecha === new Date().toISOString().split('T')[0]);
  
  // Lógica para Clientes
  const activeClients = data.clientes
      .filter(c => !c.listaNegra)
      .sort((a, b) => new Date(b.ultimaReserva) - new Date(a.ultimaReserva));
    
  const blacklistedClients = data.clientes.filter(c => c.listaNegra);

  return (
    <div className="contenedor-admin">
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                  <p className="text-sm text-gray-500">Sesión iniciada como: <span className="font-semibold capitalize">{auth.user}</span> ({auth.role})</p>
                </div>
                <button onClick={onLogout} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                  Cerrar Sesión
                </button>
              </div>
          </div>
        </header>
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex border-b border-gray-200">
              <button onClick={() => setAdminView('today')} className={`px-4 py-3 font-semibold text-sm -mb-px ${adminView === 'today' ? 'border-b-2 border-[#0c4900] text-[#0c4900]' : 'text-gray-500 hover:text-gray-700'}`}>Hoy</button>
              <button onClick={() => setAdminView('week')} className={`px-4 py-3 font-semibold text-sm -mb-px ${adminView === 'week' ? 'border-b-2 border-[#0c4900] text-[#0c4900]' : 'text-gray-500 hover:text-gray-700'}`}>Esta Semana</button>
              {auth.role === 'admin' && (
                <button onClick={() => setAdminView('clients')} className={`px-4 py-3 font-semibold text-sm -mb-px ${adminView === 'clients' ? 'border-b-2 border-[#0c4900] text-[#0c4900]' : 'text-gray-500 hover:text-gray-700'}`}>Clientes</button>
              )}
            </div>
          </div>
        </div>
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {adminView === 'today' && (
            <div className="space-y-8">
               <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Reservas de Hoy: Mediodía</h2>
                  <ReservationsTable reservations={todayReservations.filter(r => r.turno === 'mediodia')} onSetBlacklist={onSetBlacklist} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Reservas de Hoy: Noche</h2>
                  <ReservationsTable reservations={todayReservations.filter(r => r.turno === 'noche')} onSetBlacklist={onSetBlacklist} />
                </div>
            </div>
          )}
          {adminView === 'week' && (
             <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Reservas de la Semana</h2>
                {/* ... (código de la vista semana sin cambios) ... */}
              </div>
          )}
          {adminView === 'clients' && (
            <div className="space-y-8">
              <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Clientes Activos</h2>
                  <ClientsTable 
                      clients={activeClients} 
                      onSetBlacklist={onSetBlacklist} 
                  />
              </div>
              <div>
                  <button 
                      onClick={() => setIsBlacklistVisible(!isBlacklistVisible)} 
                      className="w-full bg-[#0c4900] hover:bg-green-900 border-2 border-transparent hover:border-[#0c4900] flex justify-between items-center p-4 font-medium text-left text-gray-700 rounded-lg transition-all"
                  >
                      <span>Lista Negra ({blacklistedClients.length} clientes)</span>
                      <ChevronDown className={`transform transition-transform duration-200 ${isBlacklistVisible ? 'rotate-180' : ''}`} />
                  </button>
                  {isBlacklistVisible && (
                      <div className="mt-2 bg-white rounded-lg shadow overflow-x-auto">
                          <table className="min-w-full">
                              <thead className="bg-red-50">
                                  <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">Nombre</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">Teléfono</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">Acción</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-red-200">
                                  {blacklistedClients.map(cliente => (
                                      <tr key={cliente.id}>
                                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{cliente.nombre}</td>
                                          <td className="px-6 py-4 text-sm text-gray-500">{cliente.telefono}</td>
                                          <td className="px-6 py-4 text-sm font-medium">
                                              <button 
                                                  onClick={() => onSetBlacklist(cliente.id, false)} 
                                                  className="text-[#0c4900] hover:text-green-900 inline-flex items-center gap-1"
                                              >
                                                  <Check size={14} /> Quitar de lista negra
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};