import api from './api';

export const orderService = {
  // Obtener todos los pedidos
  // Obtener todos los pedidos (Admin)
  getAllOrders: async () => {
    try {
      console.log('📡 orderService - Solicitando TODOS los pedidos...');
      const response = await api.get('/orders');
      console.log('📦 orderService - Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ orderService - Error en getAllOrders:', error);
      throw error.response?.data || error.message;
    }
  },

  // Obtener pedidos del usuario
  getUserOrders: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/orders`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Crear pedido
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Actualizar estado del pedido
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Eliminar pedido
  deleteOrder: async (orderId) => {
    try {
      const response = await api.delete(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};