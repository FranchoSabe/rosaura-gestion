import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

/**
 * 🔘 COMPONENTE BUTTON PROFESIONAL
 * Sistema unificado con design tokens para toda la aplicación
 * 
 * Variantes disponibles:
 * - primary: Acción principal (verde Rosaura)
 * - secondary: Acción secundaria (glassmorphism)
 * - ghost: Texto + hover sutil
 * - outline: Bordes definidos
 * - danger: Acciones destructivas
 * 
 * Tamaños: sm, md, lg
 * Estados: loading, disabled
 * Soporte completo para iconos y animaciones
 */

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  className = '',
  onClick,
  ...props
}, ref) => {
  
  // Combinar clases CSS
  const baseClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (loading || disabled) && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  // Manejar click con loading state
  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button 
      ref={ref}
      className={baseClasses}
      onClick={handleClick}
      disabled={loading || disabled}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <span className={styles.iconContainer}>
          <Loader2 size={16} className={styles.spinner} />
        </span>
      )}
      
      {/* Left icon */}
      {!loading && leftIcon && (
        <span className={styles.iconContainer}>
          {leftIcon}
        </span>
      )}
      
      {/* Contenido principal */}
      <span className={styles.content}>
        {children}
      </span>
      
      {/* Right icon */}
      {!loading && rightIcon && (
        <span className={styles.iconContainer}>
          {rightIcon}
        </span>
      )}
      
      {/* Efecto visual de glassmorphism */}
      <span className={styles.glassEffect} aria-hidden="true" />
      
      {/* Efecto de hover/ripple */}
      <span className={styles.rippleEffect} aria-hidden="true" />
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 