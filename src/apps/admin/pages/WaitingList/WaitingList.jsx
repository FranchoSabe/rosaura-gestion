import React, { useState, useMemo } from 'react';
import { Check, X, MessageCircle, Clock } from 'lucide-react';
import styles from './WaitingList.module.css';

// Importar utilidades para formatear teléfono
const formatPhoneForWhatsApp = (phone) => {
  // Limpiar el teléfono de espacios y caracteres especiales
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Si no empieza con código de país, agregar +54 (Argentina)
  if (!cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
    if (cleanPhone.startsWith('9')) {
      cleanPhone = '54' + cleanPhone;
    } else {
      cleanPhone = '549' + cleanPhone;
    }
  }
  
  return cleanPhone;
};

const WaitingList = ({ 
  waitingList = [], 
  reservations = [],
  clients = [],
  onConfirmWaitingReservation,
  onDeleteWaitingReservation,
  onContactWaitingClient,
  onRejectWaitingReservation,
  getAvailableSlots,
  formatDate,
  HORARIOS = {},
  showNotification,
  showConfirmation,
  blockedTables = new Set()
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending'); // 'all', 'pending', 'contacted', 'expired'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedWaiting, setSelectedWaiting] = useState(null);
  const [selectedHorario, setSelectedHorario] = useState('');
  const [selectedMesa, setSelectedMesa] = useState('');

  // Calcular estadísticas
  const waitingStats = useMemo(() => {
    const now = new Date();
    
    const pending = waitingList.filter(w => 
      w.status !== 'rejected' && !w.contacted
    ).length;
    
    const contacted = waitingList.filter(w => 
      w.contacted && !w.awaitingConfirmation
    ).length;
    
    const awaitingConfirmation = waitingList.filter(w => 
      w.contacted && w.awaitingConfirmation && 
      (!w.confirmationDeadline || new Date(w.confirmationDeadline) > now)
    ).length;
    
    const expired = waitingList.filter(w => 
      w.contacted && w.awaitingConfirmation && 
      w.confirmationDeadline && new Date(w.confirmationDeadline) <= now
    ).length;

    return {
      total: waitingList.filter(w => w.status !== 'rejected').length,
      pending,
      contacted,
      awaitingConfirmation,
      expired
    };
  }, [waitingList]);

  // Filtrar lista de espera por fecha y otros criterios
  const filteredWaitingList = useMemo(() => {
    return waitingList.filter(waiting => {
      if (waiting.status === 'rejected') return false;
      
      // Filtro por fecha
      if (selectedDate && waiting.fecha !== selectedDate) return false;
      
      // Filtro por turno
      if (selectedTurno && waiting.turno !== selectedTurno) return false;
      
      // Filtro por estado
      if (selectedStatus !== 'all') {
        const now = new Date();
        const isExpired = waiting.contacted && waiting.awaitingConfirmation && 
                         waiting.confirmationDeadline && new Date(waiting.confirmationDeadline) <= now;
        
        switch (selectedStatus) {
          case 'pending':
            if (waiting.contacted) return false;
            break;
          case 'contacted':
            if (!waiting.contacted || waiting.awaitingConfirmation) return false;
            break;
          case 'awaiting':
            if (!waiting.contacted || !waiting.awaitingConfirmation || isExpired) return false;
            break;
          case 'expired':
            if (!isExpired) return false;
            break;
          default:
            break;
        }
      }
      
      // Filtro por búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          waiting.cliente?.nombre?.toLowerCase().includes(searchLower) ||
          waiting.cliente?.telefono?.includes(searchTerm) ||
          waiting.waitingId?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [waitingList, selectedDate, selectedTurno, selectedStatus, searchTerm]);

  // Obtener historial de reservas para cada cliente filtrando por nombre Y teléfono
  const getClientHistory = (waiting) => {
    if (!waiting?.cliente || !reservations) return [];
    
    // Normalizar nombre y teléfono para buscar coincidencias
    const normalizedWaitingName = waiting.cliente.nombre.toLowerCase().trim();
    const normalizedWaitingPhone = waiting.cliente.telefono.replace(/\D/g, ''); // Solo números
    
    // Buscar todas las reservas con el mismo nombre Y teléfono
    return reservations.filter(reservation => {
      if (!reservation?.cliente?.nombre || !reservation?.cliente?.telefono) return false;
      
      const resNormalizedName = reservation.cliente.nombre.toLowerCase().trim();
      const resNormalizedPhone = reservation.cliente.telefono.replace(/\D/g, '');
      
      // Filtrar por nombre Y teléfono (ambos deben coincidir)
      return normalizedWaitingName === resNormalizedName && 
             normalizedWaitingPhone && resNormalizedPhone && 
             normalizedWaitingPhone === resNormalizedPhone;
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar por fecha más reciente
  };

  const handleContactClient = async (waiting) => {
    try {
      await onContactWaitingClient(waiting.id);
      
      const whatsappPhone = formatPhoneForWhatsApp(waiting.cliente.telefono);
      const fechaFormateada = formatDate(waiting.fecha);
      const turnoTexto = waiting.turno === 'mediodia' ? 'mediodía' : 'noche';
      
      const mensaje = `¡Hola ${waiting.cliente.nombre}! 🌹 
      
Tenemos buenas noticias. Hay disponibilidad para tu solicitud de reserva:
📅 ${fechaFormateada} - ${turnoTexto}
👥 ${waiting.personas} personas

Por favor confirma si quieres tomar esta reserva respondiendo "SÍ" a este mensaje. 

⏰ Si no recibimos confirmación en 30 minutos, el cupo será ofrecido a la siguiente persona en lista de espera.

¡Esperamos verte pronto en Rosaura!`;

      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappUrl, '_blank');
      
      showNotification('success', 'Cliente contactado. Esperando confirmación...');
    } catch (error) {
      showNotification('error', 'Error al contactar cliente');
    }
  };

  const handleConfirmReservation = (waiting) => {
    setSelectedWaiting(waiting);
    setSelectedHorario('');
    setSelectedMesa('');
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedHorario || !selectedMesa) {
      showNotification('error', 'Selecciona horario y mesa');
      return;
    }

    try {
      await onConfirmWaitingReservation(selectedWaiting.id, selectedWaiting, selectedHorario, blockedTables);
      showNotification('success', 'Reserva confirmada exitosamente');
      setShowConfirmModal(false);
      setSelectedWaiting(null);
    } catch (error) {
      showNotification('error', 'Error al confirmar reserva');
    }
  };

  const handleRejectReservation = async (waiting) => {
    const confirmed = await showConfirmation({
      title: 'Rechazar solicitud',
      message: `¿Estás seguro de rechazar la solicitud de ${waiting.cliente.nombre}?`,
      confirmText: 'Rechazar',
      cancelText: 'Cancelar'
    });

    if (confirmed) {
      try {
        await onRejectWaitingReservation(waiting.id, 'Rechazada por administración');
        showNotification('success', 'Solicitud rechazada');
      } catch (error) {
        showNotification('error', 'Error al rechazar solicitud');
      }
    }
  };

  const getStatusBadge = (waiting) => {
    if (waiting.contacted && waiting.awaitingConfirmation) {
      const now = new Date();
      const deadline = new Date(waiting.confirmationDeadline);
      const isExpired = now > deadline;
      
      if (isExpired) {
        return (
          <span className={styles.statusExpired}>
            <Clock size={12} />
            Expirado
          </span>
        );
      } else {
        return (
          <span className={styles.statusAwaiting}>
            <Clock size={12} />
            Esperando
          </span>
        );
      }
    }
    
    if (waiting.contacted) {
      return (
        <span className={styles.statusContacted}>
          <MessageCircle size={12} />
          Contactado
        </span>
      );
    }
    
    return (
      <span className={styles.statusPending}>
        <Clock size={12} />
        En espera
      </span>
    );
  };

  const handleStatCardClick = (filterType) => {
    setSelectedStatus(filterType);
  };

  const availableHorarios = selectedWaiting ? getAvailableSlots(selectedWaiting.fecha, selectedWaiting.turno) : [];

  return (
    <div className={styles.waitingContainer}>
      {/* Header con estadísticas */}
      <div className={styles.waitingHeader}>
        <div className={styles.headerContent}>
          <h2 className={styles.pageTitle}>Lista de Espera</h2>
          <div className={styles.statsGrid}>
            <div 
              className={`${styles.statCard} ${selectedStatus === 'all' ? styles.active : ''}`}
              onClick={() => handleStatCardClick('all')}
              title="Ver todas las solicitudes"
            >
              <span className={styles.statNumber}>{waitingStats.total}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div 
              className={`${styles.statCard} ${selectedStatus === 'pending' ? styles.active : ''}`}
              onClick={() => handleStatCardClick('pending')}
              title="Ver solicitudes pendientes"
            >
              <span className={`${styles.statNumber} ${styles.statBlue}`}>{waitingStats.pending}</span>
              <span className={styles.statLabel}>Pendientes</span>
            </div>
            <div 
              className={`${styles.statCard} ${selectedStatus === 'awaiting' ? styles.active : ''}`}
              onClick={() => handleStatCardClick('awaiting')}
              title="Ver solicitudes esperando confirmación"
            >
              <span className={`${styles.statNumber} ${styles.statOrange}`}>{waitingStats.awaitingConfirmation}</span>
              <span className={styles.statLabel}>Esperando</span>
            </div>
            <div 
              className={`${styles.statCard} ${selectedStatus === 'expired' ? styles.active : ''}`}
              onClick={() => handleStatCardClick('expired')}
              title="Ver solicitudes expiradas"
            >
              <span className={`${styles.statNumber} ${styles.statRed}`}>{waitingStats.expired}</span>
              <span className={styles.statLabel}>Expiradas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.filterSelect}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              value={selectedTurno}
              onChange={(e) => setSelectedTurno(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todos los turnos</option>
              <option value="mediodia">Mediodía</option>
              <option value="noche">Noche</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="pending">Pendientes</option>
              <option value="all">Todas</option>
              <option value="contacted">Contactadas</option>
              <option value="awaiting">Esperando</option>
              <option value="expired">Expiradas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de lista de espera */}
      <div className={styles.tableContainer}>
        <table className={styles.waitingTable}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.headerCell}>Cliente</th>
              <th className={styles.headerCell}>Teléfono</th>
              <th className={styles.headerCell}>Fecha & Turno</th>
              <th className={styles.headerCell}>Personas</th>
              <th className={styles.headerCell}>Historial</th>
              <th className={styles.headerCell}>Estado</th>
              <th className={styles.headerCell}>Notas</th>
              <th className={styles.headerCell}>Acciones</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {filteredWaitingList.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.emptyState}>
                  No hay solicitudes en lista de espera para los filtros seleccionados
                </td>
              </tr>
            ) : (
              filteredWaitingList.map((waiting) => {
                const clientHistory = getClientHistory(waiting);
                return (
                  <tr key={`waiting-list-view-${waiting.id}`} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div className={styles.clientInfo}>
                        <div className={styles.clientName}>{waiting.cliente.nombre}</div>
                        <div className={styles.waitingId}>{waiting.waitingId}</div>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <a 
                        href={`https://wa.me/${formatPhoneForWhatsApp(waiting.cliente.telefono)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.phoneLink}
                      >
                        {waiting.cliente.telefono}
                      </a>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.dateInfo}>
                        <div className={styles.date}>{formatDate(waiting.fecha)}</div>
                        <span className={`${styles.turnoBadge} ${
                          waiting.turno === 'mediodia' ? styles.turnoMediodia : styles.turnoNoche
                        }`}>
                          {waiting.turno === 'mediodia' ? 'Mediodía' : 'Noche'}
                        </span>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.personCount}>{waiting.personas}</span>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.historyStats}>
                        <span className={styles.totalReservations}>{clientHistory.length}</span>
                        {clientHistory.filter(r => r.fecha >= new Date().toISOString().split('T')[0]).length > 0 && (
                          <span className={styles.activeReservations}>
                            • {clientHistory.filter(r => r.fecha >= new Date().toISOString().split('T')[0]).length} activa(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      {getStatusBadge(waiting)}
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.notesDisplay}>
                        {waiting.comentarios || waiting.cliente?.notasInternas || waiting.cliente?.comentarios ? (
                          <div className={styles.notesContainer}>
                            {waiting.comentarios && (
                              <div className={styles.waitingNote}>
                                {waiting.comentarios.length > 30 
                                  ? `${waiting.comentarios.substring(0, 30)}...` 
                                  : waiting.comentarios
                                }
                              </div>
                            )}
                            {(waiting.cliente?.notasInternas || waiting.cliente?.comentarios) && (
                              <div className={styles.clientNote}>
                                {(waiting.cliente?.notasInternas || waiting.cliente?.comentarios).length > 30 
                                  ? `${(waiting.cliente?.notasInternas || waiting.cliente?.comentarios).substring(0, 30)}...` 
                                  : (waiting.cliente?.notasInternas || waiting.cliente?.comentarios)
                                }
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={styles.noNotes}>—</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.actionsContainer}>
                        <button
                          onClick={() => handleConfirmReservation(waiting)}
                          className={styles.confirmButton}
                          title="Confirmar reserva"
                        >
                          <Check size={12} />
                          Confirmar
                        </button>
                        
                        <button
                          onClick={() => handleRejectReservation(waiting)}
                          className={styles.rejectButton}
                          title="Rechazar solicitud"
                        >
                          <X size={12} />
                          Rechazar
                        </button>
                        
                        <button
                          onClick={() => handleContactClient(waiting)}
                          className={waiting.contacted ? styles.contactedButton : styles.contactButton}
                          title={waiting.contacted ? 'Ya contactado - Contactar nuevamente' : 'Contactar cliente'}
                        >
                          <MessageCircle size={12} />
                          {waiting.contacted ? 'Recontactar' : 'Contactar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && selectedWaiting && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirmar Reserva</h3>
            <div className={styles.modalInfo}>
              <strong>Cliente:</strong> {selectedWaiting.cliente.nombre}<br />
              <strong>Fecha:</strong> {formatDate(selectedWaiting.fecha)}<br />
              <strong>Turno:</strong> {selectedWaiting.turno === 'mediodia' ? 'Mediodía' : 'Noche'}<br />
              <strong>Personas:</strong> {selectedWaiting.personas}
            </div>

            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>Horario</label>
              <select
                value={selectedHorario}
                onChange={(e) => setSelectedHorario(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="">Seleccionar horario</option>
                {availableHorarios.map(horario => (
                  <option key={horario} value={horario}>{horario}</option>
                ))}
              </select>
            </div>

            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>Mesa</label>
              <select
                value={selectedMesa}
                onChange={(e) => setSelectedMesa(e.target.value)}
                className={styles.modalSelect}
              >
                <option value="">Seleccionar mesa</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(mesa => (
                  <option key={mesa} value={mesa}>Mesa {mesa}</option>
                ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={handleConfirmSubmit}
                className={`${styles.modalButton} ${styles.modalConfirm}`}
              >
                Confirmar Reserva
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`${styles.modalButton} ${styles.modalCancel}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingList; 