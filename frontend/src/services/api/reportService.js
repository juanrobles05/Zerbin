import axios from 'axios';
import { API_CONFIG } from '../../utils/constants';
import firebaseApp from '../../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";

const storage = getStorage(firebaseApp);

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const uploadImageToFirebase = async (imageUri) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const storageRef = ref(storage, `images/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase:', error);
    throw error;
  }
};

export const classify = {
  image: async (imageUri) => {
    try {

      const downloadURL = await uploadImageToFirebase(imageUri);

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.CLASSIFY_IMAGE,
        { image_url: downloadURL }, // payload con la URL de Firebase
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        downloadURL,
        classification: response.data
      }
    } catch (error) {
      console.error('Error classifying image:', error);
      throw error;
    }
  }
};

export const reportService = {
  uploadImage: async (imageUri, location, description) => {
    try {

      const { downloadURL, classification } = await classify.image(imageUri);

      const payload = {
        image_url: downloadURL,
        latitude: location?.coords.latitude || null,
        longitude: location?.coords.longitude || null,
        description: description || null,
        manual_classification: null,
        address: null,
        ai_classification: classification || null
      };

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.UPLOAD_IMAGE,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
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