import React, { useState, useMemo } from 'react';
import { Edit2, AlertTriangle } from 'lucide-react';
import { formatDateToString } from '../../../../utils';
import styles from './Clients.module.css';
import ClientDetailsModal from './components/ClientDetailsModal';

const Clients = ({ 
  clients = [], 
  reservations = [], 
  onSetBlacklist, 
  onUpdateClientNotes, 
  onUpdateReservation,
  getAvailableSlotsForEdit,
  isValidDate,
  HORARIOS,
  showNotification, 
  showConfirmation 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlacklist, setFilterBlacklist] = useState('withReservations'); // 'all', 'blacklisted', 'normal', 'withReservations'
  const [sortBy, setSortBy] = useState('ultimaReserva'); // 'nombre', 'telefono', 'ultimaReserva', 'totalReservas'
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);



  // Consolidar clientes duplicados por número de teléfono
  const consolidatedClients = useMemo(() => {
    const phoneMap = new Map();
    
    clients.forEach(client => {
      // Validar que cliente tenga campos obligatorios Y que sean strings
      if (!client.nombre || !client.telefono || 
          typeof client.nombre !== 'string' || 
          typeof client.telefono !== 'string') {
        console.warn('Cliente con datos incompletos o tipo incorrecto:', client);
        return; // Saltar este cliente
      }
      
      // Normalizar teléfono para buscar duplicados (solo por teléfono, no por nombre)
      const normalizedPhone = client.telefono.replace(/\D/g, ''); // Solo números
      
      if (phoneMap.has(normalizedPhone)) {
        // Cliente con mismo teléfono encontrado, consolidar
        const existing = phoneMap.get(normalizedPhone);
        
        // Usar el cliente más reciente (por ultimaReserva o por orden de procesamiento)
        const clientDate = client.ultimaReserva ? new Date(client.ultimaReserva + "T00:00:00") : new Date(0);
        const existingDate = existing.ultimaReserva ? new Date(existing.ultimaReserva + "T00:00:00") : new Date(0);
        
        if (clientDate >= existingDate) {
          // Este cliente es más reciente, usar sus datos como principales
          existing.nombre = client.nombre; // Usar el nombre más reciente
          existing.ultimaReserva = client.ultimaReserva;
          existing.id = client.id; // Usar el ID más reciente como principal
        }
        
        // Combinar comentarios/notas si existen y no están en el principal
        if (client.comentarios && !existing.comentarios) {
          existing.comentarios = client.comentarios;
        }
        if (client.notasInternas && !existing.notasInternas) {
          existing.notasInternas = client.notasInternas;
        }
        
        // Mantener estado de lista negra si alguno lo tiene
        if (client.listaNegra) {
          existing.listaNegra = true;
        }
        
        // Agregar IDs consolidados y nombres únicos
        existing.consolidatedIds = existing.consolidatedIds || [existing.id];
        existing.consolidatedIds.push(client.id);
        
        // Mantener lista de nombres únicos usados
        existing.uniqueNames = existing.uniqueNames || [existing.nombre];
        const normalizedClientName = client.nombre.toLowerCase().trim();
        const normalizedExistingNames = existing.uniqueNames.map(n => n.toLowerCase().trim());
        
        if (!normalizedExistingNames.includes(normalizedClientName)) {
          existing.uniqueNames.push(client.nombre);
        }
        
      } else {
        // Primera vez que vemos este teléfono
        phoneMap.set(normalizedPhone, { 
          ...client, 
          consolidatedIds: [client.id],
          uniqueNames: [client.nombre]
        });
      }
    });
    
    return Array.from(phoneMap.values());
  }, [clients]);

  // Calcular estadísticas de reservas por cliente
  const clientsWithStats = useMemo(() => {
    return consolidatedClients.map(client => {
      // Normalizar el teléfono del cliente (solo números)
      const clientPhone = client.telefono ? client.telefono.replace(/\D/g, '') : '';
      
      // Buscar todas las reservas para este cliente por número de teléfono
      const clientReservations = reservations.filter(reservation => {
        if (!reservation.cliente?.telefono) return false;
        
        // Normalizar el teléfono de la reserva (solo números)
        const reservationPhone = reservation.cliente.telefono.replace(/\D/g, '');
        
        // Comparar teléfonos normalizados
        return clientPhone === reservationPhone;
      });
      
      const today = formatDateToString(new Date());
      const pastReservations = clientReservations.filter(r => r.fecha < today);
      const futureReservations = clientReservations.filter(r => r.fecha >= today);
      
      return {
        ...client,
        totalReservas: clientReservations.length,
        reservasPasadas: pastReservations.length,
        reservasFuturas: futureReservations.length,
        tieneReservasFuturas: futureReservations.length > 0,
        ultimaReservaReal: pastReservations.length > 0 ? 
          Math.max(...pastReservations.map(r => new Date(r.fecha + "T00:00:00"))) : null
      };
    });
  }, [consolidatedClients, reservations]);

  // Filtrar y ordenar clientes
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clientsWithStats.filter(client => {
      // Validar que cliente tenga datos válidos para buscar y sean strings
      if (!client.nombre || !client.telefono || 
          typeof client.nombre !== 'string' || 
          typeof client.telefono !== 'string') {
        return false;
      }
      
      const matchesSearch = 
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefono.includes(searchTerm);
      
      const matchesFilter = 
        filterBlacklist === 'all' ||
        (filterBlacklist === 'blacklisted' && client.listaNegra) ||
        (filterBlacklist === 'normal' && !client.listaNegra) ||
        (filterBlacklist === 'withReservations' && client.reservasPasadas > 0);
      
      return matchesSearch && matchesFilter;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          // Validar que ambos tengan nombre y sean strings antes de comparar
          if (!a.nombre || !b.nombre || typeof a.nombre !== 'string' || typeof b.nombre !== 'string') return 0;
          return a.nombre.localeCompare(b.nombre);
        case 'telefono':
          // Validar que ambos tengan teléfono y sean strings antes de comparar
          if (!a.telefono || !b.telefono || typeof a.telefono !== 'string' || typeof b.telefono !== 'string') return 0;
          return a.telefono.localeCompare(b.telefono);
        case 'ultimaReserva':
          return new Date(b.ultimaReservaReal || b.ultimaReserva || 0) - new Date(a.ultimaReservaReal || a.ultimaReserva || 0);
        case 'totalReservas':
          return b.totalReservas - a.totalReservas;
        case 'reservasPasadas':
          return b.reservasPasadas - a.reservasPasadas;
        case 'reservasFuturas':
          return b.reservasFuturas - a.reservasFuturas;
        default:
          return 0;
      }
    });

    return filtered;
  }, [clientsWithStats, searchTerm, filterBlacklist, sortBy]);

  const handleToggleBlacklist = async (client) => {
    const newStatus = !client.listaNegra;
    const action = newStatus ? 'agregar a' : 'quitar de';
    
    const confirmed = await showConfirmation({
      title: `${newStatus ? 'Agregar a' : 'Quitar de'} lista negra`,
      message: `¿Estás seguro de que quieres ${action} la lista negra a ${client.nombre}?`,
      confirmText: newStatus ? 'Agregar' : 'Quitar'
    });

    if (confirmed) {
      try {
        await onSetBlacklist(client.id, newStatus);
        showNotification('success', `${client.nombre} ${newStatus ? 'agregado a' : 'quitado de'} la lista negra.`);
      } catch (error) {
        showNotification('error', 'Error al actualizar el estado del cliente.');
      }
    }
  };

  const getLastReservationDate = (client) => {
    const date = client.ultimaReservaReal || client.ultimaReserva;
    if (!date) return 'Sin reservas';
    return new Date(date + "T00:00:00").toLocaleDateString('es-AR');
  };

  const handleEditNotes = (client) => {
    setEditingNotes(client.id);
    setNotesText(client.notasInternas || '');
  };

  const handleSaveNotes = async () => {
    try {
      await onUpdateClientNotes(editingNotes, notesText);
      showNotification('success', 'Notas guardadas correctamente');
      setEditingNotes(null);
      setNotesText('');
    } catch (error) {
      console.error('Error al guardar notas:', error);
      showNotification('error', 'Error al guardar las notas');
    }
  };

  const handleCancelNotes = () => {
    setEditingNotes(null);
    setNotesText('');
  };

  const blacklistedCount = consolidatedClients.filter(c => c.listaNegra).length;
  const normalCount = consolidatedClients.filter(c => !c.listaNegra).length;
  const withReservationsCount = clientsWithStats.filter(c => c.reservasPasadas > 0).length;

  const handleStatCardClick = (filterType) => {
    setFilterBlacklist(filterType);
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  const handleCloseClientDetails = () => {
    setShowClientDetails(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = async (clientId) => {
    try {
      const { deleteClient } = await import('../../../../firebase');
      await deleteClient(clientId);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  };

  const handleUpdateClient = async (clientData) => {
    try {
      const { updateClient } = await import('../../../../firebase');
      await updateClient(clientData);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  };

  return (
    <div className={styles.clientsContainer}>
      {/* Header con estadísticas */}
      <div className={styles.clientsHeader}>
        <div className={styles.headerContent}>
          <h2 className={styles.pageTitle}>Gestión de Clientes</h2>
          <div className={styles.statsGrid}>
            <div 
              className={`${styles.statCard} ${filterBlacklist === 'all' ? styles.active : ''}`}
              onClick={() => handleStatCardClick('all')}
              title="Ver todos los clientes"
            >
              <span className={styles.statNumber}>{consolidatedClients.length}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div 
              className={`${styles.statCard} ${filterBlacklist === 'withReservations' ? styles.active : ''}`}
              onClick={() => handleStatCardClick('withReservations')}
              title="Ver clientes con reservas pasadas"
            >
              <span className={`${styles.statNumber} ${styles.statBlue}`}>{withReservationsCount}</span>
              <span className={styles.statLabel}>Con reservas</span>
            </div>
            <div 
              className={`${styles.statCard} ${filterBlacklist === 'normal' ? styles.active : ''}`}
              onClick={() => handleStatCardClick('normal')}
              title="Ver clientes normales"
            >
              <span className={`${styles.statNumber} ${styles.statGreen}`}>{normalCount}</span>
              <span className={styles.statLabel}>Normales</span>
            </div>
            <div 
              className={`${styles.statCard} ${filterBlacklist === 'blacklisted' ? styles.active : ''}`}
              onClick={() => handleStatCardClick('blacklisted')}
              title="Ver clientes en lista negra"
            >
              <span className={`${styles.statNumber} ${styles.statRed}`}>{blacklistedCount}</span>
              <span className={styles.statLabel}>Lista negra</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <select
              value={filterBlacklist}
              onChange={(e) => setFilterBlacklist(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="withReservations">Con reservas pasadas</option>
              <option value="all">Todos los clientes</option>
              <option value="normal">Solo normales</option>
              <option value="blacklisted">Solo lista negra</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ultimaReserva">Más recientes primero</option>
              <option value="nombre">Nombre A-Z</option>
              <option value="telefono">Teléfono</option>
              <option value="totalReservas">Más reservas primero</option>
              <option value="reservasPasadas">Más reservas pasadas</option>
              <option value="reservasFuturas">Más reservas futuras</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className={styles.tableContainer}>
        <table className={styles.clientsTable}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.headerCell}>Cliente</th>
              <th className={styles.headerCell}>Teléfono</th>
              <th className={styles.headerCell}>Pasadas</th>
              <th className={styles.headerCell}>Futuras</th>
              <th className={styles.headerCell}>Última reserva</th>
              <th className={styles.headerCell}>Estado</th>
              <th className={styles.headerCell}>Notas</th>
              <th className={styles.headerCell}>Acciones</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {filteredAndSortedClients.map((client) => (
              <tr 
                key={client.id} 
                className={`${styles.tableRow} ${styles.clickableRow}`}
                onClick={() => handleClientClick(client)}
                title="Haz clic para ver detalles del cliente"
              >
                <td className={styles.tableCell}>
                  <div className={styles.clientName}>
                    {client.nombre}
                    {client.uniqueNames?.length > 1 && (
                      <span className={styles.duplicatesBadge}>
                        {client.uniqueNames.length} nombres
                      </span>
                    )}
                  </div>
                </td>
                <td className={styles.tableCell}>
                  <a 
                    href={`https://wa.me/${typeof client.telefono === 'string' ? client.telefono.replace(/\D/g, '') : client.telefono}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.phoneLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {client.telefono}
                  </a>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.reservationCount}>
                    <span className={styles.pastCount}>{client.reservasPasadas}</span>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.reservationCount}>
                    <span className={styles.futureCount}>{client.reservasFuturas}</span>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  <span className={styles.lastReservation}>
                    {getLastReservationDate(client)}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  {client.listaNegra ? (
                    <span className={styles.blacklistBadge}>
                      <AlertTriangle size={12} />
                      Lista negra
                    </span>
                  ) : (
                    <span className={styles.normalBadge}>Normal</span>
                  )}
                </td>
                <td className={styles.tableCell}>
                  {editingNotes === client.id ? (
                    <div className={styles.notesEditContainer}>
                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.notesTextarea}
                        placeholder="Notas internas..."
                      />
                      <div className={styles.notesActions}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveNotes();
                          }} 
                          className={styles.saveButton}
                        >
                          Guardar
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelNotes();
                          }} 
                          className={styles.cancelButton}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.notesContainer}>
                      <span className={styles.notesText}>
                        {client.notasInternas || 'Sin notas'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNotes(client);
                        }} 
                        className={styles.editNotesButton}
                        title="Editar notas"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionsContainer}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBlacklist(client);
                      }}
                      className={client.listaNegra ? styles.removeBlacklistButton : styles.addBlacklistButton}
                      title={client.listaNegra ? 'Quitar de lista negra' : 'Agregar a lista negra'}
                    >
                      {client.listaNegra ? 'Quitar' : 'Bloquear'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedClients.length === 0 && (
          <div className={styles.emptyState}>
            <p>No se encontraron clientes con los filtros seleccionados.</p>
          </div>
        )}
      </div>

      {/* Modal de detalles del cliente */}
      {showClientDetails && selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          reservations={reservations}
          onClose={handleCloseClientDetails}
          onDeleteClient={handleDeleteClient}
          onUpdateClient={handleUpdateClient}
          onUpdateReservation={onUpdateReservation}
          getAvailableSlotsForEdit={getAvailableSlotsForEdit}
          isValidDate={isValidDate}
          HORARIOS={HORARIOS}
          showNotification={showNotification}
          showConfirmation={showConfirmation}
        />
      )}
    </div>
  );
};

export default Clients; 