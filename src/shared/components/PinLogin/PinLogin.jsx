import React, { useState } from 'react';
import styles from './PinLogin.module.css';
import Button from '../ui/Button/Button';

const PinLogin = ({ digits = 4, onSubmit }) => {
  const [pin, setPin] = useState('');

  const handleNumber = (n) => {
    if (pin.length < digits) {
      setPin(pin + n);
    }
  };

  const handleBack = () => {
    setPin(pin.slice(0, -1));
  };

  const handleEnter = () => {
    if (pin.length === digits) {
      onSubmit?.(pin);
      setPin('');
    }
  };

  const renderCircles = () => {
    return Array.from({ length: digits }).map((_, i) => (
      <div
        key={i}
        className={
          i < pin.length ? `${styles.circle} ${styles.filled}` : styles.circle
        }
      />
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.display}>{renderCircles()}</div>
      <div className={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} className={styles.key} onClick={() => handleNumber(n)}>
            {n}
          </button>
        ))}
        <button className={styles.key} onClick={handleBack}>←</button>
        <button className={styles.key} onClick={() => handleNumber(0)}>0</button>
        <Button
          variant="primary"
          size="sm"
          className={styles.enter}
          onClick={handleEnter}
          disabled={pin.length !== digits}
        >
          Ingresar
        </Button>
      </div>
    </div>
  );
};

export default PinLogin;
