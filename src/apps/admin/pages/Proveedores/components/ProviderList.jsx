import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Calendar,
  Package,
  MoreVertical,
  Building,
  CreditCard,
  Clock
} from 'lucide-react';
import { ConfirmationModal } from '../../../../../shared/components/ui';
import { deleteProvider, updateProviderStatus } from '../../../../../firebase';
import styles from './ProviderList.module.css';

/**
 * Lista de proveedores
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.providers - Array de proveedores
 * @param {Function} props.onEditProvider - Función para editar un proveedor
 * @param {Function} props.onProviderUpdated - Función a ejecutar cuando un proveedor es actualizado
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {boolean} props.loading - Indica si los datos están cargando
 * @param {string} props.searchTerm - Término de búsqueda
 * @param {string} props.categoryFilter - Filtro por categoría
 */
const ProviderList = ({ 
  providers = [], 
  onEditProvider,
  onProviderUpdated,
  showNotification,
  loading = false,
  error = null,
  searchTerm = '',
  categoryFilter = ''
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // Filtrar proveedores según búsqueda y filtros
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.contacto?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.contacto?.telefono?.includes(searchTerm);
    
    const matchesCategory = !categoryFilter || provider.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleDeleteProvider = async () => {
    if (!providerToDelete) return;
    
    try {
      await deleteProvider(providerToDelete.id);
      showNotification?.('success', 'Proveedor eliminado exitosamente');
      onProviderUpdated?.();
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      showNotification?.('error', 'Error al eliminar el proveedor');
    } finally {
      setDeleteModalOpen(false);
      setProviderToDelete(null);
    }
  };

  const handleStatusChange = async (provider, newStatus) => {
    try {
      await updateProviderStatus(provider.id, newStatus);
      showNotification?.('success', `Estado del proveedor ${newStatus === 'active' ? 'activado' : 'desactivado'}`);
      onProviderUpdated?.();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      showNotification?.('error', 'Error al cambiar el estado del proveedor');
    }
  };

  const openDeleteModal = (provider) => {
    setProviderToDelete(provider);
    setDeleteModalOpen(true);
    setActionMenuOpen(null);
  };

  const openEditModal = (provider) => {
    onEditProvider?.(provider);
    setActionMenuOpen(null);
  };

  const toggleActionMenu = (providerId) => {
    setActionMenuOpen(actionMenuOpen === providerId ? null : providerId);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date.seconds * 1000).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryLabel = (category) => {
    const categories = {
      'alimentos': 'Alimentos',
      'bebidas': 'Bebidas',
      'limpieza': 'Limpieza',
      'equipos': 'Equipos',
      'servicios': 'Servicios',
      'otros': 'Otros'
    };
    return categories[category] || category;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#28a745';
      case 'inactive':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const renderRating = (rating) => {
    return (
      <div className={styles.rating}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < rating ? styles.starFilled : styles.starEmpty}
          />
        ))}
        <span className={styles.ratingText}>({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Error al cargar proveedores</h3>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (filteredProviders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Package size={48} className={styles.emptyIcon} />
        <h3>No hay proveedores</h3>
        <p>
          {searchTerm || categoryFilter 
            ? 'No se encontraron proveedores que coincidan con los filtros aplicados.'
            : 'Aún no has agregado ningún proveedor. ¡Crea tu primer proveedor!'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.providerList}>
      <div className={styles.providersGrid}>
        {filteredProviders.map((provider) => (
          <div key={provider.id} className={styles.providerCard}>
            {/* Header de la card */}
            <div className={styles.cardHeader}>
              <div className={styles.providerInfo}>
                <div className={styles.providerName}>
                  <h3>{provider.nombre}</h3>
                  <div 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(provider.status) }}
                  >
                    {provider.status === 'active' ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
                <div className={styles.categoryBadge}>
                  {getCategoryLabel(provider.categoria)}
                </div>
              </div>
              
              <div className={styles.cardActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => toggleActionMenu(provider.id)}
                >
                  <MoreVertical size={16} />
                </button>
                
                {actionMenuOpen === provider.id && (
                  <div className={styles.actionMenu}>
                    <button
                      className={styles.actionMenuItem}
                      onClick={() => openEditModal(provider)}
                    >
                      <Edit size={14} />
                      Editar
                    </button>
                    <button
                      className={styles.actionMenuItem}
                      onClick={() => handleStatusChange(
                        provider, 
                        provider.status === 'active' ? 'inactive' : 'active'
                      )}
                    >
                      {provider.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      className={`${styles.actionMenuItem} ${styles.deleteAction}`}
                      onClick={() => openDeleteModal(provider)}
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Información de contacto */}
            <div className={styles.contactInfo}>
              {provider.contacto?.telefono && (
                <div className={styles.contactItem}>
                  <Phone size={14} />
                  <span>{provider.contacto.telefono}</span>
                </div>
              )}
              {provider.contacto?.email && (
                <div className={styles.contactItem}>
                  <Mail size={14} />
                  <span>{provider.contacto.email}</span>
                </div>
              )}
              {provider.contacto?.ciudad && (
                <div className={styles.contactItem}>
                  <MapPin size={14} />
                  <span>{provider.contacto.ciudad}</span>
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div className={styles.additionalInfo}>
              <div className={styles.infoGrid}>
                {provider.condicionesPago && (
                  <div className={styles.infoItem}>
                    <CreditCard size={14} />
                    <span>Pago: {provider.condicionesPago}</span>
                  </div>
                )}
                {provider.tiempoEntrega && (
                  <div className={styles.infoItem}>
                    <Clock size={14} />
                    <span>Entrega: {provider.tiempoEntrega}</span>
                  </div>
                )}
              </div>
              
              {provider.rating && (
                <div className={styles.ratingContainer}>
                  {renderRating(provider.rating)}
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div className={styles.statsContainer}>
              <div className={styles.statItem}>
                <Building size={14} />
                <span>Agregado: {formatDate(provider.createdAt)}</span>
              </div>
              <div className={styles.statItem}>
                <Package size={14} />
                <span>Pedidos: {provider.totalPedidos || 0}</span>
              </div>
            </div>

            {/* Notas */}
            {provider.notas && (
              <div className={styles.notesContainer}>
                <p className={styles.notes}>{provider.notas}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProvider}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que quieres eliminar el proveedor "${providerToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ProviderList; 