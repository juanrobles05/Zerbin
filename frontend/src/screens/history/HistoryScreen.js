import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import axios from 'axios';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { THEME } from '../../styles/theme';

export function HistoryScreen({ navigation, route }) {
  const [imageUri, setImageUri] = useState(null);
  const [classification, setClassification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route?.params?.imageUri) {
      setImageUri(route.params.imageUri);
      classifyImage(route.params.imageUri);
      // Limpia el parámetro para evitar reprocesar
      navigation.setParams({ imageUri: undefined });
    }
  }, [route?.params?.imageUri]);

  const handleOpenCamera = () => {
    // Navega a CameraScreen y espera el resultado
    navigation.navigate('Camera', { from: 'Reports' });
  };

  const handlePhotoTaken = (uri) => {
    setImageUri(uri);
    classifyImage(uri);
  };

  const classifyImage = async (uri) => {
    setLoading(true);
    let formData = new FormData();
    formData.append('image', {
      uri,
      name: 'waste.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await axios.post('http://localhost:8000/api/v1/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setClassification(response.data);
    } catch (error) {
      console.error('Error clasificando:', error);
      alert('Error al clasificar la imagen');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>¡Bienvenido a la pantalla de reportes!</Text>
      <Text style={styles.subtext}>Aquí verás un listado de tus reportes de residuos.</Text>
      <TouchableOpacity style={styles.cameraButtonContainer}  onPress={handleOpenCamera}>
        <LinearGradient
          colors={["#10b981", "#059669", "#047857"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cameraButton}
        >
          <FontAwesome5 name="camera" size={30} color={THEME.colors.white} />
          <Text style={styles.cameraButtonText}>Tomar Foto</Text>
        </LinearGradient>
      </TouchableOpacity>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {loading && <Text style={styles.text}>Cargando clasificación...</Text>}
      {classification && (
        <View style={styles.result}>
          <Text style={styles.text}>Tipo de residuo: {classification.type}</Text>
          <Text style={styles.text}>Confianza: {classification.confianza}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 10,
  },
  result: {
    marginTop: 10,
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30
  },
  cameraButtonText: {
    color: THEME.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10
  },
  cameraContainer: {
    flex: 1
  },
});