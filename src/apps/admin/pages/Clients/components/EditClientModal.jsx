import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User, Phone, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './EditClientModal.module.css';

const EditClientModal = ({ 
  client, 
  onClose, 
  onSave,
  showNotification,
  showConfirmation 
}) => {
  const [editedClient, setEditedClient] = useState({
    nombre: client?.nombre || '',
    telefono: client?.telefono || '',
    notasInternas: client?.notasInternas || '',
    uniqueNames: client?.uniqueNames || [client?.nombre || '']
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isNamesExpanded, setIsNamesExpanded] = useState(true); // Expandido por defecto para mejor UX

  useEffect(() => {
    if (client) {
      setEditedClient({
        nombre: client.nombre || '',
        telefono: client.telefono || '',
        notasInternas: client.notasInternas || '',
        uniqueNames: client.uniqueNames || [client.nombre || '']
      });
    }
  }, [client]);

  const handleAddName = () => {
    if (editedClient.uniqueNames.length < 10) { // Limitar a 10 nombres máximo
      setEditedClient(prev => ({
        ...prev,
        uniqueNames: [...prev.uniqueNames, '']
      }));
    }
  };

  const handleRemoveName = async (index) => {
    if (editedClient.uniqueNames.length <= 1) {
      showNotification('warning', 'Debe tener al menos un nombre');
      return;
    }

    const confirmed = await showConfirmation({
      title: 'Eliminar nombre',
      message: '¿Estás seguro de que quieres eliminar este nombre del cliente?',
      confirmText: 'Eliminar'
    });

    if (confirmed) {
      setEditedClient(prev => ({
        ...prev,
        uniqueNames: prev.uniqueNames.filter((_, i) => i !== index)
      }));
    }
  };

  const handleNameChange = (index, value) => {
    setEditedClient(prev => ({
      ...prev,
      uniqueNames: prev.uniqueNames.map((name, i) => i === index ? value : name)
    }));
  };

  const handlePhoneChange = (value) => {
    setEditedClient(prev => ({
      ...prev,
      telefono: value || ''
    }));
  };

  const handleNotesChange = (value) => {
    setEditedClient(prev => ({
      ...prev,
      notasInternas: value
    }));
  };

  const handlePrimaryNameChange = (value) => {
    setEditedClient(prev => ({
      ...prev,
      nombre: value
    }));
  };

  const validateForm = () => {
    // Validar que el nombre principal no esté vacío
    if (!editedClient.nombre.trim()) {
      showNotification('error', 'El nombre principal es requerido');
      return false;
    }

    // Validar que todos los nombres únicos no estén vacíos
    const validNames = editedClient.uniqueNames.filter(name => name.trim() !== '');
    if (validNames.length === 0) {
      showNotification('error', 'Debe tener al menos un nombre válido');
      return false;
    }

    // Validar teléfono (básico)
    if (!editedClient.telefono || editedClient.telefono.length < 8) {
      showNotification('error', 'Número de teléfono inválido');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      // Limpiar nombres únicos (eliminar vacíos y duplicados)
      const cleanUniqueNames = [...new Set(
        editedClient.uniqueNames
          .map(name => name.trim())
          .filter(name => name !== '')
      )];

      const clientData = {
        nombre: editedClient.nombre.trim(),
        telefono: editedClient.telefono.trim(),
        notasInternas: editedClient.notasInternas.trim(),
        uniqueNames: cleanUniqueNames,
        consolidatedIds: client.consolidatedIds || [client.id]
      };

      console.log('💾 Guardando datos del cliente:', clientData);
      await onSave(clientData);
      console.log('✅ Cliente actualizado en Firebase');
      showNotification('success', 'Cliente actualizado correctamente');
      onClose();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      showNotification('error', 'Error al actualizar el cliente');
    } finally {
      setIsSaving(false);
    }
  };

  if (!client) return null;

  return createPortal(
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <User size={20} />
            Editar Cliente
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className={styles.content}>
          {/* Nombre principal */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre Principal *</label>
            <input
              type="text"
              value={editedClient.nombre}
              onChange={(e) => handlePrimaryNameChange(e.target.value)}
              className={styles.input}
              placeholder="Nombre principal del cliente"
              maxLength={50}
            />
            <span className={styles.helpText}>Este será el nombre mostrado en la lista de clientes</span>
          </div>

          {/* Teléfono */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Número de Teléfono *</label>
            <input
              type="tel"
              value={editedClient.telefono}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={styles.input}
              placeholder="Número de WhatsApp (ej: +5491234567890)"
              maxLength={20}
            />
            <span className={styles.helpText}>Cambiar el teléfono afectará la agrupación de reservas</span>
          </div>

          {/* Nombres utilizados */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <button
                type="button"
                onClick={() => setIsNamesExpanded(!isNamesExpanded)}
                className={styles.expandButton}
              >
                <label className={styles.label}>Nombres Utilizados ({editedClient.uniqueNames.length})</label>
                {isNamesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isNamesExpanded && (
                <button
                  type="button"
                  onClick={handleAddName}
                  className={styles.addButton}
                  disabled={editedClient.uniqueNames.length >= 10}
                >
                  + Agregar
                </button>
              )}
            </div>
            
            {isNamesExpanded && (
              <div className={styles.namesList}>
                {editedClient.uniqueNames.map((name, index) => (
                  <div key={index} className={styles.nameItem}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      className={styles.input}
                      placeholder={`Nombre ${index + 1}`}
                      maxLength={50}
                    />
                    {editedClient.uniqueNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveName(index)}
                        className={styles.removeButton}
                        title="Eliminar nombre"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <span className={styles.helpText}>
              {isNamesExpanded 
                ? "Estos son todos los nombres que el cliente ha utilizado en sus reservas"
                : "Haz clic para ver y editar los nombres utilizados"
              }
            </span>
          </div>

          {/* Notas internas */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Notas Internas</label>
            <textarea
              value={editedClient.notasInternas}
              onChange={(e) => handleNotesChange(e.target.value)}
              className={styles.textarea}
              placeholder="Notas privadas sobre el cliente..."
              rows={3}
              maxLength={500}
            />
            <span className={styles.helpText}>Solo visible para el personal del restaurante</span>
          </div>
        </div>

        {/* Acciones */}
        <div className={styles.actions}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditClientModal; 