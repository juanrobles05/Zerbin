import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Hook para manejar la selección de imágenes desde la galería del dispositivo
 * Incluye:
 * - Solicitud de permisos de galería
 * - Selección de imagen con validación de formato
 * - Redimensionamiento automático de imagen
 */
export const useImagePicker = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Solicita permisos para acceder a la galería de medios
   * @returns {Promise<boolean>} true si se otorgan los permisos
   */
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        "Permisos requeridos",
        "Zerbin necesita acceso a tu galería para seleccionar fotos de residuos"
      );
      return false;
    }
    return true;
  };

  /**
   * Valida que la imagen sea de un formato permitido (JPG o PNG)
   * @param {string} uri - URI de la imagen
   * @returns {boolean} true si el formato es válido
   */
  const validateImageFormat = (uri) => {
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const lowerUri = uri.toLowerCase();
    return validExtensions.some(ext => lowerUri.includes(ext));
  };

  /**
   * Abre el selector de imágenes de la galería
   * Valida formato y redimensiona automáticamente
   * @returns {Promise<Object|null>} objeto con uri de la imagen o null si se cancela
   */
  const pickImageFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return null;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        exif: false,
      });

      if (result.canceled) {
        setIsLoading(false);
        return null;
      }

      const selectedImage = result.assets[0];

      // Validar formato de imagen
      if (!validateImageFormat(selectedImage.uri)) {
        Alert.alert(
          "Formato no válido",
          "Por favor selecciona una imagen en formato JPG o PNG"
        );
        setIsLoading(false);
        return null;
      }

      // Redimensionar la imagen a un ancho máximo de 1024 píxeles
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        selectedImage.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setIsLoading(false);
      return manipulatedImage;

    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar la imagen");
      console.error('Error picking image:', error);
      setIsLoading(false);
      return null;
    }
  };

  return {
    pickImageFromGallery,
    isLoading,
    requestMediaLibraryPermission,
  };
};
