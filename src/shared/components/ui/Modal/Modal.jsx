import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * 🪟 COMPONENTE MODAL PROFESIONAL
 * Sistema unificado con design tokens para toda la aplicación
 * 
 * Variantes disponibles:
 * - default: Modal estándar
 * - large: Modal grande para contenido extenso
 * - small: Modal compacto para confirmaciones
 * - fullscreen: Modal que ocupa toda la pantalla
 * 
 * Características:
 * - Overlay con blur backdrop
 * - Animaciones suaves
 * - Control de ESC key
 * - Manejo automático de scroll
 * - Responsive design
 */

const Modal = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
  ...props
}) => {
  
  // Manejar ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);
  
  // Manejar scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // No renderizar si no está abierto
  if (!isOpen) return null;
  
  // Manejar click en overlay
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Combinar clases CSS
  const modalClasses = [
    styles.modal,
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      {...props}
    >
      <div className={modalClasses}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={styles.modalHeader}>
            {title && (
              <h2 className={styles.modalTitle}>{title}</h2>
            )}
            {showCloseButton && (
              <button 
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 