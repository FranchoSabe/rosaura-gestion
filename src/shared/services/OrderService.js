import { addOrder, updateOrderStatus, updateTableStatus, updateReservation } from '../../firebase';

/**
 * Crear un nuevo pedido y marcar la mesa como ocupada
 */
export const createOrder = async (orderData) => {
  const cleanData = { ...orderData };
  delete cleanData.id;

  const { docId } = await addOrder(cleanData);

  if (orderData.mesa) {
    await updateTableStatus(orderData.mesa, 'ocupada');
  }

  return docId;
};

/**
 * Cambiar el estado de un pedido
 */
export const changeOrderStatus = async (orderId, newStatus, additionalData = {}) => {
  await updateOrderStatus(orderId, newStatus, additionalData);
};

/**
 * Procesar el pago de una mesa y cerrar sus pedidos
 */
export const processPayment = async (paymentData, { reservations = [] } = {}) => {
  await Promise.all(
    paymentData.orderIds.map((id) =>
      updateOrderStatus(id, 'cerrado', {
        metodoPago: paymentData.paymentMethod,
        montoRecibido: paymentData.receivedAmount,
        cambio: paymentData.change,
        descuentoAplicado: paymentData.discount || 0,
        razonDescuento: paymentData.discountReason || '',
        totalFinal: paymentData.total,
        fechaCobrado: new Date(),
        empleadoCobro: paymentData.employee,
      })
    )
  );

  if (paymentData.tableId) {
    await updateTableStatus(paymentData.tableId, 'libre');
    const reservationForTable = reservations.find(
      (r) => r.mesaReal === paymentData.tableId && r.estadoCheckIn === 'confirmado'
    );
    if (reservationForTable) {
      await updateReservation(reservationForTable.id, {
        estadoCheckIn: 'completado',
        fechaCompletado: new Date(),
        mesaReal: null,
        pagoCompletado: true,
      });
    }
  }
};

export default { createOrder, changeOrderStatus, processPayment };
