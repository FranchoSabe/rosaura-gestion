import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus,
  ArrowRight,
  BarChart3,
  Utensils,
  DollarSign,
  UserCheck,
  Phone,
  MapPin,
  Zap
} from 'lucide-react';
import { formatDateToString } from '../../../../utils';
import styles from './Dashboard.module.css';

/**
 * Dashboard Ejecutivo - Vista de alto nivel para gerencia
 * 
 * Muestra métricas generales, resúmenes y accesos rápidos
 * Reemplaza el Dashboard operativo que ahora está en Reservas
 */
const Dashboard = ({
  // Props de datos
  reservations = [],
  waitingList = [],
  
  // Props de utilidades
  formatDate,
  HORARIOS = {},
  
  // Props de UI
  showNotification,
  
  // Props de navegación
  onCreateReservation
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(formatDateToString(new Date()));

  // Métricas calculadas
  const metrics = useMemo(() => {
    const today = formatDateToString(new Date());
    const todayReservations = reservations.filter(r => r.fecha === today);
    const todayWaiting = waitingList.filter(w => w.fecha === today && w.status !== 'rejected');
    
    // Reservas por turno
    const mediodiaReservations = todayReservations.filter(r => r.turno === 'mediodia');
    const nocheReservations = todayReservations.filter(r => r.turno === 'noche');
    
    // Ocupación estimada (basada en capacidad total de ~50 personas)
    const totalPersonasHoy = todayReservations.reduce((sum, r) => sum + (r.personas || 0), 0);
    const ocupacionPorcentaje = Math.min((totalPersonasHoy / 50) * 100, 100);
    
    // Ingresos estimados (precio promedio por persona: $8000)
    const ingresosEstimados = totalPersonasHoy * 8000;
    
    // Clientes nuevos (últimos 7 días)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const clientesNuevos = reservations.filter(r => {
      const reservaDate = new Date(r.fecha);
      return reservaDate >= weekAgo && r.cliente?.ultimaReserva === r.fecha;
    }).length;
    
    return {
      reservasHoy: todayReservations.length,
      reservasMediodia: mediodiaReservations.length,
      reservasNoche: nocheReservations.length,
      personasHoy: totalPersonasHoy,
      ocupacionPorcentaje: Math.round(ocupacionPorcentaje),
      ingresosEstimados,
      listaEspera: todayWaiting.length,
      clientesNuevos,
      mesasAsignadas: todayReservations.filter(r => r.mesaAsignada).length,
      mesasPendientes: todayReservations.filter(r => !r.mesaAsignada).length
    };
  }, [reservations, waitingList]);

  // Próximas reservas importantes
  const proximasReservas = useMemo(() => {
    const ahora = new Date();
    const hoy = formatDateToString(ahora);
    
    return reservations
      .filter(r => r.fecha >= hoy)
      .sort((a, b) => {
        // Ordenar por fecha y luego por horario
        if (a.fecha !== b.fecha) {
          return a.fecha.localeCompare(b.fecha);
        }
        const timeA = a.horario?.replace(':', '') || '0000';
        const timeB = b.horario?.replace(':', '') || '0000';
        return timeA.localeCompare(timeB);
      })
      .slice(0, 5); // Mostrar solo las primeras 5
  }, [reservations]);

  // Alertas del sistema
  const alertas = useMemo(() => {
    const alerts = [];
    
    // Mesas sin asignar
    if (metrics.mesasPendientes > 0) {
      alerts.push({
        type: 'warning',
        message: `${metrics.mesasPendientes} mesa(s) sin asignar para hoy`,
        action: () => navigate('/admin/reservas'),
        actionText: 'Asignar mesas'
      });
    }
    
    // Lista de espera activa
    if (metrics.listaEspera > 0) {
      alerts.push({
        type: 'info',
        message: `${metrics.listaEspera} cliente(s) en lista de espera`,
        action: () => navigate('/admin/reservas'),
        actionText: 'Ver lista'
      });
    }
    
    // Ocupación alta
    if (metrics.ocupacionPorcentaje > 85) {
      alerts.push({
        type: 'success',
        message: `¡Ocupación alta! ${metrics.ocupacionPorcentaje}% de capacidad`,
        action: () => navigate('/admin/reservas'),
        actionText: 'Ver detalles'
      });
    }
    
    return alerts;
  }, [metrics, navigate]);

  // Navegación rápida
  const quickActions = [
    {
      title: 'Gestión de Reservas',
      description: 'Mapa interactivo, asignación de mesas',
      icon: Calendar,
      color: 'blue',
      action: () => navigate('/admin/reservas')
    },
    {
      title: 'Clientes',
      description: 'Base de datos de clientes',
      icon: Users,
      color: 'green',
      action: () => navigate('/admin/clients')
    },
    {
      title: 'Proveedores',
      description: 'Gestión de proveedores',
      icon: UserCheck,
      color: 'purple',
      action: () => navigate('/admin/proveedores')
    },
    {
      title: 'Ventas',
      description: 'Análisis de ventas e ingresos',
      icon: TrendingUp,
      color: 'orange',
      action: () => navigate('/admin/ventas')
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Header con fecha y acciones principales */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <h1>Dashboard Ejecutivo</h1>
            <p className={styles.currentDate}>
              {formatDate ? formatDate(selectedDate) : selectedDate}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={() => navigate('/admin/reservas')}
              className={styles.primaryButton}
            >
              <Plus size={16} />
              <span>Nueva Reserva</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alertas del sistema */}
      {alertas.length > 0 && (
        <div className={styles.alertsSection}>
          <h3>🚨 Alertas</h3>
          <div className={styles.alertsList}>
            {alertas.map((alert, index) => (
              <div key={index} className={`${styles.alert} ${styles[`alert-${alert.type}`]}`}>
                <div className={styles.alertContent}>
                  <span className={styles.alertMessage}>{alert.message}</span>
                  {alert.action && (
                    <button 
                      onClick={alert.action}
                      className={styles.alertAction}
                    >
                      {alert.actionText}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métricas principales */}
      <div className={styles.metricsSection}>
        <h3>📊 Métricas de Hoy</h3>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <Calendar size={24} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricNumber}>{metrics.reservasHoy}</div>
              <div className={styles.metricLabel}>Reservas Hoy</div>
              <div className={styles.metricSubtext}>
                {metrics.reservasMediodia} mediodía • {metrics.reservasNoche} noche
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <Users size={24} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricNumber}>{metrics.personasHoy}</div>
              <div className={styles.metricLabel}>Personas Hoy</div>
              <div className={styles.metricSubtext}>
                {metrics.ocupacionPorcentaje}% ocupación
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <DollarSign size={24} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricNumber}>
                ${metrics.ingresosEstimados.toLocaleString()}
              </div>
              <div className={styles.metricLabel}>Ingresos Estimados</div>
              <div className={styles.metricSubtext}>
                Promedio por persona: $8,000
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>
              <Clock size={24} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricNumber}>{metrics.listaEspera}</div>
              <div className={styles.metricLabel}>Lista de Espera</div>
              <div className={styles.metricSubtext}>
                {metrics.clientesNuevos} clientes nuevos esta semana
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de mesas */}
      <div className={styles.tablesSection}>
        <h3>🍽️ Estado de Mesas</h3>
        <div className={styles.tablesGrid}>
          <div className={styles.tableStatus}>
            <div className={styles.statusIcon}>
              <CheckCircle size={20} />
            </div>
            <div className={styles.statusContent}>
              <div className={styles.statusNumber}>{metrics.mesasAsignadas}</div>
              <div className={styles.statusLabel}>Mesas Asignadas</div>
            </div>
          </div>

          <div className={styles.tableStatus}>
            <div className={styles.statusIcon}>
              <AlertTriangle size={20} />
            </div>
            <div className={styles.statusContent}>
              <div className={styles.statusNumber}>{metrics.mesasPendientes}</div>
              <div className={styles.statusLabel}>Pendientes</div>
            </div>
          </div>

          <div className={styles.tableStatus}>
            <div className={styles.statusIcon}>
              <MapPin size={20} />
            </div>
            <div className={styles.statusContent}>
              <div className={styles.statusNumber}>
                {Math.round(metrics.ocupacionPorcentaje)}%
              </div>
              <div className={styles.statusLabel}>Ocupación</div>
            </div>
          </div>
        </div>
      </div>

      {/* Próximas reservas */}
      <div className={styles.upcomingSection}>
        <div className={styles.sectionHeader}>
          <h3>📅 Próximas Reservas</h3>
          <button 
            onClick={() => navigate('/admin/reservas')}
            className={styles.viewAllButton}
          >
            Ver todas
            <ArrowRight size={14} />
          </button>
        </div>
        
        <div className={styles.reservationsList}>
          {proximasReservas.length > 0 ? (
            proximasReservas.map((reserva, index) => (
              <div key={reserva.id} className={styles.reservationCard}>
                <div className={styles.reservationTime}>
                  <div className={styles.reservationDate}>
                    {formatDate ? formatDate(reserva.fecha) : reserva.fecha}
                  </div>
                  <div className={styles.reservationHour}>
                    {reserva.horario}
                  </div>
                </div>
                <div className={styles.reservationDetails}>
                  <div className={styles.reservationName}>
                    {reserva.cliente?.nombre || 'Sin nombre'}
                  </div>
                  <div className={styles.reservationInfo}>
                    {reserva.personas} personas • {reserva.turno}
                    {reserva.mesaAsignada && (
                      <span className={styles.tableAssigned}>
                        • Mesa {reserva.mesaAsignada}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.reservationStatus}>
                  {reserva.mesaAsignada ? (
                    <CheckCircle size={16} className={styles.statusAssigned} />
                  ) : (
                    <AlertTriangle size={16} className={styles.statusPending} />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <Calendar size={48} />
              <p>No hay reservas próximas</p>
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className={styles.quickActionsSection}>
        <h3>⚡ Acciones Rápidas</h3>
        <div className={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <button 
              key={index}
              onClick={action.action}
              className={`${styles.quickActionCard} ${styles[`color-${action.color}`]}`}
            >
              <div className={styles.quickActionIcon}>
                <action.icon size={24} />
              </div>
              <div className={styles.quickActionContent}>
                <div className={styles.quickActionTitle}>{action.title}</div>
                <div className={styles.quickActionDescription}>{action.description}</div>
              </div>
              <div className={styles.quickActionArrow}>
                <ArrowRight size={16} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 