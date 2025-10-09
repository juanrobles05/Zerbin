import axios from 'axios';
import { API_CONFIG } from '../../utils/constants';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 20000,
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
};