import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  Calendar,
  ClipboardList
} from 'lucide-react';
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
    if (location.pathname.includes('/reservas') || location.pathname.includes('/panorama')) {
      return 'reservas';
    }
    if (location.pathname.includes('/pedidos')) return 'pedidos';
    return 'reservas';
  };

  const activeTab = getActiveTab();

  // Navegación entre pestañas
  const handleTabClick = (tab) => {
    switch (tab) {
      case 'reservas':
        navigate('/admin/reservas');
        break;
      case 'pedidos':
        navigate('/admin/pedidos');
        break;
      default:
        navigate('/admin/reservas');
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

  // Datos de navegación organizados por categorías
  // Links de navegación disponibles
  const navigationItems = [
    { id: 'reservas', label: 'Reservas', icon: Calendar },
    { id: 'pedidos', label: 'Pedidos', icon: ClipboardList }
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
              <p className={styles.subtitle}>Sistema de Gestión Integral</p>
            </div>
          </div>

          {/* Navegación central - pestañas (desktop) */}
          <div className={styles.navigationSection}>
            <div className={styles.tabsList}>
              <div className={styles.tabGroup}>
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={activeTab === item.id ? styles.tabActive : styles.tabInactive}
                    >
                      <IconComponent size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
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
              {/* Sección principal */}
              <div className={styles.mobileMenuSection}>
                <div className={styles.mobileMenuSectionTitle}>Principal</div>
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`${styles.mobileMenuItem} ${activeTab === item.id ? styles.mobileMenuItemActive : ''}`}
                    >
                      <IconComponent size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              
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