import axios from 'axios';
import { API_CONFIG } from '../../utils/constants';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Helper to build a file object compatible with React Native FormData
const buildFile = (imageUri, name = `photo_${Date.now()}.jpg`, type = 'image/jpeg') => {
  return {
    uri: imageUri,
    name,
    type,
  };
};

export const classify = {
  image: async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('image', buildFile(imageUri));

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.CLASSIFY_IMAGE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error classifying image:', error);
      throw error;
    }
  }
};

export const priorityService = {
  // Obtener información de prioridad para un tipo de residuo
  getPriorityInfo: async (wasteType) => {
    try {
      const response = await apiClient.get(`/priority/classifications/${wasteType}/priority`);
      return response.data;
    } catch (error) {
      console.error('Error getting priority info:', error);
      throw error;
    }
  },

  // Obtener estadísticas de prioridad
  getPriorityStats: async () => {
    try {
      const response = await apiClient.get('/priority/priority-stats');
      return response.data;
    } catch (error) {
      console.error('Error getting priority stats:', error);
      throw error;
    }
  },

  // Obtener reportes urgentes
  getUrgentReports: async () => {
    try {
      const response = await apiClient.get('/reports/urgent');
      return response.data;
    } catch (error) {
      console.error('Error getting urgent reports:', error);
      throw error;
    }
  }
};

export const reportService = {
  // Create report by sending image file + fields as multipart/form-data
  createReport: async (imageUri, location, description, classification) => {
    try {
      const formData = new FormData();
      formData.append('image', buildFile(imageUri));
      formData.append('latitude', String(location?.coords?.latitude ?? ''));
      formData.append('longitude', String(location?.coords?.longitude ?? ''));

      if (classification) {
        formData.append('ai_classification', JSON.stringify(classification));
      }

      if (description) formData.append('description', description);

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.REPORTS,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },
  updateReportClassification: async (reportId, correctedType) => {
    try {
      const response = await apiClient.patch(`${API_CONFIG.ENDPOINTS.REPORTS}${reportId}/classification`, {
        corrected_type: correctedType
      });
      return response.data;
    } catch (error) {
      console.error('Error updating classification:', error);
      throw error;
    }
  }
};