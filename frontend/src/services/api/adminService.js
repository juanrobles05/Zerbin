import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../utils/constants';

// Crear una instancia dedicada de axios para admin
const adminAxios = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Interceptor para agregar el token automáticamente
adminAxios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@zerbin_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
adminAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ Admin API Error:', {
      url: error.config?.url,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

export const adminService = {
  /**
   * Obtener todos los reportes (solo admin)
   */
  async getAllReports(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.priority !== undefined) params.append('priority', filters.priority);
      if (filters.skip !== undefined) params.append('skip', filters.skip);
      if (filters.limit !== undefined) params.append('limit', filters.limit);

      const url = `/v1/admin/reports${params.toString() ? '?' + params.toString() : ''}`;
      const response = await adminAxios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching all reports:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Actualizar el estado de un reporte (solo admin)
   */
  async updateReportStatus(reportId, newStatus) {
    try {
      const response = await adminAxios.patch(
        `/v1/admin/reports/${reportId}/status`,
        { status: newStatus }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating report status:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtener estadísticas del sistema (solo admin)
   */
  async getStats() {
    try {
      const response = await adminAxios.get('/v1/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error.response?.data || error.message);
      throw error;
    }
  }
};
