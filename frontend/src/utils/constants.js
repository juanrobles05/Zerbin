import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  // Detectar IP automáticamente desde Expo (si se ejecuta en modo dev)
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localIP = debuggerHost ? debuggerHost.split(':')[0] : null;

  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android Emulator -> usa 10.0.2.2
      // Android físico -> usa la IP local
      if (localIP) {
        return `http://${localIP}:8000/api`;
      }
      // Fallback si no se detecta automáticamente
      return 'http://192.168.0.102:8000/api'; // ⚠️ reemplaza por tu IP local si falla
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:8000/api';
    } else {
      return 'http://localhost:8000/api';
    }
  }

  // Producción
  return 'https://api.zerbin.com/api';
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  TIMEOUT: 120000,
  ENDPOINTS: {
    REPORTS: '/v1/reports/',
    CLASSIFY_IMAGE: '/v1/classify/',
    PRIORITY: '/v1/priority/',
    POINTS: (userId) => `/v1/users/${userId}/points`,
    HEALTH: '/health',
  },
};

export const CAMERA_CONFIG = {
  QUALITY: 0.8,
  ASPECT_RATIO: [4, 3],
  ALLOW_EDITING: false,
};

export const PERMISSIONS = {
  CAMERA: 'camera',
  LOCATION: 'location',
};

// Log de configuración
if (__DEV__) {
  console.log('🔗 API Configuration:');
  console.log('  Platform:', Platform.OS);
  console.log('  Base URL:', API_CONFIG.BASE_URL);
  console.log('  Full Reports URL:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.REPORTS);
}