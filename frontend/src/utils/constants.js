import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
    // Obtener IP automáticamente si está disponible
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localIP = debuggerHost ? debuggerHost.split(':')[0] : null;
    
    if (__DEV__) {
        // Modo desarrollo
        if (Platform.OS === 'android') {
            // Android Emulator: usa 10.0.2.2 para localhost de la máquina host
            // Android Device: usa la IP local
            if (localIP) {
                // Si tenemos la IP del debugger, úsala
                return `http://${localIP}:8000/api`;
            }
            // Fallback: Reemplaza con tu IP local real
            return 'http://192.168.58.162:8000/api'; // ⚠️ CAMBIAR POR TU IP
        } else if (Platform.OS === 'ios') {
            // iOS Simulator puede usar localhost
            return 'http://localhost:8000/api';
        } else {
            // Web
            return 'http://localhost:8000/api';
        }
    }
    
    // Producción - URL real del servidor
    return 'https://api.zerbin.com/api';
};

export const API_CONFIG = {
    BASE_URL: getApiUrl(),
    TIMEOUT: 120000, // 120 segundos
    ENDPOINTS: {
        REPORTS: '/v1/reports/',
        CLASSIFY_IMAGE: '/v1/classify/',
        HEALTH: '/health', // Para testing
    }
};

export const CAMERA_CONFIG = {
    QUALITY: 0.8,
    ASPECT_RATIO: [4, 3],
    ALLOW_EDITING: false
};

export const PERMISSIONS = {
    CAMERA: 'camera',
    LOCATION: 'location'
};

// Log para debugging
if (__DEV__) {
    console.log('🔗 API Configuration:');
    console.log('  Platform:', Platform.OS);
    console.log('  Base URL:', API_CONFIG.BASE_URL);
    console.log('  Full Reports URL:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.REPORTS);
}