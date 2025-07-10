import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Users, LogOut } from 'lucide-react';
import CreateReservationModal from '../../../shared/components/modals/CreateReservationModal';
import styles from './AdminLayout.module.css';

/**
 * Layout común para todas las páginas de administración
 * Incluye header unificado con navegación por pestañas y contenido de página
 */
const AdminLayout = ({ 
  auth, 
  onLogout, 
  children,
  // Props para CreateReservationModal global
  onCreateReservation,
  getAvailableSlots,
  isValidDate,
  HORARIOS,
  showNotification
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para mostrar modal de creación global
  const [showCreateReservationModal, setShowCreateReservationModal] = useState(false);

  // Determinar la pestaña activa basada en la ruta actual
  const getActiveTab = () => {
    if (location.pathname.includes('/dashboard')) return 'dashboard';
    if (location.pathname.includes('/panorama')) return 'panorama';
    if (location.pathname.includes('/clients')) return 'clients';
    if (location.pathname.includes('/waiting-list')) return 'waiting-list';
    return 'dashboard'; // default
  };

  const activeTab = getActiveTab();

  // Navegación entre pestañas
  const handleTabClick = (tab) => {
    switch (tab) {
      case 'dashboard':
        navigate('/admin/dashboard');
        break;
      case 'panorama':
        navigate('/admin/panorama');
        break;
      case 'clients':
        navigate('/admin/clients');
        break;
      case 'waiting-list':
        navigate('/admin/waiting-list');
        break;
      default:
        navigate('/admin/dashboard');
    }
  };

  // Manejar creación de reserva global
  const handleCreateReservation = async (reservationData) => {
    try {
      await onCreateReservation(reservationData);
      setShowCreateReservationModal(false);
    } catch (error) {
      console.error('Error creating reservation from global button:', error);
      // El error será manejado por CreateReservationModal
    }
  };

  return (
    <div className={styles.adminLayout}>
      {/* Header unificado con logo, navegación y controles */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          {/* Logo section - izquierda */}
          <div className={styles.logoSection}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>Rosaura</h1>
              <p className={styles.subtitle}>Sistema de Reservas</p>
            </div>
          </div>

          {/* Navegación central - pestañas */}
          <div className={styles.navigationSection}>
            <div className={styles.tabsList}>
              <button 
                onClick={() => handleTabClick('dashboard')}
                className={activeTab === 'dashboard' ? styles.tabActive : styles.tabInactive}
              >
                Gestión Diaria
              </button>
              <button 
                onClick={() => handleTabClick('panorama')}
                className={activeTab === 'panorama' ? styles.tabActive : styles.tabInactive}
              >
                Panorama
              </button>
              <button 
                onClick={() => handleTabClick('clients')}
                className={activeTab === 'clients' ? styles.tabActive : styles.tabInactive}
              >
                Clientes
              </button>
              <button 
                onClick={() => handleTabClick('waiting-list')}
                className={activeTab === 'waiting-list' ? styles.tabActive : styles.tabInactive}
              >
                Lista de Espera
              </button>
            </div>
          </div>

          {/* Controles usuario - derecha */}
          <div className={styles.userSection}>
            <button onClick={onLogout} className={styles.logoutButton}>
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido de la página */}
      <div className={styles.content}>
        {children || <Outlet />}
      </div>

      {/* Modal de crear reserva global - FUNCIONAL */}
      {showCreateReservationModal && onCreateReservation && (
        <CreateReservationModal
          onClose={() => setShowCreateReservationModal(false)}
          onSave={handleCreateReservation}
          getAvailableSlots={getAvailableSlots}
          isValidDate={isValidDate}
          HORARIOS={HORARIOS}
          showNotification={showNotification}
          isAdmin={true} // Modo admin para crear desde cualquier página
        />
      )}
    </div>
  );
};

export default AdminLayout; 