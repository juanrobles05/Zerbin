import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>¡Bienvenido a la pantalla de reportes!</Text>
      <Text style={styles.subtext}>Aquí verás un listado de tus reportes de residuos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
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
  },
});