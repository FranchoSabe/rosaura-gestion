import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './NotificationContainer.module.css';

const NotificationContainer = ({ notifications, onClose }) => {
  if (!notifications || notifications.length === 0) return null;

  // Ordenar por prioridad (críticas primero, luego importantes, rutinarias al final)
  const sortedNotifications = [...notifications].sort((a, b) => {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
  });

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} style={{ color: '#059669' }} />;
      case 'error': return <XCircle size={18} style={{ color: '#dc2626' }} />;
      case 'warning': return <AlertTriangle size={18} style={{ color: '#d97706' }} />;
      case 'info': return <Info size={18} style={{ color: '#3b82f6' }} />;
      default: return <CheckCircle size={18} style={{ color: '#3b82f6' }} />;
    }
  };

  const getNotificationClass = (notification) => {
    let baseClass = `${styles.notification}`;
    
    // Clases por tipo
    switch (notification.type) {
      case 'success': 
        baseClass += ` ${styles.notificationSuccess}`;
        break;
      case 'error': 
        baseClass += ` ${styles.notificationError}`;
        break;
      case 'warning': 
        baseClass += ` ${styles.notificationWarning}`;
        break;
      case 'info': 
        baseClass += ` ${styles.notificationInfo}`;
        break;
      default: 
        baseClass += ` ${styles.notificationInfo}`;
    }
    
    // Clases por prioridad (diferentes tamaños y posiciones)
    switch (notification.priority) {
      case 'high':
        baseClass += ` ${styles.notificationCritical}`;
        break;
      case 'medium':
        baseClass += ` ${styles.notificationImportant}`;
        break;
      case 'low':
        baseClass += ` ${styles.notificationRoutine}`;
        break;
    }
    
    return baseClass;
  };

  const getTitle = (notification) => {
    if (notification.category === 'critical') return 'Error Crítico';
    if (notification.category === 'important') return 'Acción Importante';
    if (notification.category === 'routine') return '';
    
    switch (notification.type) {
      case 'success': return 'Completado';
      case 'error': return 'Error';
      case 'warning': return 'Atención';
      case 'info': return 'Información';
      default: return 'Información';
    }
  };

  return (
    <div className={styles.notificationContainer}>
      {sortedNotifications.map(notification => (
        <div key={notification.id} className={getNotificationClass(notification)}>
          <div className={styles.notificationIcon}>
            {getIcon(notification.type)}
          </div>
          <div className={styles.notificationContent}>
            {getTitle(notification) && (
              <div className={styles.notificationTitle}>
                {getTitle(notification)}
              </div>
            )}
            <div className={styles.notificationMessage}>{notification.message}</div>
          </div>
          <button onClick={() => onClose(notification.id)} className={styles.notificationClose}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer; 