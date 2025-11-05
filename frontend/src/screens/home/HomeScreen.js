import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../styles/theme';
import { FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

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
        <Text style={[styles.summaryNumber, { color: THEME.colors.primary }]}>{reports}</Text>
        <Text style={styles.summaryLabel}>Reportes</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryNumber, { color: THEME.colors.success }]}>{resolved}</Text>
        <Text style={styles.summaryLabel}>Resueltos</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryNumber, { color: THEME.colors.danger }]}>{pending}</Text>
        <Text style={styles.summaryLabel}>Pendientes</Text>
      </View>
    </View>
  </View>
);

// Componente para un reporte reciente
const RecentReport = ({ status }) => (
  <View style={styles.reportItem}>
    <View style={styles.reportIcon} />
    <View style={styles.reportInfo}>
      <Text style={styles.reportTitle}>Basura urbana</Text>
      <Text style={styles.reportLocation}>Cra 80 #45-3</Text>
    </View>
    <View style={[styles.statusTag, { backgroundColor: THEME.colors[status.toLowerCase()] }]}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  </View>
);

// Componente principal de la pantalla
export function HomeScreen({ navigation }) {
  const { user, isAuthenticated, logout } = useAuth();

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
                <Text style={styles.pointsText}>{user?.points || 0}</Text>
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

        <ActivitySummary reports={12} resolved={8} pending={4} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acceso Rápido</Text>
          <View>
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
          <RecentReport status="Pendiente" />
          <RecentReport status="Pendiente" />
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
    backgroundColor: THEME.colors.textSecondary,
    borderRadius: 10,
    marginRight: 15,
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
});
