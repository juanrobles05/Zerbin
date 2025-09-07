import { Platform } from 'react-native';

const getApiUrl = () => {
    // Si estás en un emulador de Android, usa la IP de tu computadora
    if (Platform.OS === 'android') {
        // Reemplaza '192.168.1.100' con la dirección IPv4 de tu PC
        return 'http://192.168.65.241:8000/api'; 
    }
    // Para iOS y web, 'localhost' funciona
    return 'http://localhost:8000/api';
};

export const API_CONFIG = {
    BASE_URL: getApiUrl(),
    ENDPOINTS: {
        REPORTS: '/v1/reports',
        UPLOAD_IMAGE: '/v1/reports'
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
