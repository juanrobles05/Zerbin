import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../styles/colors';

/**
 * Componente de orden superior (HOC) que protege rutas requiriendo autenticación
 * Si el usuario no está autenticado, redirige a Login
 * 
 * @param {React.Component} Component - Componente a proteger
 * @returns {React.Component} Componente envuelto con protección de auth
 * 
 * @example
 * // En la navegación:
 * import { withAuth } from './components/withAuth';
 * 
 * <Stack.Screen 
 *   name="Profile" 
 *   component={withAuth(ProfileScreen)} 
 * />
 */
export const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    const { navigation } = props;

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        // Redirigir a Login si no está autenticado
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }, [isAuthenticated, isLoading, navigation]);

    // Mostrar loading mientras se verifica la autenticación
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    // Si está autenticado, mostrar el componente
    if (isAuthenticated) {
      return <Component {...props} />;
    }

    // Si no está autenticado, mostrar loading (mientras redirige)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  };
};

/**
 * Componente que protege rutas específicas
 * Similar a withAuth pero como componente
 */
export const ProtectedRoute = ({ children, navigation }) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [isAuthenticated, isLoading, navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return isAuthenticated ? children : null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
