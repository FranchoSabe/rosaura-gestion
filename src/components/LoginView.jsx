import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import ClientLayout from './ClientLayout';
import styles from './LoginView.module.css';

export const LoginView = ({ handleLogin, setScreen, BACKGROUND_IMAGE_URL }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const onSubmit = (e) => {
        e.preventDefault(); // Evita que la página se recargue
        const loginError = handleLogin(username, password);
        if (loginError) {
            setError(loginError);
        }
    };

    return (
        <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
            <h1 className={styles.title}>Iniciar Sesión</h1>
            <form onSubmit={onSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label}><User size={16} className={styles.labelIcon} />Usuario</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={styles.input}
                        placeholder="Usuario"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}><Lock size={16} className={styles.labelIcon} />Contraseña</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        placeholder="********"
                    />
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submitButton}>
                    Iniciar Sesión
                </button>
                <button type="button" onClick={() => setScreen('landing')} className={styles.backButton}>
                    Volver al inicio
                </button>
            </form>
        </ClientLayout>
    );
};