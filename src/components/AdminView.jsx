import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const AdminView = ({ data, setIsAdmin, auth, onLogout}) => {
  const [adminView, setAdminView] = useState('today');
  const [expandedDay, setExpandedDay] = useState(null);

  const getTodayReservations = () => {
    const today = new Date().toISOString().split('T')[0];
    return data.reservas.filter(r => r.fecha === today);
  };

  const getWeekReservations = () => {
    const today = new Date();
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const todayString = today.toISOString().split('T')[0];
    const weekEndString = weekEnd.toISOString().split('T')[0];
    return data.reservas.filter(r => r.fecha >= todayString && r.fecha <= weekEndString);
  };
  
  const todayReservations = getTodayReservations();
  const weekReservationsByDay = getWeekReservations().reduce((acc, reserva) => {
      (acc[reserva.fecha] = acc[reserva.fecha] || []).push(reserva);
      return acc;
  }, {});

  const renderReservationsTable = (reservations, turn) => (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {reservations.length > 0 ? reservations.map(reserva => (
            <tr key={reserva.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reserva.cliente.nombre}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reserva.horario}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reserva.personas}</td>
            </tr>
          )) : <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">No hay reservas para el turno {turn}.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center py-4">
      <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
      <div className="flex items-center gap-4">
        {auth && (
          <span className="text-gray-600">
            Hola, {auth.role === 'admin' ? 'Administrador' : 'Mozo'}
          </span>
        )}
        <button 
          onClick={onLogout}
          className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
      <button onClick={() => setIsAdmin(false)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Ver como cliente</button>
    </div>
    {auth?.role === 'mozo' && (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Modo mozo:</strong> Solo puedes ver reservas, no modificarlas
        </p>
      </div>
    )}
    <div className="flex border-b border-gray-200">
      <button onClick={() => setAdminView('today')} className={`px-4 py-3 font-semibold text-sm -mb-px ${adminView === 'today' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Hoy</button>
      <button onClick={() => setAdminView('week')} className={`px-4 py-3 font-semibold text-sm -mb-px ${adminView === 'week' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Esta Semana</button>
    </div>
  </div> {/* <-- Este es el único cierre necesario */}
</header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {adminView === 'today' && (
          <div className="space-y-8">
             <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Reservas de Hoy: Mediodía</h2>
                {renderReservationsTable(todayReservations.filter(r => r.turno === 'mediodia'), 'mediodía')}
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Reservas de Hoy: Noche</h2>
                {renderReservationsTable(todayReservations.filter(r => r.turno === 'noche'), 'noche')}
              </div>
          </div>
        )}
        {adminView === 'week' && (
           <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Reservas de la Semana</h2>
              <div className="space-y-3">
                {Object.keys(weekReservationsByDay).length > 0 ? Object.keys(weekReservationsByDay).sort().map(date => (
                  <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setExpandedDay(expandedDay === date ? null : date)} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 text-left font-semibold text-gray-700">
                      <span>{formatDate(date)}</span>
                      <ChevronDown className={`transform transition-transform duration-200 ${expandedDay === date ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedDay === date && (
                      <div className="p-4 border-t border-gray-200">
                        <table className="min-w-full text-sm">
                            <tbody>
                                {weekReservationsByDay[date].map(reserva => (
                                    <tr key={reserva.id} className="border-b last:border-b-0">
                                      <td className="py-2 pr-2 font-medium text-gray-800">{reserva.cliente.nombre}</td>
                                      <td className="py-2 px-2 capitalize text-gray-600">{reserva.turno} - {reserva.horario}</td>
                                      <td className="py-2 pl-2 text-right text-gray-600">{reserva.personas} personas</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )) : <p className="text-center text-gray-500 py-4">No hay reservas para los próximos 7 días.</p>}
              </div>
            </div>
        )}
      </main>
    </div>
  );
};