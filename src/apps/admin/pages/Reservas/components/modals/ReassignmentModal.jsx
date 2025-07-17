import React, { useState } from 'react';
import { X, AlertTriangle, Users, Clock, Phone } from 'lucide-react';
import styles from '../../Reservas.module.css';

/**
 * Modal elegante para reasignación cuando hay conflictos de mesa
 */
const ReassignmentModal = ({ 
  conflictingReservation, 
  selectedTable, 
  availableTables, 
  onClose, 
  onConfirm, 
  loading 
}) => {
  const [selectedNewTable, setSelectedNewTable] = useState(null);

  const handleConfirm = () => {
    if (selectedNewTable && onConfirm) {
      onConfirm(selectedNewTable);
    }
  };

  const formatTableCapacity = (tableId) => {
    // Capacidades conocidas de las mesas (basado en RESERVATION_ORDER del código)
    const capacities = {
      1: 2, 2: 2, 8: 2, 11: 2, 21: 2, 31: 2,  // Mesas para 2 personas
      3: 4, 6: 4, 9: 4, 10: 4, 12: 4, 13: 4,  // Mesas para 4 personas
      7: 6  // Mesa para 6 personas
    };
    return capacities[tableId] || 4;
  };

  if (!conflictingReservation) return null;

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.reassignmentModal}>
        <div className={styles.reassignmentHeader}>
          <div className={styles.reassignmentIcon}>
            <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className={styles.reassignmentContent}>
            <h3 className={styles.reassignmentTitle}>Reasignación Necesaria</h3>
            <p className={styles.reassignmentProblem}>
              La mesa {selectedTable} ya está reservada para <strong>{conflictingReservation.cliente?.nombre}</strong>
            </p>
            <div className={styles.conflictDetails}>
              <div className={styles.conflictItem}>
                <Users size={16} />
                <span>{conflictingReservation.personas} personas</span>
              </div>
              <div className={styles.conflictItem}>
                <Clock size={16} />
                <span>{conflictingReservation.horario}</span>
              </div>
              <div className={styles.conflictItem}>
                <Phone size={16} />
                <span>{conflictingReservation.cliente?.telefono}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className={styles.reassignmentCloseButton}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.reassignmentBody}>
          <h4>¿A qué mesa quieres reasignar a {conflictingReservation.cliente?.nombre}?</h4>
          <p className={styles.reassignmentInstruction}>
            Selecciona una nueva mesa disponible. La reasignación será automática y el cliente 
            podrá ser notificado del cambio.
          </p>
          
          <div className={styles.tablesGrid}>
            {availableTables.map(tableId => (
              <button
                key={tableId}
                onClick={() => setSelectedNewTable(tableId)}
                className={`${styles.tableOption} ${
                  selectedNewTable === tableId ? styles.tableOptionSelected : ''
                } ${
                  formatTableCapacity(tableId) >= conflictingReservation.personas ? 
                    styles.tableOptionRecommended : styles.tableOptionTight
                }`}
              >
                <div className={styles.tableNumber}>Mesa {tableId}</div>
                <div className={styles.tableCapacity}>
                  {formatTableCapacity(tableId)} personas
                </div>
                {formatTableCapacity(tableId) >= conflictingReservation.personas && (
                  <div className={styles.recommendedTableLabel}>Recomendada</div>
                )}
                {formatTableCapacity(tableId) < conflictingReservation.personas && (
                  <div className={styles.tightTableLabel}>Ajustada</div>
                )}
              </button>
            ))}
          </div>
          
          {availableTables.length === 0 && (
            <div className={styles.noTablesAvailable}>
              <AlertTriangle size={24} />
              <p>No hay mesas disponibles para reasignar.</p>
              <p className={styles.noTablesAdvice}>
                Considera liberar una mesa o contactar al cliente para reagendar.
              </p>
            </div>
          )}
        </div>
        
        <div className={styles.reassignmentActions}>
          <button onClick={onClose} className={styles.reassignmentButtonCancel}>
            Cancelar Check-in
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedNewTable || loading}
            className={styles.reassignmentButtonConfirm}
          >
            {loading ? 'Reasignando...' : `Reasignar a Mesa ${selectedNewTable || ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReassignmentModal; 