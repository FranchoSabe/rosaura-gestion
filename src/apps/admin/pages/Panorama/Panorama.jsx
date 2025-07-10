import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, Users, Phone, Clock, X } from 'lucide-react';
import { UNIFIED_TABLES_LAYOUT } from '../../../../utils/tablesLayout';
import { calculateAutoAssignments } from '../../../../utils/mesaLogic';
import styles from './Panorama.module.css';

// TurnoPreviewModal - Modal para preview de turno específico
const TurnoPreviewModal = ({ preview, onClose, onGoToDailyView, currentDate, currentTurno, tableAssignments }) => {
  const handleGoToDaily = () => {
    onGoToDailyView(preview.date, preview.turno);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // RestaurantTableMap simplificado para preview
  const RestaurantTableMap = ({ reservas, fecha, turno, previewMode = false, className = "w-full h-auto", useRealAssignments = false }) => {
    const isMesaOcupada = (mesaId) => {
      return reservas.some(reserva => {
        if (!reserva.mesaAsignada) return false;
        
        // Si es una mesa individual
        if (reserva.mesaAsignada === mesaId) {
          return true;
        }
        
        // Si es una combinación (formato "11+21")
        if (typeof reserva.mesaAsignada === 'string' && reserva.mesaAsignada.includes('+')) {
          const tableIds = reserva.mesaAsignada.split('+').map(id => parseInt(id));
          if (tableIds.includes(mesaId)) {
            return true;
          }
        }
        
        return false;
      });
    };

    const isMesaBloqueada = (mesaId) => {
      // En preview, usar el estado automático
      const { blockedTables } = calculateAutoAssignments(reservas, new Set([4, 5, 14, 24]));
      return blockedTables.has(mesaId);
    };

    return (
      <div className={className}>
        <svg viewBox="0 0 800 600" width="100%" height="100%">
          {/* Renderizado simplificado del mapa */}
          {UNIFIED_TABLES_LAYOUT.map((table) => {
            const isOcupada = isMesaOcupada(table.id);
            const isBloqueada = isMesaBloqueada(table.id);
            
            let fillColor = '#f3f4f6'; // Disponible (gris claro)
            if (isOcupada) fillColor = '#dc2626'; // Ocupada (rojo)
            else if (isBloqueada) fillColor = '#fbbf24'; // Bloqueada (amarillo)
            
            return (
              <g key={table.id}>
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.width}
                  height={table.height}
                  fill={fillColor}
                  stroke="#374151"
                  strokeWidth="2"
                  rx="4"
                />
                <text
                  x={table.x + table.width/2}
                  y={table.y + table.height/2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#1f2937"
                >
                  {table.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderContent}>
            <h3>
              Preview - {preview.dateLabel}
            </h3>
            <p>
              {preview.turno === 'mediodia' ? '☀️ Mediodía' : '🌙 Noche'} • {preview.reservas.length} reservas
            </p>
          </div>
          <div className={styles.modalHeaderActions}>
            <button
              onClick={handleGoToDaily}
              className={styles.modalGoToDailyButton}
            >
              <Calendar size={16} />
              Ir a Gestión Diaria
            </button>
            <button
              onClick={onClose}
              className={styles.modalCloseButton}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className={styles.modalContent}>
          <div className={styles.modalGrid}>
            {/* Mapa de Mesas - Preview Compacto */}
            <div className={styles.modalSection}>
              <h4 className={styles.modalSectionTitle}>Disposición de Mesas</h4>
              <div className={styles.modalMapContainer}>
                <RestaurantTableMap 
                  reservas={preview.reservas} 
                  fecha={preview.date}
                  turno={preview.turno}
                  previewMode={true}
                  className={styles.modalMapSvg}
                  useRealAssignments={true}
                />
              </div>
            </div>

            {/* Lista de Reservas */}
            <div className={styles.modalSection}>
              <h4 className={styles.modalSectionTitle}>
                Reservas del Turno ({preview.reservas.length})
              </h4>
              
              {preview.reservas.length === 0 ? (
                <div className={styles.modalEmptyState}>
                  <Clock size={48} className={styles.modalEmptyStateIcon} />
                  <p>No hay reservas para este turno</p>
                </div>
              ) : (
                <div className={styles.modalReservationsList}>
                  {preview.reservas
                    .sort((a, b) => a.horario.localeCompare(b.horario))
                    .map((reserva) => (
                    <div key={`preview-modal-${reserva.id}-${reserva.horario}`} className={styles.modalReservationCard}>
                      <div className={styles.modalReservationHeader}>
                        <div className={styles.modalReservationContent}>
                          <div className={styles.modalReservationBadges}>
                            <span className={styles.modalTimeBadge}>
                              {reserva.horario}
                            </span>
                            {(reserva.mesaAsignada || (tableAssignments && tableAssignments[reserva.id])) && (
                              <span className={styles.modalTableBadge}>
                                Mesa {reserva.mesaAsignada || (tableAssignments && tableAssignments[reserva.id])}
                              </span>
                            )}
                          </div>
                          <div className={styles.modalReservationName}>
                            {reserva.cliente?.nombre || 'Sin nombre'}
                          </div>
                          <div className={styles.modalReservationDetails}>
                            <span className={styles.modalReservationDetail}>
                              <Users size={14} />
                              {reserva.personas} personas
                            </span>
                            {reserva.cliente?.telefono && (
                              <span className={styles.modalReservationDetail}>
                                <Phone size={14} />
                                {reserva.cliente.telefono}
                              </span>
                            )}
                          </div>
                          {reserva.comentarios && (
                            <div className={styles.modalReservationComments}>
                              "{reserva.comentarios}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer con resumen */}
          <div className={styles.modalFooter}>
            <div className={styles.modalStatsGrid}>
              <div className={`${styles.modalStatCard} ${styles.modalStatCardBlue}`}>
                <div className={`${styles.modalStatNumber} ${styles.modalStatNumberBlue}`}>{preview.reservas.length}</div>
                <div className={`${styles.modalStatLabel} ${styles.modalStatLabelBlue}`}>Reservas</div>
              </div>
              <div className={`${styles.modalStatCard} ${styles.modalStatCardGreen}`}>
                <div className={`${styles.modalStatNumber} ${styles.modalStatNumberGreen}`}>
                  {preview.reservas.reduce((sum, r) => sum + r.personas, 0)}
                </div>
                <div className={`${styles.modalStatLabel} ${styles.modalStatLabelGreen}`}>Personas</div>
              </div>
              <div className={`${styles.modalStatCard} ${styles.modalStatCardYellow}`}>
                <div className={`${styles.modalStatNumber} ${styles.modalStatNumberYellow}`}>
                  {(() => {
                    const isCurrentView = preview.date === currentDate && preview.turno === currentTurno;
                    if (isCurrentView && tableAssignments) {
                      return Object.keys(tableAssignments).length;
                    } else {
                      const { assignments } = calculateAutoAssignments(preview.reservas, new Set([4, 5, 14, 24]));
                      return Object.keys(assignments).length;
                    }
                  })()}
                </div>
                <div className={`${styles.modalStatLabel} ${styles.modalStatLabelYellow}`}>Mesas Ocupadas</div>
              </div>
              <div className={`${styles.modalStatCard} ${styles.modalStatCardOrange}`}>
                <div className={`${styles.modalStatNumber} ${styles.modalStatNumberOrange}`}>
                  {(() => {
                    // Calcular cupos walk-in dinámicos
                    const isCurrentView = preview.date === currentDate && preview.turno === currentTurno;
                    const blockedTablesForCalc = isCurrentView ? new Set([4, 5, 14, 24]) : (() => {
                      const { blockedTables } = calculateAutoAssignments(preview.reservas, new Set([4, 5, 14, 24]));
                      return blockedTables;
                    })();
                    return [...blockedTablesForCalc].reduce((total, tableId) => {
                      const table = UNIFIED_TABLES_LAYOUT.find(t => t.id === tableId);
                      return total + (table ? table.capacity : 0);
                    }, 0);
                  })()}
                </div>
                <div className={`${styles.modalStatLabel} ${styles.modalStatLabelOrange}`}>Cupos Walk-in</div>
              </div>
              <div className={`${styles.modalStatCard} ${styles.modalStatCardPurple}`}>
                <div className={`${styles.modalStatNumber} ${styles.modalStatNumberPurple}`}>
                  {Math.round((preview.reservas.reduce((sum, r) => sum + r.personas, 0) / 36) * 100)}%
                </div>
                <div className={`${styles.modalStatLabel} ${styles.modalStatLabelPurple}`}>Ocupación</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal Panorama
const Panorama = ({ reservations, formatDate, onGoToDailyView }) => {
  const [selectedTurnoPreview, setSelectedTurnoPreview] = useState(null);

  // Obtener próximos 7 días excluyendo lunes (cerrado ambos turnos)
  const getNext7Days = useCallback(() => {
    const days = [];
    const today = new Date();
    let currentDate = new Date(today);
    
    while (days.length < 7) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 1) { // Excluir lunes (cerrado ambos turnos)
        days.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, []);

  const next7Days = useMemo(() => getNext7Days(), [getNext7Days]);

  // Calcular estadísticas por día
  const getDayStats = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayReservations = reservations.filter(r => r.fecha === dateStr);
    
    const mediodiaReservations = dayReservations.filter(r => r.turno === 'mediodia');
    const nocheReservations = dayReservations.filter(r => r.turno === 'noche');
    
    const totalPersonasMediodia = mediodiaReservations.reduce((sum, r) => sum + r.personas, 0);
    const totalPersonasNoche = nocheReservations.reduce((sum, r) => sum + r.personas, 0);
    
    // Capacidad máxima aproximada por turno (basada en las mesas disponibles)
    const maxCapacityPerShift = 36; // 4*2 + 4*4 + 1*6 = 8 + 16 + 6 = 30, pero ajustamos a 36 para ser más realistas
    
    const isDomingo = date.getDay() === 0;
    
    return {
      date: dateStr,
      dayName: date.toLocaleDateString('es-AR', { weekday: 'long' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('es-AR', { month: 'short' }),
      totalReservations: dayReservations.length,
      mediodiaStats: {
        reservations: mediodiaReservations.length,
        personas: totalPersonasMediodia,
        ocupacion: Math.round((totalPersonasMediodia / maxCapacityPerShift) * 100)
      },
      nocheStats: isDomingo ? null : {
        reservations: nocheReservations.length,
        personas: totalPersonasNoche,
        ocupacion: Math.round((totalPersonasNoche / maxCapacityPerShift) * 100)
      },
      isDomingo,
      mediodiaReservations,
      nocheReservations
    };
  }, [reservations]);

  const getOccupancyColorClass = (ocupacion) => {
    if (ocupacion >= 90) return styles.occupancyFull;
    if (ocupacion >= 70) return styles.occupancyVeryHigh;
    if (ocupacion >= 50) return styles.occupancyHigh;
    if (ocupacion >= 30) return styles.occupancyModerate;
    return styles.occupancyLow;
  };

  const getOccupancyTextClass = (ocupacion) => {
    return ocupacion >= 30 ? styles.occupancyTextWhite : styles.occupancyTextLight;
  };

  // Función para abrir preview de turno
  const handleTurnoClick = (date, turno, reservas) => {
    setSelectedTurnoPreview({
      date,
      turno,
      reservas,
      dateLabel: formatDate(date)
    });
  };

  // Función para ir a gestión diaria
  const handleGoToDailyView = (date, turno) => {
    if (onGoToDailyView) {
      onGoToDailyView(date, turno);
    }
  };

  return (
    <div className={styles.panoramaContainer}>
      <div className={styles.panoramaCard}>
        <h2 className={styles.panoramaTitle}>Panorama de Reservas - Próximos 7 Días</h2>
        
        <div className={styles.panoramaGrid}>
          {next7Days.map((date, index) => {
            const stats = getDayStats(date);
            
            return (
              <div key={index} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <div className={styles.dayName}>
                    {stats.dayName}
                  </div>
                  <div className={styles.dayDate}>
                    {stats.dayNumber} {stats.month}
                  </div>
                </div>
                
                <div className={styles.shiftsContainer}>
                  {/* Mediodía */}
                  <div 
                    className={styles.shiftCard}
                    onClick={() => handleTurnoClick(stats.date, 'mediodia', stats.mediodiaReservations)}
                  >
                    <div className={styles.shiftHeader}>
                      <div className={styles.shiftInfo}>
                        <span className={styles.shiftIcon}>☀️</span>
                        <span className={styles.shiftName}>Mediodía</span>
                      </div>
                      <span className={styles.shiftReservations}>
                        {stats.mediodiaStats.reservations} reservas
                      </span>
                    </div>
                    <div className={styles.occupancyBar}>
                      <div className={styles.occupancyProgress}>
                        <div 
                          className={`${styles.occupancyFill} ${getOccupancyColorClass(stats.mediodiaStats.ocupacion)}`}
                          style={{ width: `${Math.min(stats.mediodiaStats.ocupacion, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`${styles.occupancyBadge} ${getOccupancyColorClass(stats.mediodiaStats.ocupacion)} ${getOccupancyTextClass(stats.mediodiaStats.ocupacion)}`}>
                        {stats.mediodiaStats.ocupacion}%
                      </span>
                    </div>
                    <div className={styles.occupancyPersons}>
                      {stats.mediodiaStats.personas} personas
                    </div>
                  </div>

                  {/* Noche */}
                  {!stats.isDomingo ? (
                    <div 
                      className={styles.shiftCard}
                      onClick={() => handleTurnoClick(stats.date, 'noche', stats.nocheReservations)}
                    >
                      <div className={styles.shiftHeader}>
                        <div className={styles.shiftInfo}>
                          <span className={styles.shiftIcon}>🌙</span>
                          <span className={styles.shiftName}>Noche</span>
                        </div>
                        <span className={styles.shiftReservations}>
                          {stats.nocheStats.reservations} reservas
                        </span>
                      </div>
                      <div className={styles.occupancyBar}>
                        <div className={styles.occupancyProgress}>
                          <div 
                            className={`${styles.occupancyFill} ${getOccupancyColorClass(stats.nocheStats.ocupacion)}`}
                            style={{ width: `${Math.min(stats.nocheStats.ocupacion, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`${styles.occupancyBadge} ${getOccupancyColorClass(stats.nocheStats.ocupacion)} ${getOccupancyTextClass(stats.nocheStats.ocupacion)}`}>
                          {stats.nocheStats.ocupacion}%
                        </span>
                      </div>
                      <div className={styles.occupancyPersons}>
                        {stats.nocheStats.personas} personas
                      </div>
                    </div>
                  ) : (
                    <div className={styles.shiftCardClosed}>
                      <div className={styles.shiftHeader}>
                        <div className={styles.shiftInfo}>
                          <span className={styles.shiftIcon}>🌙</span>
                          <span className={styles.shiftName}>Noche</span>
                        </div>
                      </div>
                      <div className={styles.occupancyPersons}>Cerrado los domingos</div>
                    </div>
                  )}
                </div>

                {/* Total del día */}
                <div className={styles.dayTotal}>
                  <div className={styles.dayTotalContent}>
                    <span className={styles.dayTotalLabel}>Total del día:</span>
                    <span className={styles.dayTotalValue}>
                      {stats.totalReservations} reservas
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className={styles.legend}>
          <h3 className={styles.legendTitle}>Leyenda de ocupación:</h3>
          <div className={styles.legendGrid}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.occupancyLow}`}></div>
              <span>0-29% - Baja</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.occupancyModerate}`}></div>
              <span>30-49% - Moderada</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.occupancyHigh}`}></div>
              <span>50-69% - Alta</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.occupancyVeryHigh}`}></div>
              <span>70-89% - Muy alta</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.occupancyFull}`}></div>
              <span>90%+ - Completa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Preview del Turno */}
      {selectedTurnoPreview && (
        <TurnoPreviewModal
          preview={selectedTurnoPreview}
          onClose={() => setSelectedTurnoPreview(null)}
          onGoToDailyView={handleGoToDailyView}
          currentDate={new Date().toISOString().split('T')[0]}
          currentTurno="mediodia"
          tableAssignments={{}}
        />
      )}
    </div>
  );
};

export default Panorama; 