import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import styles from './NotificationContainer.module.css';

const NotificationContainer = ({ notifications, onClose }) => {
  if (!notifications || notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} style={{ color: '#059669' }} />;
      case 'error': return <XCircle size={20} style={{ color: '#dc2626' }} />;
      case 'warning': return <AlertTriangle size={20} style={{ color: '#d97706' }} />;
      default: return <CheckCircle size={20} style={{ color: '#3b82f6' }} />;
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'success': return `${styles.notification} ${styles.notificationSuccess}`;
      case 'error': return `${styles.notification} ${styles.notificationError}`;
      case 'warning': return `${styles.notification} ${styles.notificationWarning}`;
      case 'info': return `${styles.notification} ${styles.notificationInfo}`;
      default: return `${styles.notification} ${styles.notificationInfo}`;
    }
  };

  return (
    <div className={styles.notificationContainer}>
      {notifications.map(notification => (
        <div key={notification.id} className={getNotificationClass(notification.type)}>
          <div className={styles.notificationIcon}>
            {getIcon(notification.type)}
          </div>
          <div className={styles.notificationContent}>
            <div className={styles.notificationTitle}>
              {notification.type === 'success' && 'Éxito'}
              {notification.type === 'error' && 'Error'}
              {notification.type === 'warning' && 'Advertencia'}
              {notification.type === 'info' && 'Información'}
            </div>
            <div className={styles.notificationMessage}>{notification.message}</div>
          </div>
          <button onClick={() => onClose(notification.id)} className={styles.notificationClose}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer; 