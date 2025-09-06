import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';

export function CameraPreview({ imageUri, onConfirm, onRetake }) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.controls}>
        <TouchableOpacity onPress={onRetake} style={styles.button}>
          <Text style={styles.buttonText}>Retomar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onConfirm} style={styles.button}>
          <Text style={styles.buttonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  button: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#000',
  },
});
