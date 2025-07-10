import React from 'react';
import { XCircle, AlertTriangle, ThumbsDown } from 'lucide-react';
import styles from './ConfirmationModal.module.css';

const ConfirmationModal = ({ confirmation, onConfirm, onCancel }) => {
  if (!confirmation) return null;

  const getIcon = () => {
    if (confirmation.title?.toLowerCase().includes('eliminar') || confirmation.title?.toLowerCase().includes('borrar')) {
      return <XCircle size={24} style={{ color: '#dc2626' }} />;
    }
    if (confirmation.title?.toLowerCase().includes('lista negra')) {
      return <ThumbsDown size={24} style={{ color: '#f59e0b' }} />;
    }
    return <AlertTriangle size={24} style={{ color: '#f59e0b' }} />;
  };

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.confirmationModal}>
        <div className={styles.confirmationHeader}>
          <div className={styles.confirmationIcon}>
            {getIcon()}
          </div>
          <div className={styles.confirmationContent}>
            <h3 className={styles.confirmationTitle}>{confirmation.title}</h3>
            <p className={styles.confirmationMessage}>{confirmation.message}</p>
          </div>
        </div>
        <div className={styles.confirmationActions}>
          <button onClick={onCancel} className={styles.confirmationButtonCancel}>
            {confirmation.cancelText || 'Cancelar'}
          </button>
          <button onClick={onConfirm} className={styles.confirmationButtonConfirm}>
            {confirmation.confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 