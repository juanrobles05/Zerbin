import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/contexts/AuthContext';

// Importar pantallas
import { WelcomeScreen } from './src/screens/home/WelcomeScreen';
import { CameraScreen } from './src/screens/camera/CameraScreen';
import { HomeScreen } from './src/screens/home/HomeScreen';
import { ProfileScreen } from './src/screens/home/ProfileScreen';
import { HistoryScreen } from './src/screens/history/HistoryScreen';
import { ReportScreen } from './src/screens/reports/ReportScreen';
import { LocationSelectorScreen } from './src/screens/location/LocationSelectorScreen';
import { RewardsScreen } from './src/screens/reward/RewardsScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import { AdminScreen } from './src/screens/admin/AdminScreen';

// Importar tema
import { THEME } from './src/styles/theme';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={THEME.colors.primary} />
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
              headerStyle: {
                backgroundColor: THEME.colors.primary,
              },
              headerTintColor: THEME.colors.white,
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              headerBackTitleVisible: false,
            }}
          >
            {/* Auth Screens */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: 'Registro',
              }}
            />

            {/* Main App Screens */}
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{
                headerShown: false, // <-- Oculta el encabezado en la pantalla de bienvenida
              }}
            />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Zerbin',
              headerStyle: {
                backgroundColor: THEME.colors.primary,
                elevation: 0,
                shadowOpacity: 0,
              },
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{
              title: 'Reportar Residuo',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Report"
            component={ReportScreen}
            options={{
              title: 'Nuevo Reporte',
            }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{
              title: 'Mis Reportes',
            }}
          />
          <Stack.Screen
            name="Rewards"
            component={RewardsScreen}
            options={{
              title: 'Recompensas',
            }}
          />
          <Stack.Screen
            name="LocationSelector"
            component={LocationSelectorScreen}
            options={{
              title: 'Seleccionar Ubicación',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Este componente debe estar fuera del NavigationContainer */}
      <Toast />
    </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
