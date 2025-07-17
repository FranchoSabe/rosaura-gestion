import React from 'react';
import { Settings, Plus, Search, Filter } from 'lucide-react';
import styles from './Configuracion.module.css';

/**
 * Página de Configuración del Sistema
 * 
 * ESTADO: Página placeholder - En desarrollo
 * 
 * FUNCIONALIDADES FUTURAS:
 * - Configuración general del sistema
 * - Gestión de usuarios y permisos
 * - Configuración de integración con Floreant POS
 * - Ajustes de reservas (horarios, mesas, etc.)
 * - Configuración de notificaciones
 * - Backup y restore
 * - Configuración de reportes
 */
const Configuracion = () => {
  return (
    <div className={styles.reservasContainer}>
      {/* Header de la página */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleWithIcon}>
              <Settings size={24} />
              <h1 className={styles.pageTitle}>Configuración del Sistema</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Ajustes generales y configuración avanzada
            </p>
          </div>
          
          <div className={styles.headerActions}>
            <button className={styles.createButton}>
              <Plus size={16} />
              Nueva Configuración
            </button>
          </div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className={styles.filtersBar}>
        <div className={styles.filtersContent}>
          <div className={styles.searchSection}>
            <div className={styles.searchBox}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Buscar configuraciones..." 
                className={styles.searchInput}
              />
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <button className={styles.filterButton}>
              <Filter size={16} />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={styles.mainContent}>
        <div className={styles.developmentNotice}>
          <div className={styles.noticeIcon}>
            <Settings size={48} />
          </div>
          <h2 className={styles.noticeTitle}>Página en Desarrollo</h2>
          <p className={styles.noticeDescription}>
            Esta página centralizará todas las configuraciones del sistema.
          </p>
          <div className={styles.featuresList}>
            <h3>Funcionalidades Planificadas:</h3>
            <ul>
              <li>⚙️ Configuración general del sistema</li>
              <li>👥 Gestión de usuarios y permisos</li>
              <li>🔗 Integración con Floreant POS</li>
              <li>📅 Ajustes de reservas (horarios, mesas)</li>
              <li>🔔 Configuración de notificaciones</li>
              <li>💾 Backup y restore</li>
              <li>📊 Configuración de reportes</li>
              <li>🎨 Personalización de interfaz</li>
            </ul>
          </div>
          <div className={styles.temporaryMessage}>
            <p>
              <strong>Próximamente:</strong> Centro de control completo del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion; 