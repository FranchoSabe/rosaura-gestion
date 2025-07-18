import React, { useState } from 'react';
import { Modal } from '../../../../../shared/components/ui';
import ProviderForm from './ProviderForm';
import { addProvider, updateProvider } from '../../../../../firebase';
import styles from './ProviderModal.module.css';

/**
 * Modal para crear/editar proveedores
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.provider - Datos del proveedor a editar (null para crear nuevo)
 * @param {Function} props.onSuccess - Función a ejecutar cuando la operación es exitosa
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 */
const ProviderModal = ({ 
  isOpen, 
  onClose, 
  provider = null, 
  onSuccess,
  showNotification 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = provider !== null;

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        // Actualizar proveedor existente
        await updateProvider(provider.id, formData);
        showNotification?.('success', 'Proveedor actualizado exitosamente');
      } else {
        // Crear nuevo proveedor
        await addProvider(formData);
        showNotification?.('success', 'Proveedor creado exitosamente');
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      showNotification?.('error', 
        isEditing 
          ? 'Error al actualizar el proveedor' 
          : 'Error al crear el proveedor'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      variant="large"
      className={styles.providerModal}
      closeOnOverlayClick={false}
    >
      <div className={styles.modalContent}>
        <ProviderForm
          provider={provider}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isSubmitting}
        />
      </div>
    </Modal>
  );
};

export default ProviderModal; 