import { useReducer, useCallback, useMemo } from 'react';

/**
 * Estados del carrito
 */
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  ADD_MODIFIED_PRODUCT: 'ADD_MODIFIED_PRODUCT',
  UPDATE_NOTES: 'UPDATE_NOTES',
  CLEAR_CART: 'CLEAR_CART'
};

/**
 * Reducer para el carrito
 */
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM:
      return {
        ...state,
        items: {
          ...state.items,
          [action.payload.id]: (state.items[action.payload.id] || 0) + 1
        }
      };
      
    case CART_ACTIONS.REMOVE_ITEM:
      const newItems = { ...state.items };
      if (newItems[action.payload.id] > 1) {
        newItems[action.payload.id]--;
      } else {
        delete newItems[action.payload.id];
        // Limpiar notas y productos modificados asociados
        const newNotes = { ...state.notes };
        const newModifiedProducts = { ...state.modifiedProducts };
        delete newNotes[action.payload.id];
        delete newModifiedProducts[action.payload.id];
        
        return {
          ...state,
          items: newItems,
          notes: newNotes,
          modifiedProducts: newModifiedProducts
        };
      }
      return { ...state, items: newItems };
      
    case CART_ACTIONS.UPDATE_QUANTITY:
      if (action.payload.quantity <= 0) {
        const newItems = { ...state.items };
        delete newItems[action.payload.id];
        return { ...state, items: newItems };
      }
      return {
        ...state,
        items: {
          ...state.items,
          [action.payload.id]: action.payload.quantity
        }
      };
      
    case CART_ACTIONS.ADD_MODIFIED_PRODUCT:
      const { product, modifiedProduct } = action.payload;
      return {
        ...state,
        items: {
          ...state.items,
          [product.id]: (state.items[product.id] || 0) + 1
        },
        modifiedProducts: {
          ...state.modifiedProducts,
          [product.id]: modifiedProduct
        }
      };
      
    case CART_ACTIONS.UPDATE_NOTES:
      return {
        ...state,
        notes: {
          ...state.notes,
          [action.payload.id]: action.payload.notes
        }
      };
      
    case CART_ACTIONS.CLEAR_CART:
      return {
        items: {},
        notes: {},
        modifiedProducts: {}
      };
      
    default:
      return state;
  }
};

/**
 * Hook personalizado para el carrito de compras
 */
export const useCart = () => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: {},
    notes: {},
    modifiedProducts: {}
  });

  // Agregar producto simple
  const addItem = useCallback((product) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { id: product.id }
    });
  }, []);

  // Remover producto
  const removeItem = useCallback((productId) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { id: productId }
    });
  }, []);

  // Actualizar cantidad
  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { id: productId, quantity }
    });
  }, []);

  // Agregar producto modificado (con modificadores)
  const addModifiedProduct = useCallback((product, modifiedProduct) => {
    dispatch({
      type: CART_ACTIONS.ADD_MODIFIED_PRODUCT,
      payload: { product, modifiedProduct }
    });
  }, []);

  // Actualizar notas
  const updateNotes = useCallback((productId, notes) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_NOTES,
      payload: { id: productId, notes }
    });
  }, []);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  }, []);

  // Calcular productos del carrito con memoización
  const cartProducts = useMemo(() => {
    return Object.entries(state.items).map(([productId, quantity]) => {
      const modifiedProduct = state.modifiedProducts[productId];
      
      if (modifiedProduct) {
        return {
          id: productId,
          nombre: modifiedProduct.nombre,
          cantidad: quantity,
          precio: modifiedProduct.precio,
          subtotal: modifiedProduct.precio * quantity,
          notas: state.notes[productId] || '',
          displayText: modifiedProduct.displayText || modifiedProduct.nombre,
          originalModifiers: modifiedProduct.originalModifiers
        };
      }
      
      // Producto normal sin modificadores
      // Nota: productos normales deberían pasarse como parámetro o contexto
      return {
        id: productId,
        nombre: `Producto ${productId}`, // Temporal
        cantidad: quantity,
        precio: 0, // Temporal
        subtotal: 0, // Temporal
        notas: state.notes[productId] || ''
      };
    });
  }, [state.items, state.modifiedProducts, state.notes]);

  // Calcular total
  const total = useMemo(() => {
    return cartProducts.reduce((sum, product) => sum + product.subtotal, 0);
  }, [cartProducts]);

  // Verificar si el carrito está vacío
  const isEmpty = useMemo(() => {
    return Object.keys(state.items).length === 0;
  }, [state.items]);

  // Cantidad total de items
  const totalItems = useMemo(() => {
    return Object.values(state.items).reduce((sum, quantity) => sum + quantity, 0);
  }, [state.items]);

  return {
    // Estado
    items: state.items,
    notes: state.notes,
    modifiedProducts: state.modifiedProducts,
    
    // Datos computados
    cartProducts,
    total,
    isEmpty,
    totalItems,
    
    // Acciones
    addItem,
    removeItem,
    updateQuantity,
    addModifiedProduct,
    updateNotes,
    clearCart
  };
};

export default useCart; 