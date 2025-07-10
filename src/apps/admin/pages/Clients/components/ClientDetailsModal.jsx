import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Users, Phone, MessageSquare, AlertTriangle, Trash2, MapPin, Edit2, ChevronDown, ChevronUp, User } from 'lucide-react';
import EditClientModal from './EditClientModal';
import EditReservationModal from '../../../../../components/modals/EditReservationModal';
import styles from './ClientDetailsModal.module.css';

const ClientDetailsModal = ({ 
  client, 
  reservations, 
  onClose, 
  onDeleteClient,
  onUpdateClient,
  onUpdateReservation,
  getAvailableSlotsForEdit,
  isValidDate,
  HORARIOS,
  showNotification,
  showConfirmation 
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [isNamesExpanded, setIsNamesExpanded] = useState(false);

  // Calcular todas las reservas de este cliente (por número de teléfono)
  const clientReservations = useMemo(() => {
    if (!client || !reservations) return [];
    
    // Normalizar el teléfono del cliente (solo números)
    const clientPhone = client.telefono ? client.telefono.replace(/\D/g, '') : '';
    
    if (!clientPhone) return [];
    
    return reservations.filter(reservation => {
      if (!reservation.cliente?.telefono) return false;
      
      // Normalizar el teléfono de la reserva (solo números)
      const reservationPhone = reservation.cliente.telefono.replace(/\D/g, '');
      
      // Comparar teléfonos normalizados
      return clientPhone === reservationPhone;
    });
  }, [client, reservations]);

  // Separar reservas pasadas y futuras
  const { pastReservations, futureReservations } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const past = clientReservations
      .filter(r => r.fecha < today)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Más recientes primero

    const future = clientReservations
      .filter(r => r.fecha >= today)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); // Próximas primero

    return { pastReservations: past, futureReservations: future };
  }, [clientReservations]);

  // Calcular perfiles únicos usando los datos ya consolidados
  const uniqueProfiles = useMemo(() => {
    const profilesMap = new Map();
    
    // Si tenemos uniqueNames del cliente consolidado, usarlos
    if (client?.uniqueNames && client.uniqueNames.length > 0) {
      client.uniqueNames.forEach(nombre => {
        const normalizedName = nombre.toLowerCase().trim();
        profilesMap.set(normalizedName, {
          nombre: nombre,
          ultimaUso: null
        });
      });
    } else if (client?.nombre) {
      // Si no hay uniqueNames, al menos mostrar el nombre actual
      const normalizedName = client.nombre.toLowerCase().trim();
      profilesMap.set(normalizedName, {
        nombre: client.nombre,
        ultimaUso: null
      });
    }
    
    // Luego encontrar la fecha de último uso para cada nombre en las reservas
    clientReservations.forEach(reservation => {
      const clientName = reservation.cliente?.nombre;
      if (clientName) {
        const normalizedName = clientName.toLowerCase().trim();
        if (profilesMap.has(normalizedName)) {
          const existing = profilesMap.get(normalizedName);
          if (!existing.ultimaUso || reservation.fecha > existing.ultimaUso) {
            existing.ultimaUso = reservation.fecha;
          }
        } else {
          // Si encontramos un nombre en las reservas que no está en uniqueNames, agregarlo
          profilesMap.set(normalizedName, {
            nombre: clientName,
            ultimaUso: reservation.fecha
          });
        }
      }
    });

    return Array.from(profilesMap.values())
      .sort((a, b) => {
        if (!a.ultimaUso && !b.ultimaUso) return 0;
        if (!a.ultimaUso) return 1;
        if (!b.ultimaUso) return -1;
        return new Date(b.ultimaUso) - new Date(a.ultimaUso);
      });
  }, [client, clientReservations]);

  const handleDeleteClient = async () => {
    try {
      const confirmed = await showConfirmation({
        title: 'Eliminar cliente',
        message: `¿Estás seguro de que quieres eliminar completamente a ${client.nombre}? Esta acción NO se puede deshacer y eliminará todos los registros del cliente de la base de datos.`,
        confirmText: 'Eliminar',
        type: 'danger'
      });

      if (confirmed) {
        // Eliminar todos los IDs consolidados del cliente
        for (const clientId of client.consolidatedIds || [client.id]) {
          await onDeleteClient(clientId);
        }
        
        showNotification('success', `Cliente ${client.nombre} eliminado completamente`);
        onClose();
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      showNotification('error', 'Error al eliminar el cliente');
    }
  };

  const handleEditClient = () => {
    setShowEditClientModal(true);
  };

  const handleSaveClient = async (clientData) => {
    try {
      await onUpdateClient(clientData);
      setShowEditClientModal(false);
      // El modal se cerrará automáticamente y mostrará notificación desde EditClientModal
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error; // Dejar que EditClientModal maneje el error
    }
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
  };

  const handleSaveReservation = async (updatedData) => {
    try {
      await onUpdateReservation(editingReservation.id, updatedData, true);
      setEditingReservation(null);
    } catch (error) {
      console.error('Error al actualizar reserva:', error);
      showNotification('error', 'Error al actualizar la reserva');
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getTurnoLabel = (turno) => {
    return turno === 'mediodia' ? 'Mediodía' : 'Noche';
  };

  if (!client) return null;

  return createPortal(
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>Detalles del Cliente</h2>
            {client.listaNegra && (
              <span className={styles.blacklistWarning}>
                <AlertTriangle size={16} />
                Lista Negra
              </span>
            )}
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={handleEditClient}
              className={styles.headerEditButton}
              title="Editar información del cliente"
            >
              <Edit2 size={16} />
              Editar
            </button>
            <button
              onClick={handleDeleteClient}
              className={styles.headerDeleteButton}
              title="Eliminar cliente completamente de la base de datos"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
            <button onClick={onClose} className={styles.closeButton}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Información básica del cliente */}
        <div className={styles.clientInfo}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Nombre actual:</strong>
              <span>{client.nombre}</span>
            </div>
            
            <div className={styles.infoItem}>
              <strong>Teléfono:</strong>
              <a 
                href={`https://wa.me/${typeof client.telefono === 'string' ? client.telefono.replace(/\D/g, '') : client.telefono}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.phoneLink}
              >
                <Phone size={14} />
                {client.telefono}
              </a>
            </div>

            {uniqueProfiles.length > 0 && (
              <div className={styles.infoItem}>
                <strong>Perfiles usados:</strong>
                <span>
                  {uniqueProfiles.length === 1 
                    ? "1 nombre" 
                    : `${uniqueProfiles.length} nombres diferentes`
                  }
                </span>
              </div>
            )}

            <div className={styles.infoItem}>
              <strong>Total reservas:</strong>
              <span>{clientReservations.length}</span>
            </div>

            <div className={styles.infoItem}>
              <strong>Registros consolidados:</strong>
              <span>{client.consolidatedIds?.length || 1}</span>
            </div>

            {client.notasInternas && (
              <div className={styles.infoItem}>
                <strong>Notas internas:</strong>
                <span>{client.notasInternas}</span>
              </div>
            )}
          </div>

          {/* Mostrar nombres utilizados - Desplegable */}
          {uniqueProfiles.length > 0 && (
            <div className={styles.profilesSection}>
              <button
                type="button"
                onClick={() => setIsNamesExpanded(!isNamesExpanded)}
                className={styles.expandButton}
              >
                <h4>Nombres utilizados ({uniqueProfiles.length})</h4>
                {isNamesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {isNamesExpanded && (
                <div className={styles.profilesList}>
                  {uniqueProfiles.map((profile, index) => (
                    <div key={index} className={styles.profileItem}>
                      <span className={styles.profileName}>{profile.nombre}</span>
                      <span className={styles.profileDate}>
                        {profile.ultimaUso ? `Última vez: ${formatDate(profile.ultimaUso)}` : 'Sin reservas'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{pastReservations.length}</span>
            <span className={styles.statLabel}>Reservas Pasadas</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{futureReservations.length}</span>
            <span className={styles.statLabel}>Reservas Futuras</span>
          </div>
        </div>

        {/* Reservas futuras */}
        {futureReservations.length > 0 && (
          <div className={styles.reservationsSection}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={18} />
              Reservas Futuras ({futureReservations.length})
            </h3>
            <div className={styles.reservationsList}>
              {futureReservations.map((reservation) => (
                <div 
                  key={reservation.id} 
                  className={`${styles.reservationCard} ${styles.futureReservationCard}`}
                  onClick={() => handleEditReservation(reservation)}
                  title="Click para editar esta reserva"
                >
                  <div className={styles.reservationHeader}>
                    <span className={styles.reservationDate}>
                      {formatDate(reservation.fecha)}
                    </span>
                    <span className={styles.reservationCode}>
                      {reservation.reservationId}
                    </span>
                  </div>
                  <div className={styles.reservationDetails}>
                    <div className={styles.detailItem}>
                      <User size={14} />
                      <span className={styles.clientName}>{reservation.cliente?.nombre || 'Sin nombre'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Clock size={14} />
                      <span>{reservation.horario} - {getTurnoLabel(reservation.turno)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Users size={14} />
                      <span>{reservation.personas} personas</span>
                    </div>
                    {reservation.mesaAsignada && (
                      <div className={styles.detailItem}>
                        <MapPin size={14} />
                        <span>Mesa {reservation.mesaAsignada}</span>
                      </div>
                    )}
                    {reservation.cliente?.comentarios && (
                      <div className={styles.detailItem}>
                        <MessageSquare size={14} />
                        <span>{reservation.cliente.comentarios}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reservas pasadas */}
        {pastReservations.length > 0 && (
          <div className={styles.reservationsSection}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={18} />
              Historial de Reservas ({pastReservations.length})
            </h3>
            <div className={styles.reservationsList}>
              {pastReservations.slice(0, 10).map((reservation) => (
                <div key={reservation.id} className={styles.reservationCard}>
                  <div className={styles.reservationHeader}>
                    <span className={styles.reservationDate}>
                      {formatDate(reservation.fecha)}
                    </span>
                    <span className={styles.reservationCode}>
                      {reservation.reservationId}
                    </span>
                  </div>
                  <div className={styles.reservationDetails}>
                    <div className={styles.detailItem}>
                      <User size={14} />
                      <span className={styles.clientName}>{reservation.cliente?.nombre || 'Sin nombre'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Clock size={14} />
                      <span>{reservation.horario} - {getTurnoLabel(reservation.turno)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Users size={14} />
                      <span>{reservation.personas} personas</span>
                    </div>
                    {reservation.mesaAsignada && (
                      <div className={styles.detailItem}>
                        <MapPin size={14} />
                        <span>Mesa {reservation.mesaAsignada}</span>
                      </div>
                    )}
                    {reservation.cliente?.comentarios && (
                      <div className={styles.detailItem}>
                        <MessageSquare size={14} />
                        <span>{reservation.cliente.comentarios}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {pastReservations.length > 10 && (
                <div className={styles.moreReservations}>
                  Y {pastReservations.length - 10} reservas más...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sin reservas */}
        {clientReservations.length === 0 && (
          <div className={styles.emptyState}>
            <Calendar size={48} />
            <p>Este cliente no tiene reservas registradas</p>
          </div>
        )}



        {/* Modal de edición de cliente */}
        {showEditClientModal && (
          <EditClientModal
            client={client}
            onClose={() => setShowEditClientModal(false)}
            onSave={handleSaveClient}
            showNotification={showNotification}
            showConfirmation={showConfirmation}
          />
        )}

        {/* Modal de edición de reserva */}
        {editingReservation && (
          <EditReservationModal
            reservation={editingReservation}
            onClose={() => setEditingReservation(null)}
            onSave={handleSaveReservation}
            getAvailableSlotsForEdit={getAvailableSlotsForEdit}
            isValidDate={isValidDate}
            HORARIOS={HORARIOS}
            showNotification={showNotification}
            isAdmin={true}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

export default ClientDetailsModal; 