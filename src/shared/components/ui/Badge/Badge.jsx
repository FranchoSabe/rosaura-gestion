import React, { forwardRef } from 'react';
import styles from './Badge.module.css';

/**
 * 🏷️ COMPONENTE BADGE PROFESIONAL
 * Para mostrar estados, categorías y etiquetas de manera elegante
 * 
 * Variantes disponibles:
 * - success: Estados positivos (confirmado, completado)
 * - warning: Estados de atención (pendiente, en espera)
 * - error: Estados negativos (cancelado, rechazado)
 * - info: Estados informativos (mesa asignada, walk-in)
 * - primary: Acción principal (nuevo, destacado)
 * - gray: Estados neutros (draft, inactivo)
 * 
 * Tamaños: sm, md, lg
 * Con o sin iconos
 * Efectos glassmorphism sutiles
 */

const Badge = forwardRef(({
  children,
  variant = 'gray',
  size = 'md',
  icon = null,
  className = '',
  ...props
}, ref) => {
  
  const badgeClasses = [
    styles.badge,
    styles[`badge--${variant}`],
    styles[`badge--${size}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <span 
      ref={ref}
      className={badgeClasses}
      {...props}
    >
      {icon && <span className={styles.badge__icon}>{icon}</span>}
      <span className={styles.badge__text}>{children}</span>
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge; 