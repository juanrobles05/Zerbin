import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../styles/theme';
import { FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportService } from '../../services/api/reportService';

// Componente para los botones principales
const MainButton = ({ iconName, text, subtext, onPress }) => (
  <TouchableOpacity style={styles.mainButtonContainer} onPress={onPress}>
    <LinearGradient
      colors={["#10b981", "#059669", "#047857"]}
      style={styles.mainButton}
    >
      <View style={styles.mainButtonIcon}>
        <FontAwesome5 name={iconName} size={40} color={THEME.colors.white} />
      </View>
      <Text style={styles.mainButtonText}>{text}</Text>
      <Text style={styles.mainButtonSubtext}>{subtext}</Text>
    </LinearGradient>
  </TouchableOpacity>
)

// Componente para el resumen de actividad
const ActivitySummary = ({ reports, resolved, pending }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Resumen de Actividad</Text>
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryNumber, { color: '#10b981' }]}>{reports}</Text>
        <Text style={styles.summaryLabel}>Reportes</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryNumber, { color: '#22c55e' }]}>{resolved}</Text>
        <Text style={styles.summaryLabel}>Resueltos</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryNumber, { color: '#eab308' }]}>{pending}</Text>
        <Text style={styles.summaryLabel}>Pendientes</Text>
      </View>
    </View>
  </View>
);

// Componente para un reporte reciente
const RecentReport = ({ report }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resuelto':
      case 'resolved':
        return '#22c55e';
      case 'en_proceso':
      case 'in_progress':
        return '#3b82f6';
      case 'pendiente':
      case 'pending':
      default:
        return '#eab308';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'resuelto':
      case 'resolved':
        return 'Resuelto';
      case 'en_proceso':
      case 'in_progress':
        return 'En Proceso';
      case 'pendiente':
      case 'pending':
      default:
        return 'Pendiente';
    }
  };

  return (
    <View style={styles.reportItem}>
      {report?.image_url ? (
        <Image
          source={{ uri: report.image_url }}
          style={styles.reportImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.reportIcon}>
          <FontAwesome5 name="trash" size={20} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.reportInfo}>
        <Text style={styles.reportTitle}>
          {report?.classification?.waste_type || report?.manual_classification || 'Reporte de residuo'}
        </Text>
        <Text style={styles.reportLocation}>
          {report?.description || 'Sin descripción'}
        </Text>
      </View>
      <View style={[styles.statusTag, { backgroundColor: getStatusColor(report?.status) }]}>
        <Text style={styles.statusText}>{getStatusText(report?.status)}</Text>
      </View>
    </View>
  );
};

// Componente principal de la pantalla
export function HomeScreen({ navigation }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [points, setPoints] = useState(0);
  const [userReports, setUserReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });

  // Cargar puntos del usuario - se ejecuta cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      const loadPoints = async () => {
        try {
          if (!user?.id) {
            const cached = await AsyncStorage.getItem('user_points');
            if (cached != null) setPoints(Number(cached) || 0);
            return;
          }

          // Siempre intentar cargar desde la API cuando la pantalla obtiene el foco
          try {
            const resp = await reportService.getUserPoints(user.id);
            const pts = (resp && typeof resp === 'object' && 'points' in resp) ? resp.points : Number(resp) || 0;
            setPoints(pts);
            await AsyncStorage.setItem('user_points', String(pts));
            
            // Actualizar el timestamp de última comprobación
            const now = Date.now().toString();
            await AsyncStorage.setItem('last_report_at', now);
            await AsyncStorage.setItem('home_last_checked_report_at', now);
          } catch (err) {
            console.warn('Failed to fetch points:', err?.message || err);
            // Si falla, usar caché como fallback
            const cachedPoints = await AsyncStorage.getItem('user_points');
            if (cachedPoints != null) {
              setPoints(Number(cachedPoints) || 0);
            }
          }
        } catch (err) {
          console.warn('loadPoints error:', err?.message || err);
        }
      };

      loadPoints();
    }, [user?.id])
  );

  // Cargar reportes del usuario
  useEffect(() => {
    let mounted = true;

    const loadReports = async () => {
      try {
        if (!user?.id || !isAuthenticated) {
          setUserReports([]);
          setStats({ total: 0, resolved: 0, pending: 0 });
          return;
        }

        const response = await reportService.getUserReports(user.id, null, 1, 10);

        // La respuesta puede ser un array directamente o un objeto con una propiedad 'reports' o 'data'
        const reportsArray = Array.isArray(response)
          ? response
          : (response?.reports || response?.data || []);

        if (mounted && reportsArray) {
          setUserReports(reportsArray);

          // Calcular estadísticas
          const total = reportsArray.length;
          const resolved = reportsArray.filter(r =>
            r.status?.toLowerCase() === 'resuelto' || r.status?.toLowerCase() === 'resolved'
          ).length;
          const pending = reportsArray.filter(r =>
            r.status?.toLowerCase() === 'pendiente' || r.status?.toLowerCase() === 'pending'
          ).length;

          setStats({ total, resolved, pending });
        }
      } catch (err) {
        console.warn('Error loading reports:', err?.message || err);
      }
    };

    loadReports();
    return () => { mounted = false; };
  }, [user?.id, isAuthenticated]);

  const handleLogout = () => {
    if (!isAuthenticated) {
      // Si no hay usuario autenticado, simplemente redirigir al login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }

    // Si hay usuario autenticado, confirmar antes de cerrar sesión
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
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {isAuthenticated ? `¡Hola ${user?.username}!` : '¡Hola!'}
            </Text>
            {isAuthenticated && (
              <View style={styles.pointsBadge}>
                <FontAwesome5 name="star" size={14} color="#FFD700" />
                <Text style={styles.pointsText}>{points}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={handleLogout}>
              <FontAwesome5 name="sign-out-alt" size={24} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleProfile}>
              <FontAwesome5 name="user-circle" size={24} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainButtonsContainer}>
          <MainButton
            iconName="camera"
            text="REPORTAR"
            subtext="Toma una foto"
            onPress={() => navigation.navigate('Camera')}
          />
          <MainButton
            iconName="list-alt"
            text="HISTORIAL"
            subtext="Mis reportes"
            onPress={() => navigation.navigate('History')}
          />
        </View>

        {/* Tarjeta de Recompensas */}
        {isAuthenticated && (
          <TouchableOpacity 
            style={styles.rewardsCard}
            onPress={() => navigation.navigate('Rewards')}
          >
            <LinearGradient
              colors={["#f59e0b", "#d97706", "#b45309"]}
              style={styles.rewardsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.rewardsContent}>
                <View style={styles.rewardsIconContainer}>
                  <FontAwesome5 name="gift" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.rewardsTextContainer}>
                  <Text style={styles.rewardsTitle}>Tienda de Recompensas</Text>
                  <Text style={styles.rewardsSubtitle}>
                    Canjea tus {points} puntos por premios
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={20} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <ActivitySummary
          reports={stats.total}
          resolved={stats.resolved}
          pending={stats.pending}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acceso Rápido</Text>
          <View>
            <TouchableOpacity 
              style={styles.quickAccessItem}
              onPress={() => navigation.navigate('Rewards')}
            >
              <FontAwesome5 name="gift" size={20} color="#FFD700" style={styles.quickAccessIcon} />
              <Text style={styles.quickAccessText}>Tienda de Recompensas</Text>
              <MaterialIcons name="keyboard-arrow-right" size={24} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Feather name="bar-chart-2" size={20} color={THEME.colors.textPrimary} style={styles.quickAccessIcon} />
              <Text style={styles.quickAccessText}>Estadísticas de la ciudad</Text>
              <MaterialIcons name="keyboard-arrow-right" size={24} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Feather name="phone-call" size={20} color={THEME.colors.textPrimary} style={styles.quickAccessIcon} />
              <Text style={styles.quickAccessText}>Contactar empresa</Text>
              <MaterialIcons name="keyboard-arrow-right" size={24} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reportes recientes</Text>
          {isAuthenticated && userReports.length > 0 ? (
            userReports.slice(0, 2).map((report, index) => (
              <RecentReport key={report.id || index} report={report} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="inbox" size={40} color="#B0BEC5" />
              <Text style={styles.emptyStateText}>
                {isAuthenticated
                  ? 'No tienes reportes recientes'
                  : 'Inicia sesión para ver tus reportes'}
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    padding: 20,
    marginTop: -30,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginRight: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  pointsText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'space-between',
  },
  mainButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  mainButtonContainer: {
    width: "48%",
    borderRadius: 15,
    overflow: "hidden",
  },
  mainButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 15,
    marginBottom: 10,
  },
  mainButtonText: {
    color: THEME.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  rewardsCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  rewardsGradient: {
    borderRadius: 15,
    padding: 20,
  },
  rewardsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardsIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 12,
    marginRight: 15,
  },
  rewardsTextContainer: {
    flex: 1,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rewardsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  quickAccessIcon: {
    marginRight: 10,
  },
  quickAccessText: {
    fontSize: 16,
    flex: 1,
    color: THEME.colors.textPrimary,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  reportIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#607D8B',
    borderRadius: 10,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#607D8B',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  reportLocation: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  statusTag: {
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  statusText: {
    color: THEME.colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
});
