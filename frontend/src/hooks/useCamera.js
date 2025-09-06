import { useState } from 'react';
import { Alert } from 'react-native';
import { Camera, useCameraPermissions } from 'expo-camera';

export const useCamera = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);

  const requestCameraPermission = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permisos requeridos",
          "Zerbin necesita acceso a la cámara para tomar fotos de residuos"
        );
        return false;
      }
    }
    return true;
  };

  const takePicture = async (cameraRef) => {
    if (!cameraRef.current) return null;
    
    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false
      });
      return photo;
    } catch (error) {
      Alert.alert("Error", "No se pudo capturar la foto");
      console.error(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    permission,
    requestCameraPermission,
    takePicture,
    isLoading
  };
};