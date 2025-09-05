import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useCamera } from '../../hooks/useCamera';
import { useLocation } from '../../hooks/useLocation';
import { CameraControls } from '../../components/camera/CameraControls';
import { CameraPreview } from '../../components/camera/CameraPreview';
import { reportService } from '../../services/api/reportService';
import { THEME } from '../../styles/theme';

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
      {/* Contenido de la pantalla inicial */}
      {/* Aquí irá tu interfaz principal */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background
  },
  cameraContainer: {
    flex: 1
  },
  camera: {
    flex: 1
  }
});