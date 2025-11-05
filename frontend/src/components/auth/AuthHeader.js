import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../styles/colors';

/**
 * Header personalizado que muestra información del usuario y botón de logout
 * Se puede usar en screens protegidas para mostrar datos de autenticación
 */
export const AuthHeader = ({ navigation }) => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.points}>⭐ {user.points || 0} puntos</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Botón simple de logout para usar en cualquier parte de la app
 */
export const LogoutButton = ({ navigation, style }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={[styles.simpleButton, style]} onPress={handleLogout}>
      <Text style={styles.simpleButtonText}>Cerrar Sesión</Text>
    </TouchableOpacity>
  );
};

/**
 * Badge que muestra los puntos del usuario
 */
export const PointsBadge = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <View style={styles.pointsBadge}>
      <Text style={styles.pointsEmoji}>⭐</Text>
      <Text style={styles.pointsValue}>{user.points || 0}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  points: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  simpleButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.error,
    borderRadius: 8,
    alignItems: 'center',
  },
  simpleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});
