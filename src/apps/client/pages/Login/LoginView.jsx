import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientLayout from '../../layout/ClientLayout';
import PinLogin from '../../../../shared/components/PinLogin';
import styles from './LoginView.module.css';

export const LoginView = ({ handleLogin, setScreen, BACKGROUND_IMAGE_URL }) => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (pin) => {
        setIsLoading(true);
        setError('');
        try {
            const loginError = await handleLogin(pin);
            if (loginError) {
                setError(loginError);
            } else {
                navigate('/admin');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ClientLayout BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}>
            <h1 className={styles.title}>Iniciar Sesión</h1>
            <div className={styles.form}>
                <PinLogin onSubmit={handleSubmit} />
                {error && <p className={styles.error}>{error}</p>}
                <button type="button" onClick={() => navigate('/client')} className={styles.backButton}>
                    Volver al inicio
                </button>
            </div>
        </ClientLayout>
    );
};