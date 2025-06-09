import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import ClientLayout from './ClientLayout';

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
            <h1 className="text-3xl font-bold text-white text-center mb-6">Iniciar Sesión</h1>
            <form onSubmit={onSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2"><User size={16} className="inline mr-2" />Usuario</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white"
                        placeholder="Usuario"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2"><Lock size={16} className="inline mr-2" />Contraseña</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white"
                        placeholder="********"
                    />
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                <button type="submit" className="w-full bg-[#0c4900] hover:bg-green-900 text-white font-semibold py-4 px-8 rounded-lg text-lg mb-4 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2">
                    Entrar
                </button>
                <button type="button" onClick={() => setScreen('landing')} className="w-full text-center text-gray-300 hover:text-white mt-4 text-sm">
                    Volver al inicio
                </button>
            </form>
        </ClientLayout>
    );
};