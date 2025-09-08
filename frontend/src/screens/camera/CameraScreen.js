import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { useCamera } from '../../hooks/useCamera';
import { useLocation } from '../../hooks/useLocation';
import { CameraControls } from '../../components/camera/CameraControls';
import { CameraPreview } from '../../components/camera/CameraPreview';
import { THEME } from '../../styles/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const CameraScreen = ({ navigation, route }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [photoLocation, setPhotoLocation] = useState(null);
  const [showCoords, setShowCoords] = useState(false);
  const cameraRef = useRef(null);
  const hideTimer = useRef(null);

  const { requestCameraPermission, takePicture, isLoading } = useCamera();
  const {
    location,
    isLoading: isLocationLoading,
    requestLocationPermission,
    getCurrentLocation,
    startWatchingLocation,
    stopWatchingLocation
  } = useLocation();

  useEffect(() => {
    return () => {
      stopWatchingLocation();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const handleCameraPress = async () => {
    const hasCamera = await requestCameraPermission();
    const hasLocation = await requestLocationPermission();
    if (hasCamera) {
      setShowCamera(true);
      if (hasLocation) startWatchingLocation();
    }
  };

  const handleTakePicture = async () => {
    const photo = await takePicture(cameraRef);
    if (photo) {
      let loc = location;
      if (!loc) loc = await getCurrentLocation();
      setPhotoLocation(loc);
      setCapturedImage(photo);
      setShowCamera(false);
      stopWatchingLocation();
      setShowPreview(true);
    }
  };

  const handleConfirmPhoto = async () => {
    if (!capturedImage) return;
    try {
      let locationToSend = photoLocation;
      if (!locationToSend) locationToSend = await getCurrentLocation();
      navigation.navigate('Report', { image: capturedImage.uri, location: locationToSend });
    } catch {
      Alert.alert('Error', 'No se pudo enviar el reporte');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPhotoLocation(null);
    setShowPreview(false);
    setShowCamera(true);
    startWatchingLocation();
  };

  const handleToggleCoords = () => {
    setShowCoords(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCoords(false), 2000);
  };

  if (showPreview && capturedImage) {
    const coords = photoLocation?.coords;
    return (
      <View style={{ flex: 1 }}>
        <CameraPreview
          imageUri={capturedImage.uri}
          onConfirm={handleConfirmPhoto}
          onRetake={handleRetake}
          onShowCoords={handleToggleCoords}
        />
        {showCoords && (
          <View style={[styles.coordsBadge, { position: 'absolute', bottom: 120, alignSelf: 'center', zIndex: 10 }]}> 
            {isLocationLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.coordsText}>
                {coords ? `Lat ${coords.latitude.toFixed(6)}, Lon ${coords.longitude.toFixed(6)}` : 'Ubicación no disponible'}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          <CameraControls onCapture={handleTakePicture} onClose={() => { setShowCamera(false); stopWatchingLocation(); }} isLoading={isLoading} />
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.mainText}>¿Listo para reportar un residuo?</Text>
        <Text style={styles.subText}>Presiona el botón para abrir la cámara y tomar una foto.</Text>

        <TouchableOpacity style={styles.cameraButtonContainer} onPress={handleCameraPress}>
          <LinearGradient
            colors={["#10b981", "#059669", "#047857"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cameraButton}
          >
            <FontAwesome5 name="camera" size={30} color={THEME.colors.white} />
            <Text style={styles.cameraButtonText}>Abrir Cámara</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  mainText: { fontSize: 24, fontWeight: 'bold', color: THEME.colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  subText: { fontSize: 16, color: THEME.colors.textSecondary, marginBottom: 30, textAlign: 'center' },
  cameraButton: { backgroundColor: THEME.colors.primary, borderRadius: 50, flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 30 },
  cameraButtonText: { color: THEME.colors.white, fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  fabContainer: { position: 'absolute', right: 16, bottom: 20, alignItems: 'flex-end' },
  fab: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 , marginTop: 6 },
  coordsBadge: { marginBottom: 6, backgroundColor: THEME.colors.backdrop ?? 'rgba(0,0,0,0.75)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, maxWidth: 280 },
  coordsText: { color: THEME.colors.white, fontSize: 14 }
});
