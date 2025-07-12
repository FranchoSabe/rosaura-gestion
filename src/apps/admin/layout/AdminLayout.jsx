import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Users, LogOut, Menu, X } from 'lucide-react';
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
  // Estado para menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    // Cerrar menú móvil después de navegar
    setIsMobileMenuOpen(false);
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

  // Datos de navegación
  const navigationItems = [
    { id: 'dashboard', label: 'Gestión Diaria' },
    { id: 'panorama', label: 'Panorama' },
    { id: 'clients', label: 'Clientes' },
    { id: 'waiting-list', label: 'Lista de Espera' }
  ];

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

          {/* Navegación central - pestañas (desktop) */}
          <div className={styles.navigationSection}>
            <div className={styles.tabsList}>
              {navigationItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={activeTab === item.id ? styles.tabActive : styles.tabInactive}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controles usuario - derecha */}
          <div className={styles.userSection}>
            <button onClick={onLogout} className={styles.logoutButton}>
              <LogOut size={16} />
              <span className={styles.buttonText}>Cerrar Sesión</span>
            </button>
          </div>

          {/* Botón menú móvil */}
          <button 
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menú de navegación"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuContent}>
              {navigationItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`${styles.mobileMenuItem} ${activeTab === item.id ? styles.mobileMenuItemActive : ''}`}
                >
                  {item.label}
                </button>
              ))}
              <div className={styles.mobileMenuDivider} />
              <button onClick={onLogout} className={styles.mobileLogoutButton}>
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
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