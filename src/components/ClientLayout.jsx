import React from 'react';
import styles from './ClientLayout.module.css';

const ClientLayout = ({ BACKGROUND_IMAGE_URL, children }) => (
  <div className={styles.container}>
    <div className={styles.background} style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }}>
      <div className={styles.overlay}></div>
    </div>
    <div className={styles.content}>
      {children}
    </div>
  </div>
);

export default ClientLayout; 