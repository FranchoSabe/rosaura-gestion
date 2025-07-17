import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './Input.module.css';

/**
 * 📝 COMPONENTE INPUT PROFESIONAL
 * Sistema unificado con design tokens para toda la aplicación
 * 
 * Variantes disponibles:
 * - default: Input estándar
 * - outline: Con borde definido
 * - ghost: Minimal design
 * 
 * Tamaños: sm, md, lg
 * Estados: error, disabled, loading
 * Soporte completo para iconos y validación
 */

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  error = '',
  disabled = false,
  required = false,
  variant = 'default',
  size = 'md',
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  
  // Combinar clases CSS
  const inputClasses = [
    styles.input,
    styles[variant],
    styles[size],
    error && styles.error,
    disabled && styles.disabled,
    leftIcon && styles.withLeftIcon,
    rightIcon && styles.withRightIcon,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    styles.inputContainer,
    fullWidth && styles.fullWidth
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        {leftIcon && (
          <div className={styles.leftIcon}>
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className={styles.rightIcon}>
            {rightIcon}
          </div>
        )}
        
        {error && (
          <div className={styles.errorIcon}>
            <AlertCircle size={16} />
          </div>
        )}
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 