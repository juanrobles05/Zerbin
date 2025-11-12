import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../utils/constants';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Interceptor para agregar el token JWT automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@zerbin_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado - podría redirigir al login
      console.warn('Sesión expirada o no autorizada');
    }
    return Promise.reject(error);
  }
);

export const rewardService = {
  /**
   * Obtiene todas las recompensas disponibles
   * @returns {Promise<Array>} Lista de recompensas
   */
  getRewards: async () => {
    try {
      const response = await apiClient.get('/v1/rewards/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo recompensas:', error);
      throw error;
    }
  },

  /**
   * Canjea una recompensa para un usuario
   * @param {number} userId - ID del usuario
   * @param {number} rewardId - ID de la recompensa
   * @returns {Promise<Object>} Resultado del canje
   */
  redeemReward: async (userId, rewardId) => {
    try {
      const response = await apiClient.post('/v1/rewards/redeem', {
        user_id: userId,
        reward_id: rewardId
      });
      return response.data;
    } catch (error) {
      console.error('Error canjeando recompensa:', error);
      throw error;
    }
  },

  /**
   * Obtiene el historial de canjes del usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Lista de canjes
   */
  getUserRedemptions: async (userId) => {
    try {
      const response = await apiClient.get(`/v1/rewards/redemptions/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial de canjes:', error);
      throw error;
    }
  },
};
