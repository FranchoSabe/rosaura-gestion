import React, { useState } from 'react';
import { Calendar, Clock, Users, Phone, MessageCircle } from 'lucide-react';
import brushStyles from './BrushStyles.module.css';

const BrushDemo = () => {
  const [selectedTurno, setSelectedTurno] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState(0);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  const isPhoneValid = telefono.length >= 8;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)', 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: '400px', width: '100%', space: '2rem' }}>
        
        <h1 style={{ 
          color: 'white', 
          fontSize: '2rem', 
          textAlign: 'center', 
          marginBottom: '3rem',
          fontFamily: 'serif'
        }}>
          🎨 Demo Pinceladas
        </h1>

        {/* Botones principales */}
        <div style={{ marginBottom: '2rem' }}>
          <button className={brushStyles.brushButton}>
            <Calendar size={20} />
            Reservar Mesa
          </button>
          
          <button className={brushStyles.brushButtonSecondary}>
            <Clock size={18} />
            Ver Disponibilidad
          </button>
        </div>

        {/* Selección de turno */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Selecciona turno:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button 
              className={selectedTurno === 'mediodia' ? brushStyles.brushButtonSelected : brushStyles.brushButtonSecondary}
              onClick={() => setSelectedTurno('mediodia')}
            >
              ☀️ Mediodía
            </button>
            <button 
              className={selectedTurno === 'noche' ? brushStyles.brushButtonSelected : brushStyles.brushButtonSecondary}
              onClick={() => setSelectedTurno('noche')}
            >
              🌙 Noche
            </button>
          </div>
        </div>

        {/* Selección de personas */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Cantidad de personas:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[2, 4, 6].map(num => (
              <button 
                key={num}
                className={selectedPersonas === num ? brushStyles.brushButtonSelected : brushStyles.brushButtonSecondary}
                onClick={() => setSelectedPersonas(num)}
                style={{ fontSize: '0.9rem', padding: '0.7rem' }}
              >
                <Users size={16} />
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Datos de contacto:
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <input 
              className={brushStyles.brushInput}
              type="text"
              placeholder="Tu nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <input 
              className={`${brushStyles.brushInput} ${
                telefono ? (isPhoneValid ? brushStyles.brushInputValid : brushStyles.brushInputInvalid) : ''
              }`}
              type="tel"
              placeholder="Tu teléfono (WhatsApp)"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
        </div>

        {/* Botón final */}
        <button className={brushStyles.brushButton}>
          <MessageCircle size={20} />
          ¡Confirmar Reserva!
        </button>

        {/* Info */}
        <div style={{ 
          marginTop: '3rem', 
          padding: '1.5rem', 
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            💡 <strong>Concepto:</strong> Pinceladas orgánicas con animaciones sutiles que simulan trazos artísticos. 
            Perfectas para reemplazar con tus diseños de Illustrator manteniendo las mismas clases CSS.
          </p>
        </div>

      </div>
    </div>
  );
};

export default BrushDemo; 