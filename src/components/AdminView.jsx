// src/components/AdminView.jsx

import React, { useState } from 'react';
import { ChevronDown, ThumbsDown, MessageCircle, Check, Edit2 } from 'lucide-react';
import styles from './AdminView.module.css';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Modal de edición de reserva
const EditReservationModal = ({ reservation, onClose, onSave }) => {
    const [editedReservation, setEditedReservation] = useState({
        ...reservation,
        cliente: { ...reservation.cliente }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(editedReservation);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
                <h2 className="text-xl font-semibold mb-4">Modificar Reserva</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Cliente</label>
                        <input
                            type="text"
                            value={editedReservation.cliente.nombre}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                cliente: { ...editedReservation.cliente, nombre: e.target.value }
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                        <input
                            type="text"
                            value={editedReservation.cliente.telefono}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                cliente: { ...editedReservation.cliente, telefono: e.target.value }
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha</label>
                        <input
                            type="date"
                            value={editedReservation.fecha}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                fecha: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Horario</label>
                        <input
                            type="time"
                            value={editedReservation.horario}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                horario: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Personas</label>
                        <input
                            type="number"
                            min="1"
                            max="6"
                            value={editedReservation.personas}
                            onChange={(e) => setEditedReservation({
                                ...editedReservation,
                                personas: parseInt(e.target.value)
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente reutilizable para las tablas de reservas
const ReservationsTable = ({ reservations, onSetBlacklist, onUpdateReservation, showEditButton = false }) => {
    const [editingReservation, setEditingReservation] = useState(null);

    const formatPhoneForWhatsApp = (phone) => {
        // Eliminar todos los caracteres no numéricos
        let cleaned = phone.replace(/\D/g, '');
        
        // Si el número ya empieza con 549, lo dejamos como está
        if (cleaned.startsWith('549')) {
            return cleaned;
        }

        // Si empieza con 54, agregamos el 9
        if (cleaned.startsWith('54')) {
            cleaned = '549' + cleaned.slice(2);
        }

        // Si el número empieza con 0, lo removemos
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.slice(1);
        }

        // Si el número empieza con 15, lo movemos después del código de área
        if (cleaned.includes('15')) {
            const parts = cleaned.split('15');
            cleaned = parts.join('');
        }

        // Si no tiene el prefijo internacional, lo agregamos
        if (!cleaned.startsWith('549')) {
            cleaned = '549' + cleaned;
        }

        return cleaned;
    };

    const getWhatsAppMessage = (reserva) => {
        const fecha = formatDate(reserva.fecha);
        const mensaje = `Hola! Te escribimos de Rosaura para confirmar tu reserva hecha por nuestra web para el día ${fecha} para ${reserva.personas} personas a las ${reserva.horario} hs, te esperamos! Gracias`;
        return encodeURIComponent(mensaje);
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
                                <a 
                                    href={`https://wa.me/${formatPhoneForWhatsApp(reserva.cliente.telefono)}?text=${getWhatsAppMessage(reserva)}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-green-600 hover:text-green-800 inline-flex items-center gap-1"
                                >
                                    <MessageCircle size={14} /> Contactar
                                </a>
                                {showEditButton ? (
                                    <button
                                        onClick={() => setEditingReservation(reserva)}
                                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                                    >
                                        <Edit2 size={14} /> Modificar
                                    </button>
                                ) : (
                                    <a 
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (window.confirm(`¿Estás seguro de que quieres agregar a ${reserva.cliente.nombre} a la lista negra por no asistir?`)) {
                                            onSetBlacklist(reserva.clienteId, true);
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                                        title="Marcar como No Asistió y añadir a Lista Negra"
                                    >
                                        <ThumbsDown size={14} /> No Asistió
                                    </a>
                                )}
                            </td>
                        </tr>
                    )) : <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No hay reservas para mostrar.</td></tr>}
                </tbody>
            </table>
            {editingReservation && (
                <EditReservationModal
                    reservation={editingReservation}
                    onClose={() => setEditingReservation(null)}
                    onSave={onUpdateReservation}
                />
            )}
        </div>
    );
};

// Componente reutilizable para la tabla de clientes
const ClientsTable = ({ clients, onSetBlacklist }) => {
    return (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className={styles.table}>
                <thead className={styles.tableHeader}>
                    <tr>
                        <th className={styles.tableHeaderCell}>Nombre</th>
                        <th className={styles.tableHeaderCell}>Teléfono</th>
                        <th className={styles.tableHeaderCell}>Total Reservas</th>
                        <th className={styles.tableHeaderCell}>Última Visita</th>
                        <th className={styles.tableHeaderCell}>Acciones</th>
                    </tr>
                </thead>
                <tbody className={styles.tableBody}>
                    {clients.map(cliente => (
                        <tr key={cliente.id} className={styles.tableRow}>
                            <td className={styles.tableCell}>{cliente.nombre}</td>
                            <td className={styles.tableCellSecondary}>{cliente.telefono}</td>
                            <td className={styles.tableCellSecondary}>{cliente.totalReservas}</td>
                            <td className={styles.tableCellSecondary}>{formatDate(cliente.ultimaReserva)}</td>
                            <td className={styles.tableCell}>
                                <a href={`https://wa.me/${cliente.telefono}`} target="_blank" rel="noopener noreferrer" className={styles.actionLinkGreen}>
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
                                    className={styles.actionLinkRed}
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

// Componente para la vista semanal
const WeekView = ({ reservations, onSetBlacklist, onUpdateReservation }) => {
    const [expandedDay, setExpandedDay] = useState(null);

    // Obtener los próximos 7 días
    const getNextSevenDays = () => {
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    };

    // Agrupar reservas por día
    const getReservationsForDay = (date) => {
        return reservations.filter(r => r.fecha === date);
    };

    const nextSevenDays = getNextSevenDays();

    return (
        <div className="space-y-4">
            {nextSevenDays.map(date => {
                const dayReservations = getReservationsForDay(date);
                const isExpanded = expandedDay === date;

                return (
                    <div key={date} className="bg-white rounded-lg shadow-sm">
                        <button
                            onClick={() => setExpandedDay(isExpanded ? null : date)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150"
                        >
                            <div className="flex items-center space-x-4">
                                <span className="font-medium text-gray-900">{formatDate(date)}</span>
                                <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                    {dayReservations.length} reservas
                                </span>
                            </div>
                            <ChevronDown
                                className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                size={20}
                            />
                        </button>
                        {isExpanded && dayReservations.length > 0 && (
                            <div className="border-t border-gray-200">
                                <ReservationsTable
                                    reservations={dayReservations}
                                    onSetBlacklist={onSetBlacklist}
                                    onUpdateReservation={onUpdateReservation}
                                    showEditButton={true}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export const AdminView = ({ data, auth, onLogout, onSetBlacklist, onUpdateReservation }) => {
  const [adminView, setAdminView] = useState('today');
  const [isBlacklistVisible, setIsBlacklistVisible] = useState(false);

  const todayReservations = data.reservas.filter(r => r.fecha === new Date().toISOString().split('T')[0]);
  
  // Lógica para Clientes
  const activeClients = data.clientes
      .filter(c => !c.listaNegra)
      .sort((a, b) => new Date(b.ultimaReserva) - new Date(a.ultimaReserva));
    
  const blacklistedClients = data.clientes.filter(c => c.listaNegra);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerFlex}>
            <div>
              <h1 className={styles.headerTitle}>Panel de Administración</h1>
              <p className={styles.headerUser}>Sesión iniciada como: <span className={styles.headerUserName}>{auth.user}</span> ({auth.role})</p>
            </div>
            <button onClick={onLogout} className={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>
      <div className={styles.tabsContainer}>
        <div className={styles.tabsContent}>
          <div className={styles.tabsList}>
            <button 
              onClick={() => setAdminView('today')} 
              className={adminView === 'today' ? styles.tabActive : styles.tabInactive}
            >
              Hoy
            </button>
            <button 
              onClick={() => setAdminView('week')} 
              className={adminView === 'week' ? styles.tabActive : styles.tabInactive}
            >
              Esta Semana
            </button>
            {auth.role === 'admin' && (
              <button 
                onClick={() => setAdminView('clients')} 
                className={adminView === 'clients' ? styles.tabActive : styles.tabInactive}
              >
                Clientes
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={styles.mainContent}>
        {adminView === 'today' && (
          <div>
            <ReservationsTable 
              reservations={todayReservations} 
              onSetBlacklist={onSetBlacklist}
              onUpdateReservation={onUpdateReservation}
            />
          </div>
        )}

        {adminView === 'week' && (
          <WeekView 
            reservations={data.reservas} 
            onSetBlacklist={onSetBlacklist}
            onUpdateReservation={onUpdateReservation}
          />
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
                className={styles.blacklistButton}
              >
                <span>Lista Negra ({blacklistedClients.length} clientes)</span>
                <ChevronDown className={`transform transition-transform duration-200 ${isBlacklistVisible ? 'rotate-180' : ''}`} />
              </button>
              {isBlacklistVisible && (
                <div className={styles.blacklistTable}>
                  <table className={styles.table}>
                    <thead className={styles.blacklistTableHeader}>
                      <tr>
                        <th className={styles.blacklistTableHeaderCell}>Nombre</th>
                        <th className={styles.blacklistTableHeaderCell}>Teléfono</th>
                        <th className={styles.blacklistTableHeaderCell}>Acción</th>
                      </tr>
                    </thead>
                    <tbody className={styles.blacklistTableBody}>
                      {blacklistedClients.map(cliente => (
                        <tr key={cliente.id} className={styles.blacklistTableRow}>
                          <td className={styles.blacklistTableCellName}>{cliente.nombre}</td>
                          <td className={styles.blacklistTableCellPhone}>{cliente.telefono}</td>
                          <td className={styles.blacklistTableCell}>
                            <button 
                              onClick={() => onSetBlacklist(cliente.id, false)} 
                              className={styles.removeFromBlacklistButton}
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
      </div>
    </div>
  );
};