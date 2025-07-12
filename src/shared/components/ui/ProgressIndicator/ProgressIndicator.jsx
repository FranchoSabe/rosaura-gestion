import React from 'react';
import styles from './ProgressIndicator.module.css';

/**
 * 📊 COMPONENTE PROGRESS INDICATOR SIMPLE
 * Línea recta con checkpoints que se van coloreando
 * 
 * Pasos del flujo:
 * 1. fecha - Selección de fecha
 * 2. turno - Selección de turno 
 * 3. personas - Cantidad de personas
 * 4. contacto - Datos de contacto
 */

const ProgressIndicator = ({
  currentStep = 'fecha',
  className = '',
  ...props
}) => {
  
  const steps = [
    { id: 'fecha', label: 'Fecha' },
    { id: 'turno', label: 'Turno' },
    { id: 'personas', label: 'Personas' },
    { id: 'contacto', label: 'Contacto' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;
  const remainingSteps = steps.length - (currentStepIndex + 1);

  const progressClasses = [
    styles.progressIndicator,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={progressClasses} {...props}>
      {/* Línea de progreso */}
      <div className={styles.progressLine}>
        {/* Línea de fondo */}
        <div className={styles.progressLineBackground} />
        
        {/* Línea de progreso coloreada */}
        <div 
          className={styles.progressLineFill}
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* Puntos checkpoint */}
        <div className={styles.checkpoints}>
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`${styles.checkpoint} ${
                index <= currentStepIndex ? styles.checkpointActive : styles.checkpointInactive
              }`}
              style={{ left: `${((index + 1) / steps.length) * 100}%` }}
            />
          ))}
        </div>
      </div>
      
      {/* Texto indicador */}
      <div className={styles.stepIndicator}>
        <span className={styles.stepText}>
          {remainingSteps > 0 
            ? `${remainingSteps} paso${remainingSteps > 1 ? 's' : ''} restante${remainingSteps > 1 ? 's' : ''}`
            : 'Completando reserva...'
          }
        </span>
      </div>
    </div>
  );
};

export default ProgressIndicator; 