import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Filter } from 'lucide-react';
import { subscribeToProviders } from '../../../../firebase';

import ProviderModal from './components/ProviderModal';
import ProviderList from './components/ProviderList';
import styles from './Proveedores.module.css';

/**
 * Página de Gestión de Proveedores
 * 
 * FUNCIONALIDADES IMPLEMENTADAS:
 * - CRUD completo de proveedores
 * - Búsqueda y filtrado
 * - Gestión de estados
 * - Interfaz responsive
 * - Notificaciones
 * 
 * PRÓXIMAMENTE:
 * - Gestión de productos por proveedor
 * - Historial de pedidos
 * - Reportes de compras
 * - Integración con WhatsApp
 */
const Proveedores = ({ auth, showNotification, showConfirmation }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  // Suscripción a proveedores en tiempo real
  useEffect(() => {
    if (!auth || !auth.user) {
      setError('No hay usuario autenticado');
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToProviders(
      (providersData) => {
        setProviders(providersData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error de permisos:', error);
        setError('Error de permisos: ' + error.message);
        setLoading(false);
        if (showNotification) {
          showNotification('error', 'Error de permisos al cargar proveedores');
        }
      }
    );

    return () => unsubscribe();
  }, [auth, showNotification]);



  // Función para crear nuevo proveedor
  const handleCreateProvider = () => {
    setEditingProvider(null);
    setProviderModalOpen(true);
  };

  // Función para editar proveedor
  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setProviderModalOpen(true);
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setProviderModalOpen(false);
    setEditingProvider(null);
  };

  // Función para cuando se actualiza un proveedor
  const handleProviderUpdated = () => {
    // Los datos se actualizan automáticamente por la suscripción
    console.log('Provider updated, data will refresh automatically');
  };

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
  };

  const categorias = [
    { value: '', label: 'Todas las categorías' },
    { value: 'alimentos', label: 'Alimentos' },
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'limpieza', label: 'Limpieza' },
    { value: 'equipos', label: 'Equipos' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'otros', label: 'Otros' }
  ];

  return (
    <div className={styles.reservasContainer}>
      {/* Header de la página */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleWithIcon}>
              <Truck size={24} />
              <h1 className={styles.pageTitle}>Gestión de Proveedores</h1>
            </div>
            <p className={styles.pageSubtitle}>
              Administra proveedores, productos y pedidos • {providers.length} proveedores registrados
            </p>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              className={styles.createButton}
              onClick={handleCreateProvider}
            >
              <Plus size={16} />
              Nuevo Proveedor
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
                placeholder="Buscar proveedores..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.filterSelect}
            >
              {categorias.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            
            {(searchTerm || categoryFilter) && (
              <button 
                className={styles.clearFiltersButton}
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={styles.mainContent}>
        <ProviderList
          providers={providers}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          onEditProvider={handleEditProvider}
          onProviderUpdated={handleProviderUpdated}
          showNotification={showNotification}
        />
      </div>

      {/* Modal para crear/editar proveedor */}
      <ProviderModal
        isOpen={providerModalOpen}
        onClose={handleCloseModal}
        provider={editingProvider}
        onSuccess={handleProviderUpdated}
        showNotification={showNotification}
      />


    </div>
  );
};

export default Proveedores; 