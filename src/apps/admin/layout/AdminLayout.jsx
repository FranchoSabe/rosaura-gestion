import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  LogOut, 
  Menu, 
  X, 
  BarChart3, 
  Calendar, 
  Truck, 
  TrendingUp, 
  UserCheck, 
  Settings,
  ChefHat,
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
    if (location.pathname.includes('/dashboard')) return 'dashboard';
    if (location.pathname.includes('/reservas')) return 'reservas';
    if (location.pathname.includes('/clients')) return 'clients';
    if (location.pathname.includes('/menu')) return 'menu';
    if (location.pathname.includes('/pedidos')) return 'pedidos';
    if (location.pathname.includes('/proveedores')) return 'proveedores';
    if (location.pathname.includes('/ventas')) return 'ventas';
    if (location.pathname.includes('/empleados')) return 'empleados';
    if (location.pathname.includes('/configuracion')) return 'configuracion';
    // Rutas legacy (mantener para compatibilidad)
    if (location.pathname.includes('/panorama')) return 'reservas'; // Panorama integrado en reservas
    if (location.pathname.includes('/waiting-list')) return 'dashboard'; // Redirigir waiting-list a dashboard
    return 'dashboard'; // default
  };

  const activeTab = getActiveTab();

  // Navegación entre pestañas
  const handleTabClick = (tab) => {
    switch (tab) {
      case 'dashboard':
        navigate('/admin/dashboard');
        break;
      case 'reservas':
        navigate('/admin/reservas');
        break;
      case 'clients':
        navigate('/admin/clients');
        break;
      case 'menu':
        navigate('/admin/menu');
        break;
      case 'pedidos':
        navigate('/admin/pedidos');
        break;
      case 'proveedores':
        navigate('/admin/proveedores');
        break;
      case 'ventas':
        navigate('/admin/ventas');
        break;
      case 'empleados':
        navigate('/admin/empleados');
        break;
      case 'configuracion':
        navigate('/admin/configuracion');
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

  // Datos de navegación organizados por categorías
  const navigationItems = {
    main: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'reservas', label: 'Reservas', icon: Calendar },
      { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
      { id: 'clients', label: 'Clientes', icon: Users }
    ],
    management: [
      { id: 'menu', label: 'Menú', icon: ChefHat },
      { id: 'proveedores', label: 'Proveedores', icon: Truck },
      { id: 'ventas', label: 'Ventas', icon: TrendingUp }
    ],
    system: [
      { id: 'empleados', label: 'Empleados', icon: UserCheck },
      { id: 'configuracion', label: 'Configuración', icon: Settings }
    ]
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
              <p className={styles.subtitle}>Sistema de Gestión Integral</p>
            </div>
          </div>

          {/* Navegación central - pestañas (desktop) */}
          <div className={styles.navigationSection}>
            <div className={styles.tabsList}>
              {/* Pestañas principales */}
              <div className={styles.tabGroup}>
                {navigationItems.main.map((item) => {
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
              
              {/* Separador */}
              <div className={styles.tabSeparator}></div>
              
              {/* Pestañas de gestión */}
              <div className={styles.tabGroup}>
                {navigationItems.management.map((item) => {
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
              
              {/* Separador */}
              <div className={styles.tabSeparator}></div>
              
              {/* Pestañas de sistema */}
              <div className={styles.tabGroup}>
                {navigationItems.system.map((item) => {
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
                {navigationItems.main.map((item) => {
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
              
              {/* Sección gestión */}
              <div className={styles.mobileMenuSection}>
                <div className={styles.mobileMenuSectionTitle}>Gestión</div>
                {navigationItems.management.map((item) => {
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
              
              {/* Sección sistema */}
              <div className={styles.mobileMenuSection}>
                <div className={styles.mobileMenuSectionTitle}>Sistema</div>
                {navigationItems.system.map((item) => {
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