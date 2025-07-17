import React from 'react';
import { MessageCircle, Check, X } from 'lucide-react';
import { formatPhoneForWhatsApp } from '../../../../../../utils/phoneUtils';
import styles from '../../Reservas.module.css';

/**
 * Sección de lista de espera con toda la lógica de gestión
 */
const WaitingListSection = ({
  filteredWaitingList,
  getWaitingStatusBadge,
  handleContactWaitingClient,
  handleQuickConfirmWaiting,
  handleRejectWaiting
}) => {
  if (filteredWaitingList.length === 0) {
    return null;
  }

  return (
    <div className={styles.waitingListSection}>
      <div className={styles.sectionHeader}>
        <h3>Lista de Espera ({filteredWaitingList.length})</h3>
      </div>

      <div className={styles.waitingList}>
        {filteredWaitingList.map((waiting) => (
          <div key={waiting.id} className={styles.waitingCard}>
            <div className={styles.waitingInfo}>
              <div className={styles.waitingName}>{waiting.cliente?.nombre}</div>
              <div className={styles.waitingDetails}>
                {waiting.personas} personas • {waiting.fecha}
              </div>
              <div className={styles.waitingPhone}>
                <a 
                  href={`https://wa.me/${formatPhoneForWhatsApp(waiting.cliente?.telefono || '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {waiting.cliente?.telefono}
                </a>
              </div>
              {getWaitingStatusBadge(waiting)}
            </div>
            <div className={styles.waitingActions}>
              <button
                onClick={() => handleContactWaitingClient(waiting)}
                className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                title="Contactar cliente"
              >
                <MessageCircle size={16} />
              </button>
              <button
                onClick={() => handleQuickConfirmWaiting(waiting)}
                className={`${styles.actionButton} ${styles.actionButtonSuccess}`}
                title="Confirmar rápido"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => handleRejectWaiting(waiting)}
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                title="Rechazar"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaitingListSection; 