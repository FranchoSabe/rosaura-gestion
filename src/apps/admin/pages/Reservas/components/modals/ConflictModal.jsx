import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from '../../Reservas.module.css';

const ConflictModal = ({ conflict, onForce, onCancel }) => {
  if (!conflict) return null;

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.confirmationModal}>
        <div className={styles.confirmationHeader}>
          <div className={styles.confirmationIcon}>
            <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className={styles.confirmationContent}>
            <h3 className={styles.confirmationTitle}>Conflicto de Mesa Detectado</h3>
            <p className={styles.confirmationMessage}>{conflict.message}</p>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              border: '1px solid #fbbf24', 
              borderRadius: '0.5rem', 
              padding: '0.75rem',
              marginTop: '1rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                <strong>¿Deseas forzar la asignación?</strong> Esto reasignará la mesa y desasignará la reserva en conflicto.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.confirmationActions}>
          <button onClick={onCancel} className={styles.confirmationButtonCancel}>
            Cancelar
          </button>
          <button 
            onClick={onForce} 
            style={{ 
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Forzar Asignación
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictModal; 