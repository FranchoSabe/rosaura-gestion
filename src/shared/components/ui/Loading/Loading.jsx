import React from 'react';
import styles from './Loading.module.css';

/**
 * ⚡ COMPONENTE LOADING PROFESIONAL
 * Spinners y skeleton screens para estados de carga elegantes
 * 
 * Tipos disponibles:
 * - spinner: Spinner circular animado (default)
 * - skeleton: Skeleton screen para contenido
 * - dots: Tres puntos animados
 * - pulse: Efecto de pulso suave
 * - bar: Barra de progreso
 * 
 * Tamaños: sm, md, lg, xl
 * Colores: primary, secondary, white
 * Configuraciones específicas para diferentes contextos
 */

const Loading = ({
  type = 'spinner',
  size = 'md',
  color = 'primary',
  text = null,
  className = '',
  ...props
}) => {
  
  const loadingClasses = [
    styles.loading,
    styles[`loading--${type}`],
    styles[`loading--${size}`],
    styles[`loading--${color}`],
    className
  ].filter(Boolean).join(' ');

  const renderLoading = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className={styles.spinner}>
            <div className={styles.spinner__circle}></div>
          </div>
        );
        
      case 'skeleton':
        return (
          <div className={styles.skeleton}>
            <div className={styles.skeleton__line}></div>
            <div className={styles.skeleton__line}></div>
            <div className={styles.skeleton__line}></div>
          </div>
        );
        
      case 'dots':
        return (
          <div className={styles.dots}>
            <div className={styles.dots__dot}></div>
            <div className={styles.dots__dot}></div>
            <div className={styles.dots__dot}></div>
          </div>
        );
        
      case 'pulse':
        return (
          <div className={styles.pulse}>
            <div className={styles.pulse__circle}></div>
          </div>
        );
        
      case 'bar':
        return (
          <div className={styles.bar}>
            <div className={styles.bar__fill}></div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={loadingClasses} {...props}>
      {renderLoading()}
      {text && <span className={styles.loading__text}>{text}</span>}
    </div>
  );
};

// Componente especializado para botones
const ButtonLoading = ({ size = 'md', color = 'white' }) => (
  <Loading type="spinner" size={size} color={color} />
);

// Componente especializado para cards
const CardSkeleton = ({ lines = 3, size = 'md' }) => (
  <div className={styles.cardSkeleton}>
    <div className={styles.cardSkeleton__header}></div>
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className={styles.cardSkeleton__line}></div>
    ))}
  </div>
);

// Componente especializado para listas
const ListSkeleton = ({ items = 5, size = 'md' }) => (
  <div className={styles.listSkeleton}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className={styles.listSkeleton__item}>
        <div className={styles.listSkeleton__avatar}></div>
        <div className={styles.listSkeleton__content}>
          <div className={styles.listSkeleton__title}></div>
          <div className={styles.listSkeleton__subtitle}></div>
        </div>
      </div>
    ))}
  </div>
);

Loading.Button = ButtonLoading;
Loading.CardSkeleton = CardSkeleton;
Loading.ListSkeleton = ListSkeleton;

export default Loading; 