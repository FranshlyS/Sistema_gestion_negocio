import api from './api';

export const productService = {
  // Obtener todos los productos
  getProducts: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Obtener producto específico
  getProduct: async (productId) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Crear producto por pack
  createPackProduct: async (productData) => {
    try {
      const response = await api.post('/products/pack', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Crear producto por peso
  createWeightProduct: async (productData) => {
    try {
      const response = await api.post('/products/weight', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Actualizar producto por pack
  updatePackProduct: async (productId, productData) => {
    try {
      const response = await api.put(`/products/pack/${productId}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Actualizar producto por peso
  updateWeightProduct: async (productId, productData) => {
    try {
      const response = await api.put(`/products/weight/${productId}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  },

  // Eliminar producto
  deleteProduct: async (productId) => {
    try {
      const response = await api.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' };
    }
  }
};