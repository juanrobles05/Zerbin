import axios from 'axios';
import { API_CONFIG } from '../../utils/constants';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const reportService = {
  uploadImage: async (imageUri, location) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `waste-report-${Date.now()}.jpg`
      });
      
      if (location) {
        formData.append('latitude', location.coords.latitude.toString());
        formData.append('longitude', location.coords.longitude.toString());
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.UPLOAD_IMAGE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  createReport: async (reportData) => {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.REPORTS,
        reportData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }
};