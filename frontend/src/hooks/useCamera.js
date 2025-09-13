import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Camera, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';


export const useCamera = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
  requestCameraPermission();
  }, []);

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
        quality: 0.9,
        base64: false,
        exif: false
      });

      if (!photo) return null;

      // Redimensionar la imagen a un ancho máximo de 1024 píxeles
      const manipulatedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      return manipulatedPhoto;

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