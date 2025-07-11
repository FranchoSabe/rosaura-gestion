import React, { useState } from 'react';
import { Calendar, MessageCircle, FileSearch, Check, Star, Users, Clock, Sparkles } from 'lucide-react';
import { Button, Card, Badge, Loading } from '../shared/components/ui';

/**
 * 🎨 SHOWCASE DE COMPONENTES UI - ROSAURA RESERVAS
 * Página de demostración para ver todos los componentes nuevos
 * 
 * Para verla, añade esta ruta en tu router:
 * <Route path="/showcase" element={<ComponentShowcase />} />
 * 
 * Luego navega a: http://localhost:3000/showcase
 */

const ComponentShowcase = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      padding: '2rem',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          textAlign: 'center', 
          marginBottom: '3rem',
          background: 'linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🎨 Sistema UI - Rosaura Reservas
        </h1>

        {/* BUTTONS SHOWCASE */}
        <Card variant="glass" size="lg" padding="lg" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>🔘 Button Components</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            
            <Button variant="primary" size="lg" leftIcon={<Calendar size={20} />}>
              Primary Large
            </Button>
            
            <Button variant="secondary" size="md" rightIcon={<MessageCircle size={18} />}>
              Secondary
            </Button>
            
            <Button variant="ghost" size="sm" leftIcon={<FileSearch size={16} />}>
              Ghost Small
            </Button>
            
            <Button variant="outline" size="md">
              Outline
            </Button>
            
            <Button variant="danger" size="md">
              Danger
            </Button>
            
            <Button 
              variant="primary" 
              size="md" 
              loading={isLoading}
              onClick={handleTestLoading}
            >
              {isLoading ? 'Cargando...' : 'Test Loading'}
            </Button>
            
          </div>
        </Card>

        {/* CARDS SHOWCASE */}
        <Card variant="glass" size="lg" padding="lg" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>🎴 Card Components</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            
            <Card variant="glass" size="md" padding="md" hover>
              <h3>Glass Card</h3>
              <p>Efecto glassmorphism con backdrop-filter</p>
            </Card>
            
            <Card variant="solid" size="md" padding="md" hover>
              <h3>Solid Card</h3>
              <p>Fondo sólido para mayor contraste</p>
            </Card>
            
            <Card variant="elevated" size="md" padding="md" hover>
              <h3>Elevated Card</h3>
              <p>Con sombra elevada prominente</p>
            </Card>
            
            <Card variant="outlined" size="md" padding="md" hover>
              <h3>Outlined Card</h3>
              <p>Solo bordes, fondo transparente</p>
            </Card>
            
            <Card variant="gradient" size="md" padding="md" hover>
              <h3>Gradient Card</h3>
              <p>Con gradiente sutil de colores</p>
            </Card>
            
          </div>
        </Card>

        {/* BADGES SHOWCASE */}
        <Card variant="glass" size="lg" padding="lg" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>🏷️ Badge Components</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            
            <Badge variant="success" size="lg" icon={<Check size={16} />}>
              Confirmado
            </Badge>
            
            <Badge variant="warning" size="md" icon={<Clock size={14} />}>
              Pendiente
            </Badge>
            
            <Badge variant="error" size="md">
              Cancelado
            </Badge>
            
            <Badge variant="info" size="md" icon={<Users size={14} />}>
              Mesa Asignada
            </Badge>
            
            <Badge variant="primary" size="lg" icon={<Sparkles size={16} />}>
              Premium
            </Badge>
            
            <Badge variant="gray" size="sm">
              Inactivo
            </Badge>
            
            {/* Badges específicos para reservas */}
            <Badge variant="primary" size="md" icon={<Star size={14} />}>
              Nuevo
            </Badge>
            
          </div>
        </Card>

        {/* LOADING SHOWCASE */}
        <Card variant="glass" size="lg" padding="lg" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>⚡ Loading Components</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            
            <div>
              <h4>Spinner</h4>
              <Loading type="spinner" size="lg" color="primary" text="Cargando..." />
            </div>
            
            <div>
              <h4>Dots</h4>
              <Loading type="dots" size="lg" color="primary" />
            </div>
            
            <div>
              <h4>Pulse</h4>
              <Loading type="pulse" size="lg" color="primary" />
            </div>
            
            <div>
              <h4>Bar Progress</h4>
              <Loading type="bar" size="lg" color="primary" />
            </div>
            
          </div>
        </Card>

        {/* SKELETON SCREENS */}
        <Card variant="glass" size="lg" padding="lg" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>💀 Skeleton Screens</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            
            <div>
              <h4>Card Skeleton</h4>
              <Loading.CardSkeleton lines={4} />
            </div>
            
            <div>
              <h4>List Skeleton</h4>
              <Loading.ListSkeleton items={3} />
            </div>
            
          </div>
        </Card>

        {/* EXAMPLES IN CONTEXT */}
        <Card variant="gradient" size="lg" padding="lg">
          <h2 style={{ marginBottom: '1.5rem' }}>🎯 Ejemplo: Landing Rediseñada</h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
            Así se vería la landing page usando estos componentes:
          </p>
          
          <Card variant="glass" size="lg" padding="lg" hover style={{ marginBottom: '1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <Badge variant="primary" size="sm" icon={<Sparkles size={12} />}>
                Bienvenido
              </Badge>
              <h1 style={{ fontSize: '3rem', margin: '1rem 0', fontFamily: 'Daniel, cursive' }}>
                Rosaura
              </h1>
              <p style={{ opacity: 0.9 }}>Reservas online</p>
              <Badge variant="info" size="sm" icon={<Star size={12} />}>
                Premium Experience
              </Badge>
            </div>
            
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth
              leftIcon={<Calendar size={20} />}
              style={{ marginBottom: '1rem' }}
            >
              Hacer una reserva
            </Button>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Button variant="secondary" leftIcon={<MessageCircle size={16} />}>
                WhatsApp
              </Button>
              <Button variant="outline" leftIcon={<FileSearch size={16} />}>
                Mi reserva
              </Button>
            </div>
          </Card>
          
          <Card variant="outlined" size="sm" padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} style={{ color: '#22c55e' }} />
                <span>Hasta 6 personas</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} style={{ color: '#22c55e' }} />
                <span>Confirmación inmediata</span>
              </div>
            </div>
          </Card>
          
        </Card>

        <div style={{ textAlign: 'center', marginTop: '3rem', opacity: 0.7 }}>
          <p>💡 Para aplicar estos cambios al ClientView real, confirma y lo implementamos!</p>
        </div>

      </div>
    </div>
  );
};

export default ComponentShowcase; 