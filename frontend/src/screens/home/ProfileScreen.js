import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { THEME } from '../../styles/theme';
import { reportService } from '../../services/api/reportService';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function ProfileScreen({ navigation }) {
  const [points, setPoints] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();

  // Si el usuario NO está autenticado (ingresó sin cuenta)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <FontAwesome5 name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Perfil</Text>
          </View>

          <View style={styles.noAccountContainer}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="user-slash" size={80} color="#607D8B" />
            </View>

            <Text style={styles.noAccountTitle}>No hay cuenta activa</Text>
            <Text style={styles.noAccountSubtitle}>
              Para acceder a tu perfil y ver tus puntos acumulados, necesitas crear una cuenta o iniciar sesión.
            </Text>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Register' }],
                });
              }}
            >
              <FontAwesome5 name="user-plus" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.registerButtonText}>Crear Cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }}
            >
              <Text style={styles.loginButtonText}>Ya tengo cuenta - Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    let mounted = true;

    const loadPoints = async () => {
      try {
        // If user is not logged, nothing to do
        if (!user?.id) {
          // try read cached points if any
          const cached = await AsyncStorage.getItem('user_points');
          if (mounted && cached != null) setPoints(Number(cached) || 0);
          return;
        }

        const lastReportAt = await AsyncStorage.getItem('last_report_at'); // set when a new report is created
        const lastChecked = await AsyncStorage.getItem('profile_last_checked_report_at');

        // If there's a new report since last check -> fetch fresh points
        if (lastReportAt && lastReportAt !== lastChecked) {
          try {
            const resp = await reportService.getUserPoints(user.id);
            const pts = (resp && typeof resp === 'object' && 'points' in resp) ? resp.points : Number(resp) || 0;
            if (mounted) setPoints(pts);
            await AsyncStorage.setItem('user_points', String(pts));
            await AsyncStorage.setItem('profile_last_checked_report_at', lastReportAt);
            return;
          } catch (err) {
            console.warn('Failed to refresh points after new report:', err?.message || err);
            // fallthrough to cached value if available
          }
        }

        // No new report or refresh failed -> use cached points if present
        const cachedPoints = await AsyncStorage.getItem('user_points');
        if (mounted && cachedPoints != null) {
          setPoints(Number(cachedPoints) || 0);
          return;
        }

        // No cache -> last resort fetch from backend
        try {
          const resp = await reportService.getUserPoints(user.id);
          const pts = (resp && typeof resp === 'object' && 'points' in resp) ? resp.points : Number(resp) || 0;
          if (mounted) setPoints(pts);
          await AsyncStorage.setItem('user_points', String(pts));
          // set last_checked to now (no new report marker)
          await AsyncStorage.setItem('profile_last_checked_report_at', Date.now().toString());
        } catch (err) {
          console.warn('Failed to fetch points (fallback):', err?.message || err);
        }
      } catch (err) {
        console.warn('loadPoints error:', err?.message || err);
      }
    };

    loadPoints();
    return () => { mounted = false; };
  }, [user?.id, user?.points]);

  // Si el usuario SÍ está autenticado
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>

        {/* Avatar y nombre */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <FontAwesome5 name="user-circle" size={80} color="#3CB371" />
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Puntos acumulados */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsContent}>
            <FontAwesome5 name="star" size={40} color="#FFD700" />
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsNumber}>{points}</Text>
              <Text style={styles.pointsLabel}>Puntos acumulados</Text>
            </View>
          </View>
        </View>

        {/* Información de la cuenta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de la cuenta</Text>

          <View style={styles.infoItem}>
            <FontAwesome5 name="user" size={18} color="#B0BEC5" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nombre de usuario</Text>
              <Text style={styles.infoValue}>{user?.username}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome5 name="envelope" size={18} color="#B0BEC5" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <FontAwesome5 name="calendar" size={18} color="#B0BEC5" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Miembro desde</Text>
              <Text style={styles.infoValue}>
                {user?.created_at 
                  ? new Date(user.created_at).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Estadísticas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mis estadísticas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <FontAwesome5 name="file-alt" size={24} color="#3CB371" />
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Reportes</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome5 name="check-circle" size={24} color="#32CD32" />
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Resueltos</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome5 name="trophy" size={24} color="#FFD700" />
              <Text style={styles.statNumber}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>Puntos</Text>
            </View>
          </View>
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              'Cerrar sesión',
              '¿Estás seguro que deseas cerrar sesión?',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
                {
                  text: 'Cerrar sesión',
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
          }}
        >
          <FontAwesome5 name="sign-out-alt" size={20} color="#FF6347" style={styles.buttonIcon} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3A4750',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#3A4750',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4E5B66',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Estilos para usuario NO autenticado
  noAccountContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.5,
  },
  noAccountTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  noAccountSubtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  registerButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    paddingVertical: 12,
  },
  loginButtonText: {
    color: '#3CB371',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  buttonIcon: {
    marginRight: 8,
  },
  // Estilos para usuario autenticado
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#4E5B66',
    borderBottomWidth: 1,
    borderBottomColor: '#607D8B',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#B0BEC5',
  },
  pointsCard: {
    margin: 20,
    backgroundColor: '#4E5B66',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  pointsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsInfo: {
    marginLeft: 20,
    flex: 1,
  },
  pointsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#B0BEC5',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#4E5B66',
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#607D8B',
  },
  infoIcon: {
    marginRight: 12,
    width: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#90A4AE',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6347',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FF6347',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
