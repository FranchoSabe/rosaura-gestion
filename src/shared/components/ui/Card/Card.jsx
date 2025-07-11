import React, { forwardRef } from 'react';
import styles from './Card.module.css';

/**
 * 🎴 COMPONENTE CARD PROFESIONAL
 * Sistema glassmorphism unificado para toda la aplicación
 * 
 * Variantes disponibles:
 * - glass: Efecto glassmorphism principal (default)
 * - solid: Fondo sólido para contraste
 * - elevated: Con sombra elevada
 * - outlined: Solo bordes, fondo transparente
 * - gradient: Con gradiente sutil
 * 
 * Tamaños: sm, md, lg, xl
 * Paddings: none, sm, md, lg
 * Hover effects: subtiles y profesionales
 * Soporte completo para contenido flexible
 */

const Card = forwardRef(({
  children,
  variant = 'glass',
  size = 'md', 
  padding = 'md',
  hover = false,
  className = '',
  ...props
}, ref) => {
  
  const cardClasses = [
    styles.card,
    styles[`card--${variant}`],
    styles[`card--${size}`],
    styles[`card--padding-${padding}`],
    hover && styles['card--hover'],
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={ref}
      className={cardClasses}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card; 