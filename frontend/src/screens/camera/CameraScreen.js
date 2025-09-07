import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity, // Importa TouchableOpacity para el botón
  Alert
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useCamera } from '../../hooks/useCamera';
import { useLocation } from '../../hooks/useLocation';
import { CameraControls } from '../../components/camera/CameraControls';
import { CameraPreview } from '../../components/camera/CameraPreview';
import { reportService } from '../../services/api/reportService';
import { THEME } from '../../styles/theme';
import { FontAwesome5 } from '@expo/vector-icons'; // Importa el ícono de la cámara

export const CameraScreen = ({ navigation }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const cameraRef = useRef(null);

  const { requestCameraPermission, takePicture, isLoading } = useCamera();
  const { getCurrentLocation } = useLocation();

  const handleCameraPress = async () => {
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      setShowCamera(true);
    }
  };

  const handleTakePicture = async () => {
    const photo = await takePicture(cameraRef);
    if (photo) {
      setCapturedImage(photo);
      setShowCamera(false);
      setShowPreview(true);
    }
  };

  const handleConfirmPhoto = async () => {
    if (!capturedImage) return;

    try {
      const location = await getCurrentLocation();
      
      await reportService.uploadImage(capturedImage.uri, location);
      
      Alert.alert(
        "¡Éxito!",
        "La foto ha sido enviada exitosamente",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el reporte");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowPreview(false);
    setShowCamera(true);
  };

  if (showPreview && capturedImage) {
    return (
      <CameraPreview
        imageUri={capturedImage.uri}
        onConfirm={handleConfirmPhoto}
        onRetake={handleRetake}
        isLoading={isLoading}
      />
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="back"
        >
          <CameraControls
            onCapture={handleTakePicture}
            onClose={() => setShowCamera(false)}
            isLoading={isLoading}
          />
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.mainText}>¿Listo para reportar un residuo?</Text>
        <Text style={styles.subText}>Presiona el botón para abrir la cámara y tomar una foto.</Text>
        <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
          <FontAwesome5 name="camera" size={30} color={THEME.colors.white} />
          <Text style={styles.cameraButtonText}>Abrir Cámara</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  cameraButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  cameraButtonText: {
    color: THEME.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cameraContainer: {
    flex: 1
  },
  camera: {
    flex: 1
  }
});
