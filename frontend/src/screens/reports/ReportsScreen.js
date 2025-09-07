import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export function ReportsScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [classification, setClassification] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Solicitar permisos para la cámara
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Se requieren permisos para la cámara');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      classifyImage(result.assets[0].uri);
    }
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
      <Button title="Tomar Foto" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {loading && <Text style={styles.text}>Cargando clasificación...</Text>}
      {classification && (
        <View style={styles.result}>
          <Text style={styles.text}>Tipo de residuo: {classification.type}</Text>
          <Text style={styles.text}>Confianza: {classification.confianza}%</Text> {/* Corrección de 'confidence' a 'confianza' */}
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
});