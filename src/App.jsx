import React, { useState, useEffect } from 'react';
import { AdminView } from './components/AdminView';
import { ClientView } from './components/ClientView';
import { LoginView } from './components/LoginView';
import { 
  addReservation, 
  addClient, 
  updateClientBlacklist, 
  updateReservation,
  deleteReservation,
  searchReservation,
  subscribeToReservations, 
  subscribeToClients,
  auth 
} from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from './firebase';

// --- CONFIGURACIÓN Y DATOS ---
const LOGO_URL = '/logo.png';
const BACKGROUND_IMAGE_URL = '/fondo.jpg';
const HORARIOS = {
    mediodia: ['12:00', '12:30', '13:00', '13:30', '14:00'],
    noche: ['20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30']
};

function App() {
  const [authState, setAuthState] = useState(null);
  const [data, setData] = useState({ reservas: [], clientes: [] });
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [reservaData, setReservaData] = useState({
    fecha: '',
    personas: 0,
    turno: '',
    horario: '',
    cliente: { nombre: '', telefono: '', comentarios: '', codigoPais: '54' }
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const unsubscribeReservations = subscribeToReservations((reservas) => {
      setData(prev => ({ ...prev, reservas }));
    });

    const unsubscribeClients = subscribeToClients((clientes) => {
      setData(prev => ({ ...prev, clientes }));
    });

    // Limpiar suscripciones al desmontar
    return () => {
      unsubscribeReservations();
      unsubscribeClients();
    };
  }, []);

  const getAvailableSlots = (fecha, turno) => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const dayOfWeek = fechaObj.getDay();
    if (dayOfWeek === 1) return []; // Lunes cerrado
    if (turno === 'noche' && dayOfWeek === 0) return []; // Domingos solo mediodía
    
    // Obtener reservas existentes para esta fecha/turno
    const reservasDelDia = data.reservas.filter(
      r => r.fecha === fecha && r.turno === turno
    );
    
    // Filtrar horarios disponibles basándose en capacidad por horario
    const horariosDisponibles = HORARIOS[turno].filter(horario => {
      // Capacidad por tipo de mesa (normal)
      let capacidad = {
        'pequena': { max: 4, size: 2 },  // 4 mesas para 1-2 personas
        'mediana': { max: 4, size: 4 },  // 4 mesas para 3-4 personas
        'grande': { max: 1, size: 6 }    // 1 mesa para 5-6 personas
      };

      // Reglas especiales para las 21:30
      if (horario === '21:30') {
        // Para 5 o más personas: no disponible
        if (reservaData.personas >= 5) {
          return false;
        }
        // Capacidad reducida a la mitad para mesas pequeñas y medianas
        capacidad = {
          'pequena': { max: 2, size: 2 },  // Reducido de 4 a 2
          'mediana': { max: 2, size: 4 },  // Reducido de 4 a 2
          'grande': { max: 0, size: 6 }    // No disponible para grupos grandes
        };
      }
      
      // Contar mesas ocupadas por tipo para este horario específico
      const reservasDelHorario = reservasDelDia.filter(r => r.horario === horario);
      const mesasOcupadas = {
        pequena: 0,
        mediana: 0,
        grande: 0
      };
      
      reservasDelHorario.forEach(reserva => {
        if (reserva.personas <= 2) mesasOcupadas.pequena++;
        else if (reserva.personas <= 4) mesasOcupadas.mediana++;
        else mesasOcupadas.grande++;
      });
      
      // Verificar si hay capacidad disponible para el tamaño de reserva actual
      const hayCapacidad = 
        (reservaData.personas <= 2 && mesasOcupadas.pequena < capacidad.pequena.max) ||
        (reservaData.personas <= 4 && mesasOcupadas.mediana < capacidad.mediana.max) ||
        (reservaData.personas > 4 && mesasOcupadas.grande < capacidad.grande.max);
      
      return hayCapacidad;
    });
    
    return horariosDisponibles;
  };

  const getAvailableSlotsForEdit = (fecha, turno, personas, excludeReservationId) => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const dayOfWeek = fechaObj.getDay();
    if (dayOfWeek === 1) return []; // Lunes cerrado
    if (turno === 'noche' && dayOfWeek === 0) return []; // Domingos solo mediodía
    
    // Obtener reservas existentes para esta fecha/turno, excluyendo la que estamos editando
    const reservasDelDia = data.reservas.filter(
      r => r.fecha === fecha && r.turno === turno && r.id !== excludeReservationId
    );
    
    // Filtrar horarios disponibles basándose en capacidad por horario
    const horariosDisponibles = HORARIOS[turno].filter(horario => {
      // Capacidad por tipo de mesa (normal)
      let capacidad = {
        'pequena': { max: 4, size: 2 },  // 4 mesas para 1-2 personas
        'mediana': { max: 4, size: 4 },  // 4 mesas para 3-4 personas
        'grande': { max: 1, size: 6 }    // 1 mesa para 5-6 personas
      };

      // Reglas especiales para las 21:30
      if (horario === '21:30') {
        // Para 5 o más personas: no disponible
        if (personas >= 5) {
          return false;
        }
        // Capacidad reducida a la mitad para mesas pequeñas y medianas
        capacidad = {
          'pequena': { max: 2, size: 2 },  // Reducido de 4 a 2
          'mediana': { max: 2, size: 4 },  // Reducido de 4 a 2
          'grande': { max: 0, size: 6 }    // No disponible para grupos grandes
        };
      }
      
      // Contar mesas ocupadas por tipo para este horario específico
      const reservasDelHorario = reservasDelDia.filter(r => r.horario === horario);
      const mesasOcupadas = {
        pequena: 0,
        mediana: 0,
        grande: 0
      };
      
      reservasDelHorario.forEach(reserva => {
        if (reserva.personas <= 2) mesasOcupadas.pequena++;
        else if (reserva.personas <= 4) mesasOcupadas.mediana++;
        else mesasOcupadas.grande++;
      });
      
      // Verificar si hay capacidad disponible para el tamaño de reserva actual
      const hayCapacidad = 
        (personas <= 2 && mesasOcupadas.pequena < capacidad.pequena.max) ||
        (personas <= 4 && mesasOcupadas.mediana < capacidad.mediana.max) ||
        (personas > 4 && mesasOcupadas.grande < capacidad.grande.max);
      
      return hayCapacidad;
    });
    
    return horariosDisponibles;
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

  const handleLogin = async (username, password) => {
    try {
      let email;
      let role;

      // Determinar el rol basado en el nombre de usuario
      if (username === 'admin') {
        email = import.meta.env.VITE_ADMIN_EMAIL;
        role = 'admin';
      } else if (username === 'mozo') {
        email = import.meta.env.VITE_MOZO_EMAIL;
        role = 'mozo';
      } else {
        return "Usuario no válido";
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      setAuthState({ user: username, role });
      return null; // Login exitoso
    } catch (error) {
      console.error("Error de login:", error);
      return "Usuario o contraseña incorrectos";
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthState(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleSetBlacklist = async (clienteId, newStatus) => {
    try {
      await updateClientBlacklist(clienteId, newStatus);
    } catch (error) {
      console.error("Error al actualizar lista negra:", error);
      alert("Error al actualizar el estado del cliente");
    }
  };

  const handleDateAndTurnoSubmit = () => {
    // Convertir fecha a string si es necesario
    const fechaString = reservaData.fecha instanceof Date 
      ? reservaData.fecha.toISOString().split('T')[0] 
      : reservaData.fecha;
      
    if (!isValidDate(fechaString)) {
      alert('Por favor selecciona una fecha válida (desde hoy hasta 1 mes en el futuro).');
      return;
    }
    if (!reservaData.turno) {
      alert('Por favor, seleccioná un turno.');
      return;
    }
    const slots = getAvailableSlots(fechaString, reservaData.turno);
    setAvailableSlots(slots);
    setCurrentScreen('horario');
  };

  const handleHorarioSelect = (selectedHorario) => {
    setReservaData(prev => ({ ...prev, horario: selectedHorario }));
    setCurrentScreen('contacto');
  };

  const handleContactoSubmit = async () => {
    try {
      // Convertir fecha a string si es necesario
      const fechaString = reservaData.fecha instanceof Date 
        ? reservaData.fecha.toISOString().split('T')[0] 
        : reservaData.fecha;
        
      // Crear nuevo cliente
      const newClient = {
        nombre: reservaData.cliente.nombre,
        telefono: `${reservaData.cliente.codigoPais}${reservaData.cliente.telefono}`,
        comentarios: reservaData.cliente.comentarios || '',
        ultimaReserva: fechaString,
        listaNegra: false
      };

      console.log('Creando nuevo cliente:', newClient);

      // Agregar cliente a la base de datos
      const clientId = await addClient(newClient);

      // Crear nueva reserva
      const newReservation = {
        fecha: fechaString,
        turno: reservaData.turno,
        horario: reservaData.horario,
        personas: reservaData.personas,
        clienteId: clientId,
        cliente: newClient
      };

      console.log('Creando nueva reserva:', newReservation);

      // Agregar reserva a la base de datos
      const { id, reservationId } = await addReservation(newReservation);
      
      console.log('Reserva creada con éxito:', { id, reservationId });
      
      // Actualizar los datos de la reserva con el ID
      const updatedReservaData = {
        ...reservaData,
        id,
        reservationId
      };
      
      console.log('Actualizando estado con nueva reserva:', updatedReservaData);
      
      setReservaData(updatedReservaData);
      setShowReservationModal(true);
      setCurrentScreen('confirmacion');
    } catch (error) {
      console.error("Error al crear reserva:", error);
      alert("Error al crear la reserva. Por favor, intenta nuevamente.");
    }
  };
  
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    
    let date;
    if (dateInput instanceof Date) {
      // Si ya es un objeto Date, usarlo directamente
      date = dateInput;
    } else {
      // Si es un string, convertirlo a Date
      date = new Date(dateInput + "T00:00:00");
    }
    
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleUpdateReservation = async (reservationId, updatedData) => {
    try {
      const fechaString = updatedData.fecha instanceof Date ? updatedData.fecha.toISOString().split('T')[0] : updatedData.fecha;

      if (!isValidDate(fechaString)) {
        throw new Error('Por favor selecciona una fecha válida (desde hoy hasta 1 mes en el futuro).');
      }

      const slots = getAvailableSlotsForEdit(
        fechaString,
        updatedData.turno,
        updatedData.personas,
        reservationId
      );

      if (!slots.includes(updatedData.horario)) {
        throw new Error('El horario seleccionado no está disponible. Por favor, elige otro horario.');
      }

      const reservationUpdate = {
        ...updatedData,
        fecha: fechaString,
        cliente: {
          ...updatedData.cliente,
          ultimaReserva: fechaString
        },
      };
      
      delete reservationUpdate.id;

      await updateReservation(reservationId, reservationUpdate);
      return true;
    } catch (error) {
      console.error("Error al actualizar reserva:", error);
      throw error;
    }
  };

  const handleSearchReservation = async (searchData) => {
    try {
      return await searchReservation(searchData);
    } catch (error) {
      console.error("Error al buscar reserva:", error);
      alert("Error al buscar la reserva. Por favor, intenta nuevamente.");
      return null;
    }
  };

  const handleDeleteReservation = async (documentId) => {
    try {
      await deleteReservation(documentId);
      return true;
    } catch (error) {
      console.error("Error al eliminar reserva:", error);
      throw error;
    }
  };

  if (authState) {
    return <AdminView 
      data={data} 
      auth={authState} 
      onLogout={handleLogout}
      onSetBlacklist={handleSetBlacklist}
      onUpdateReservation={handleUpdateReservation}
      onDeleteReservation={handleDeleteReservation}
      getAvailableSlotsForEdit={getAvailableSlotsForEdit}
      isValidDate={isValidDate}
      formatDate={formatDate}
      HORARIOS={HORARIOS}
    />;
  }

  if (currentScreen === 'login') {
    return <LoginView 
      handleLogin={handleLogin} 
      setScreen={setCurrentScreen} 
      BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL} 
    />;
  }

  return (
    <ClientView
      LOGO_URL={LOGO_URL}
      BACKGROUND_IMAGE_URL={BACKGROUND_IMAGE_URL}
      onAdminClick={() => setCurrentScreen('login')}
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
      handleSearchReservation={handleSearchReservation}
      handleUpdateReservation={handleUpdateReservation}
      handleDeleteReservation={handleDeleteReservation}
      showReservationModal={showReservationModal}
      setShowReservationModal={setShowReservationModal}
    />
  );
}

export default App;