import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../utils/constants';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Keys para AsyncStorage
const TOKEN_KEY = '@zerbin_auth_token';
const USER_KEY = '@zerbin_user_data';

/**
 * Servicio de autenticación para registro, login y gestión de tokens
 */
export const authService = {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario (username, email, password)
   * @returns {Promise<Object>} Usuario registrado
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post('/v1/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Inicia sesión con email y password
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { access_token, token_type, user }
   */
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/v1/auth/login', credentials);
      const { access_token, user } = response.data;
      
      // Guardar token y datos de usuario en AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, access_token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario (elimina token y datos locales)
   */
  logout: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  /**
   * Obtiene el token guardado
   * @returns {Promise<string|null>} Token o null
   */
  getToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  /**
   * Obtiene los datos del usuario guardados localmente
   * @returns {Promise<Object|null>} Usuario o null
   */
  getUser: async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  /**
   * Verifica si el usuario está autenticado (tiene token válido)
   * @returns {Promise<boolean>}
   */
  isAuthenticated: async () => {
    const token = await authService.getToken();
    return !!token;
  },

  /**
   * Obtiene la información del usuario actual desde el servidor
   * @returns {Promise<Object>} Datos del usuario
   */
  getCurrentUser: async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiClient.get('/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Actualizar datos locales
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error.response?.data || error.message);
      throw error;
    }
  },
};

/**
 * Interceptor para agregar el token JWT automáticamente a todas las peticiones
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor para manejar errores de autenticación (token expirado, etc.)
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado - hacer logout automático
      await authService.logout();
    }
    return Promise.reject(error);
  }
);

export default authService;
