import axios from 'axios';
import { API_CONFIG } from '../../utils/constants';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Simple POST with retry (exponential backoff) for network errors
const postWithRetry = async (url, data, config = {}, attempts = 3) => {
  const baseDelay = 300; // ms
  for (let i = 1; i <= attempts; i++) {
    try {
      return await apiClient.post(url, data, config);
    } catch (err) {
      const isNetworkError = !err.response;
      if (!isNetworkError || i === attempts) throw err;
      const delay = baseDelay * Math.pow(2, i - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

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

      const response = await postWithRetry(
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
  const response = await apiClient.get(`/v1/priority/classifications/${wasteType}/priority`);
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
  createReport: async (imageUri, location, description, classification, manualClassification) => {
    try {
      const formData = new FormData();
      formData.append('image', buildFile(imageUri));
      formData.append('latitude', String(location?.coords?.latitude ?? ''));
      formData.append('longitude', String(location?.coords?.longitude ?? ''));

      // Send AI classification under both 'classification' and 'ai_classification' (compat)
      if (classification) {
        formData.append('classification', JSON.stringify(classification));
        formData.append('ai_classification', JSON.stringify(classification));
      }

      // Send manual selection separately under 'manual_classification'
      if (manualClassification) {
        if (typeof manualClassification === 'string') {
          formData.append('manual_classification', manualClassification);
        } else {
          formData.append('manual_classification', JSON.stringify(manualClassification));
        }
      }

      if (description) formData.append('description', description);

      const response = await postWithRetry(
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
  }, 

  getUserPoints: async (userId = 1) => {
    try {
      const resp = await apiClient.get(API_CONFIG.ENDPOINTS.POINTS(userId));
      return resp.data;
    } catch (err) {
      console.error('Error fetching user points:', err);
      throw err;
    }
  },

  // Get all reports for a specific user, optionally filtered by status
  getUserReports: async (userId = 1, status = null, page = 1, limit = 50) => {
    try {
      const skip = (page - 1) * limit;
      let url = `${API_CONFIG.ENDPOINTS.REPORTS}user/${userId}?skip=${skip}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }

      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw error;
    }
  },
};


// Convenience wrapper for priority endpoint with fallback handling
export const priority = {
  getPriorityForType: async (wasteType) => {
    try {
  const resp = await apiClient.get(`/v1/priority/classifications/${encodeURIComponent(wasteType)}/priority`);
      return resp.data;
    } catch (err) {
      // If the priority endpoint fails (no DB or network), return a safe fallback
      console.warn('Priority endpoint failed, returning fallback for', wasteType, err?.message || err);
      // Fallback: low priority default
      return {
        priority: 1,
        decomposition_days: 365,
        is_urgent: false,
        waste_type: wasteType,
        description: 'fallback: priority service unavailable',
      };
    }
  }
};