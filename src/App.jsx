import React, { useState } from 'react';
import { AdminView } from './components/AdminView';
import { ClientView } from './components/ClientView';
import { LoginView } from './components/LoginView';

// --- CONFIGURACIÓN Y DATOS ---
const LOGO_URL = '/logo.jpg';
const BACKGROUND_IMAGE_URL = '/fondo.jpg';
const HORARIOS = {
    mediodia: ['12:00', '12:30', '13:00', '13:30', '14:00'],
    noche: ['20:00', '20:30', '21:00', '21:30']
};
const ADMIN_CREDENTIALS = [
  { user: "admin", pass: "admin123", role: "admin" },
  { user: "mozo", pass: "mozo123", role: "mozo" }
];
const INITIAL_DATA = {
  reservas: [
    { id: 1, fecha: '2025-06-07', turno: 'mediodia', horario: '12:00', personas: 2, cliente: { id: 101, nombre: 'María García', telefono: '5491123456789' } },
    { id: 2, fecha: '2025-06-07', turno: 'noche', horario: '20:00', personas: 4, cliente: { id: 102, nombre: 'Juan Pérez', telefono: '5491187654321' } }
  ],
  clientes: [
    { id: 101, nombre: 'María García', telefono: '5491123456789', email: 'maria@email.com', totalReservas: 5, ultimaReserva: '2025-06-07', listaNegra: false },
    { id: 102, nombre: 'Juan Pérez', telefono: '5491187654321', email: 'juan@email.com', totalReservas: 2, ultimaReserva: '2025-06-07', listaNegra: false }
  ]
};

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [auth, setAuth] = useState(null); // null: no autenticado, {role: 'admin'/'mozo'}
  const [data, setData] = useState(INITIAL_DATA);
  
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [reservaData, setReservaData] = useState({
    fecha: '',
    personas: 2,
    turno: '',
    horario: '',
    cliente: { nombre: '', telefono: '', email: '', comentarios: '' }
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

    const getAvailableSlots = (fecha, turno) => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const dayOfWeek = fechaObj.getDay();
    if (dayOfWeek === 1) return []; // Lunes cerrado
    if (turno === 'noche' && dayOfWeek === 0) return []; // Domingos solo mediodía
    
    // Capacidad por tipo de mesa
    const capacidad = {
      'pequena': { max: 4, size: 2 },  // 4 mesas para 1-2 personas
      'mediana': { max: 4, size: 4 },  // 4 mesas para 3-4 personas
      'grande': { max: 1, size: 6 }    // 1 mesa para 5-6 personas
    };
    
    // Obtener reservas existentes para esta fecha/turno
    const reservasDelDia = data.reservas.filter(
      r => r.fecha === fecha && r.turno === turno
    );
    
    // Contar mesas ocupadas por tipo
    const mesasOcupadas = {
      pequena: 0,
      mediana: 0,
      grande: 0
    };
    
    reservasDelDia.forEach(reserva => {
      if (reserva.personas <= 2) mesasOcupadas.pequena++;
      else if (reserva.personas <= 4) mesasOcupadas.mediana++;
      else mesasOcupadas.grande++;
    });
    
    // Verificar si hay capacidad disponible para el tamaño de reserva actual
    const hayCapacidad = 
      (reservaData.personas <= 2 && mesasOcupadas.pequena < capacidad.pequena.max) ||
      (reservaData.personas <= 4 && mesasOcupadas.mediana < capacidad.mediana.max) ||
      (reservaData.personas > 4 && mesasOcupadas.grande < capacidad.grande.max);
    
    if (!hayCapacidad) return [];
    
    return HORARIOS[turno] || [];
  };

    const isValidDate = (fecha) => {
    if (!fecha) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(fecha + "T00:00:00");
    
    // 1. No más de 1 mes de anticipación
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    
    // 2. Mínimo 2 horas de anticipación para reservas del día actual
    const now = new Date();
    const minTimeToday = new Date();
    minTimeToday.setHours(now.getHours() + 2); // 2 horas antes
    
    // Si es hoy, verificar que haya al menos 2 horas de anticipación
    if (selectedDate.toDateString() === today.toDateString()) {
      const primerTurno = HORARIOS[reservaData.turno]?.[0];
      if (primerTurno) {
        const [horas, minutos] = primerTurno.split(':').map(Number);
        const horaTurno = new Date();
        horaTurno.setHours(horas, minutos, 0, 0);
        
        return horaTurno > minTimeToday;
      }
      return false;
    }
    
    return selectedDate >= today && selectedDate <= maxDate;
  };

  const handleSetBlacklist = (clienteId, newStatus) => {
    setData(prevData => ({
      ...prevData,
      clientes: prevData.clientes.map(cliente => 
        cliente.id === clienteId 
          ? { ...cliente, listaNegra: newStatus }
          : cliente
      )
    }));
  };

  const handleDateAndTurnoSubmit = () => {
    if (!isValidDate(reservaData.fecha)) {
      alert('Por favor selecciona una fecha válida (desde hoy hasta 1 mes en el futuro).');
      return;
    }
    if (!reservaData.turno) {
      alert('Por favor, seleccioná un turno.');
      return;
    }
    const slots = getAvailableSlots(reservaData.fecha, reservaData.turno);
    setAvailableSlots(slots);
    setCurrentScreen('horario');
  };

  const handleHorarioSelect = (selectedHorario) => {
    setReservaData(prev => ({ ...prev, horario: selectedHorario }));
    setCurrentScreen('contacto');
  };

  const handleLogin = (user, pass) => {
    const validUser = ADMIN_CREDENTIALS.find(
      cred => cred.user === user && cred.pass === pass
    );

    if (validUser) {
      setAuth({ user: validUser.user, role: validUser.role });
      return true; // Login exitoso
    }
    return false; // Login fallido
  };

  const handleLogout = () => {
    setAuth(null);
  };

  const handleContactoSubmit = () => {
    // Crear nueva reserva con datos del cliente
    const newReservationId = Math.max(...data.reservas.map(r => r.id), 0) + 1;
    const newClientId = Math.max(...data.clientes.map(c => c.id), 0) + 1;
    
    const newReservation = {
      id: newReservationId,
      fecha: reservaData.fecha,
      turno: reservaData.turno,
      horario: reservaData.horario,
      personas: reservaData.personas,
      cliente: {
        id: newClientId,
        nombre: reservaData.cliente.nombre,
        telefono: reservaData.cliente.telefono,
        email: reservaData.cliente.email || ''
      }
    };
    
    const newClient = {
      id: newClientId,
      nombre: reservaData.cliente.nombre,
      telefono: reservaData.cliente.telefono,
      email: reservaData.cliente.email || '',
      totalReservas: 1,
      ultimaReserva: reservaData.fecha,
      listaNegra: false
    };
    
    // Actualizar datos
    setData({
      reservas: [...data.reservas, newReservation],
      clientes: [...data.clientes, newClient]
    });
    
    setShowConfirmation(true);
    // ===== AGREGAR ESTA LÍNEA =====
    setCurrentScreen('confirmacion');
    // ===== FIN DE AGREGAR =====
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // En App.jsx, reemplazá el bloque final

  if (auth) {
    // Si el usuario está autenticado, muestra el panel de admin
    return <AdminView 
        data={data} 
        auth={auth} 
        onLogout={handleLogout}
        // Le pasamos la nueva función al panel
        onSetBlacklist={handleSetBlacklist} 
    />;
  }
  // Si no hay usuario, revisa en qué pantalla de cliente estamos
  if (currentScreen === 'login') {
    return <LoginView 
        handleLogin={handleLogin} 
        onBack={() => setCurrentScreen('landing')} 
        BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL} 
    />
  }

  // Por defecto, muestra el flujo de cliente
  return (
    <ClientView
      LOGO_URL={LOGO_URL}
      BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}
      // El botón de admin ahora simplemente cambia la pantalla a 'login'
      onAdminClick={() => setCurrentScreen('login')}

      // El resto es para el flujo de reserva
      reservaData={reservaData}
      setReservaData={setReservaData}
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
      availableSlots={availableSlots}
      showConfirmation={showConfirmation}
      setShowConfirmation={setShowConfirmation}
      handleDateAndTurnoSubmit={handleDateAndTurnoSubmit}
      handleHorarioSelect={handleHorarioSelect}
      handleContactoSubmit={handleContactoSubmit}
      formatDate={formatDate}
    />
  );
}

export default App;