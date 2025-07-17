import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar datos temporales del turno de caja
 * Guarda pagos procesados en sessionStorage hasta el cierre de caja
 * Proporciona funciones para agregar, corregir y anular pagos
 */
const useTurnData = () => {
  // Inicializar datos del turno desde sessionStorage o crear nuevos
  const [turnData, setTurnData] = useState(() => {
    try {
      const savedData = sessionStorage.getItem('currentTurnData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Verificar que los datos sean del turno actual
        const currentDate = new Date().toISOString().split('T')[0];
        const currentHour = new Date().getHours();
        const currentTurn = currentHour < 16 ? 'mediodia' : 'noche';
        
        if (parsed.fecha === currentDate && parsed.turno === currentTurn) {
          console.log('📂 Recuperando datos del turno desde sessionStorage:', {
            fecha: parsed.fecha,
            turno: parsed.turno,
            pagos: parsed.pagosProcesados?.length || 0
          });
          return parsed;
        } else {
          console.log('🔄 Datos de turno anterior encontrados, iniciando nuevo turno');
          sessionStorage.removeItem('currentTurnData');
        }
      }
    } catch (error) {
      console.error('Error al recuperar datos del turno:', error);
      sessionStorage.removeItem('currentTurnData');
    }

    // Crear nuevos datos del turno
    const currentDate = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const currentTurn = currentHour < 16 ? 'mediodia' : 'noche';
    
    const newTurnData = {
      fecha: currentDate,
      turno: currentTurn,
      iniciado: new Date().toISOString(),
      pagosProcesados: [],
      totalesTurno: {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        total: 0
      },
      contadores: {
        cantidadPagos: 0,
        pedidosEfectivo: 0,
        pedidosTarjeta: 0,
        pedidosTransferencia: 0
      },
      estadoCaja: 'abierta'
    };

    console.log('🆕 Iniciando nuevo turno:', {
      fecha: newTurnData.fecha,
      turno: newTurnData.turno
    });

    return newTurnData;
  });

  // Guardar en sessionStorage cada vez que cambien los datos
  useEffect(() => {
    try {
      sessionStorage.setItem('currentTurnData', JSON.stringify(turnData));
    } catch (error) {
      console.error('Error al guardar datos del turno:', error);
    }
  }, [turnData]);

  // Agregar nuevo pago al turno
  const addPayment = useCallback((paymentData) => {
    const nuevoPago = {
      id: `pago_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      estado: 'procesado',
      ...paymentData
    };

    setTurnData(prev => {
      const nuevosTotales = {
        ...prev.totalesTurno,
        [paymentData.metodoPago]: prev.totalesTurno[paymentData.metodoPago] + paymentData.total,
        total: prev.totalesTurno.total + paymentData.total
      };

      const nuevosContadores = {
        ...prev.contadores,
        cantidadPagos: prev.contadores.cantidadPagos + 1,
        [`pedidos${paymentData.metodoPago.charAt(0).toUpperCase() + paymentData.metodoPago.slice(1)}`]: 
          prev.contadores[`pedidos${paymentData.metodoPago.charAt(0).toUpperCase() + paymentData.metodoPago.slice(1)}`] + 1
      };

      console.log('💰 Pago agregado al turno:', {
        id: nuevoPago.id,
        mesa: paymentData.mesa,
        metodo: paymentData.metodoPago,
        total: paymentData.total,
        nuevoTotal: nuevosTotales.total
      });

      return {
        ...prev,
        pagosProcesados: [...prev.pagosProcesados, nuevoPago],
        totalesTurno: nuevosTotales,
        contadores: nuevosContadores
      };
    });

    return nuevoPago.id;
  }, []);

  // Corregir un pago existente
  const correctPayment = useCallback((pagoId, nuevosData) => {
    setTurnData(prev => {
      const pagoIndex = prev.pagosProcesados.findIndex(p => p.id === pagoId);
      if (pagoIndex === -1) {
        console.warn('Pago no encontrado para corregir:', pagoId);
        return prev;
      }

      const pagoOriginal = prev.pagosProcesados[pagoIndex];
      const pagoCorregido = {
        ...pagoOriginal,
        ...nuevosData,
        estado: 'corregido',
        timestampCorreccion: new Date().toISOString(),
        datosOriginales: {
          metodoPago: pagoOriginal.metodoPago,
          total: pagoOriginal.total
        }
      };

      // Recalcular totales
      let nuevosTotales = { ...prev.totalesTurno };
      let nuevosContadores = { ...prev.contadores };

      // Restar valores originales
      nuevosTotales[pagoOriginal.metodoPago] -= pagoOriginal.total;
      nuevosTotales.total -= pagoOriginal.total;
      nuevosContadores[`pedidos${pagoOriginal.metodoPago.charAt(0).toUpperCase() + pagoOriginal.metodoPago.slice(1)}`]--;

      // Sumar valores corregidos
      nuevosTotales[nuevosData.metodoPago] += nuevosData.total;
      nuevosTotales.total += nuevosData.total;
      nuevosContadores[`pedidos${nuevosData.metodoPago.charAt(0).toUpperCase() + nuevosData.metodoPago.slice(1)}`]++;

      const nuevosPagosProcesados = [...prev.pagosProcesados];
      nuevosPagosProcesados[pagoIndex] = pagoCorregido;

      console.log('✏️ Pago corregido:', {
        id: pagoId,
        original: `${pagoOriginal.metodoPago} $${pagoOriginal.total}`,
        corregido: `${nuevosData.metodoPago} $${nuevosData.total}`
      });

      return {
        ...prev,
        pagosProcesados: nuevosPagosProcesados,
        totalesTurno: nuevosTotales,
        contadores: nuevosContadores
      };
    });
  }, []);

  // Anular un pago
  const voidPayment = useCallback((pagoId, razon = '') => {
    setTurnData(prev => {
      const pagoIndex = prev.pagosProcesados.findIndex(p => p.id === pagoId);
      if (pagoIndex === -1) {
        console.warn('Pago no encontrado para anular:', pagoId);
        return prev;
      }

      const pagoOriginal = prev.pagosProcesados[pagoIndex];
      const pagoAnulado = {
        ...pagoOriginal,
        estado: 'anulado',
        timestampAnulacion: new Date().toISOString(),
        razonAnulacion: razon
      };

      // Recalcular totales restando el pago anulado
      const nuevosTotales = {
        ...prev.totalesTurno,
        [pagoOriginal.metodoPago]: prev.totalesTurno[pagoOriginal.metodoPago] - pagoOriginal.total,
        total: prev.totalesTurno.total - pagoOriginal.total
      };

      const nuevosContadores = {
        ...prev.contadores,
        cantidadPagos: prev.contadores.cantidadPagos - 1,
        [`pedidos${pagoOriginal.metodoPago.charAt(0).toUpperCase() + pagoOriginal.metodoPago.slice(1)}`]: 
          prev.contadores[`pedidos${pagoOriginal.metodoPago.charAt(0).toUpperCase() + pagoOriginal.metodoPago.slice(1)}`] - 1
      };

      const nuevosPagosProcesados = [...prev.pagosProcesados];
      nuevosPagosProcesados[pagoIndex] = pagoAnulado;

      console.log('❌ Pago anulado:', {
        id: pagoId,
        metodo: pagoOriginal.metodoPago,
        total: pagoOriginal.total,
        razon
      });

      return {
        ...prev,
        pagosProcesados: nuevosPagosProcesados,
        totalesTurno: nuevosTotales,
        contadores: nuevosContadores
      };
    });
  }, []);

  // Cerrar turno y limpiar datos temporales
  const closeTurn = useCallback(() => {
    console.log('🔒 Cerrando turno y limpiando datos temporales');
    sessionStorage.removeItem('currentTurnData');
    
    // Reiniciar datos para el próximo turno
    const currentDate = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const currentTurn = currentHour < 16 ? 'mediodia' : 'noche';
    
    setTurnData({
      fecha: currentDate,
      turno: currentTurn,
      iniciado: new Date().toISOString(),
      pagosProcesados: [],
      totalesTurno: {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        total: 0
      },
      contadores: {
        cantidadPagos: 0,
        pedidosEfectivo: 0,
        pedidosTarjeta: 0,
        pedidosTransferencia: 0
      },
      estadoCaja: 'abierta'
    });
  }, []);

  // Obtener pagos activos (no anulados)
  const getActivePayments = useCallback(() => {
    return turnData.pagosProcesados.filter(pago => pago.estado !== 'anulado');
  }, [turnData.pagosProcesados]);

  // Verificar si hay pagos no guardados en Firebase
  const hasUnsavedPayments = useCallback(() => {
    return turnData.pagosProcesados.some(pago => 
      pago.estado !== 'anulado' && !pago.guardadoFirebase
    );
  }, [turnData.pagosProcesados]);

  return {
    turnData,
    addPayment,
    correctPayment,
    voidPayment,
    closeTurn,
    getActivePayments,
    hasUnsavedPayments,
    // Información útil calculada
    isCurrentTurn: turnData.estadoCaja === 'abierta',
    totalAmount: turnData.totalesTurno.total,
    paymentCount: turnData.contadores.cantidadPagos
  };
};

export default useTurnData; 