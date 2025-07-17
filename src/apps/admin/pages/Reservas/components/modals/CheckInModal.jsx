import React, { useState } from 'react';
import { X, UserCheck, AlertTriangle } from 'lucide-react';
import styles from '../../Reservas.module.css';

/**
 * Modal para hacer check-in de reserva con selección de mesa real
 */
const CheckInModal = ({ reservation, availableTables, onClose, onConfirm, loading }) => {
  const [selectedTable, setSelectedTable] = useState(null);

  const handleConfirm = () => {
    if (selectedTable && onConfirm) {
      onConfirm(selectedTable);
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

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.checkInModal}>
        <div className={styles.checkInHeader}>
          <div className={styles.checkInIcon}>
            <UserCheck size={24} style={{ color: '#10b981' }} />
          </div>
          <div className={styles.checkInContent}>
            <h3 className={styles.checkInTitle}>Check-in de Reserva</h3>
            <p className={styles.checkInClient}>{reservation.cliente?.nombre}</p>
            <p className={styles.checkInDetails}>
              {reservation.personas} personas • {reservation.horario} • 
              {reservation.mesaAsignada ? ` Mesa asignada: ${reservation.mesaAsignada}` : ' Sin mesa asignada'}
            </p>
          </div>
          <button onClick={onClose} className={styles.checkInCloseButton}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.checkInBody}>
          <h4>¿En qué mesa se sentó el cliente?</h4>
          <p className={styles.checkInInstruction}>
            Selecciona la mesa donde realmente se sentó. Si es diferente a la asignada, 
            el sistema reasignará automáticamente las otras reservas.
          </p>
          
          <div className={styles.tablesGrid}>
            {availableTables.map(tableId => (
              <button
                key={tableId}
                onClick={() => setSelectedTable(tableId)}
                className={`${styles.tableOption} ${
                  selectedTable === tableId ? styles.tableOptionSelected : ''
                } ${
                  reservation.mesaAsignada === tableId ? styles.tableOptionOriginal : ''
                }`}
              >
                <div className={styles.tableNumber}>Mesa {tableId}</div>
                <div className={styles.tableCapacity}>
                  {formatTableCapacity(tableId)} personas
                </div>
                {reservation.mesaAsignada === tableId && (
                  <div className={styles.originalTableLabel}>Asignada</div>
                )}
              </button>
            ))}
          </div>
          
          {availableTables.length === 0 && (
            <div className={styles.noTablesAvailable}>
              <AlertTriangle size={24} />
              <p>No hay mesas disponibles en este momento.</p>
            </div>
          )}
        </div>
        
        <div className={styles.checkInActions}>
          <button onClick={onClose} className={styles.checkInButtonCancel}>
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedTable || loading}
            className={styles.checkInButtonConfirm}
          >
            {loading ? 'Procesando...' : 'Confirmar Check-in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal; 