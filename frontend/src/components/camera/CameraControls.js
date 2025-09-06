import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

export function CameraControls({ onCapture, onClose }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.buttonText}>X</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCapture} style={styles.captureButton}>
        <Text style={styles.buttonText}>Capturar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  captureButton: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 20,
  },
  closeButton: {
    // Estilos para el botón de cerrar
  },
  buttonText: {
    color: '#000',
  },
});
