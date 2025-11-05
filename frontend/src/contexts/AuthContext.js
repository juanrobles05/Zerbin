import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/api/authService';

// Crear el contexto
const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  refreshUser: async () => {},
});

/**
 * Provider de autenticación que envuelve la aplicación
 * Maneja el estado global de autenticación y persistencia de sesión
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay sesión guardada al iniciar la app
  useEffect(() => {
    checkPersistedAuth();
  }, []);

  /**
   * Verifica si hay una sesión guardada en AsyncStorage
   * Se ejecuta al iniciar la aplicación
   */
  const checkPersistedAuth = async () => {
    try {
      setIsLoading(true);
      const savedToken = await authService.getToken();
      const savedUser = await authService.getUser();

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);

        // Opcional: verificar que el token siga siendo válido
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token expirado o inválido - limpiar sesión
          console.log('Token expired or invalid, clearing session');
          await handleLogout();
        }
      }
    } catch (error) {
      console.error('Error checking persisted auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Usuario autenticado
   */
  const handleLogin = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      setToken(response.access_token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Registra un nuevo usuario
   * @param {Object} userData - { username, email, password }
   * @returns {Promise<Object>} Usuario registrado
   */
  const handleRegister = async (userData) => {
    try {
      const user = await authService.register(userData);
      return user;
    } catch (error) {
      console.error('Register error in context:', error);
      throw error;
    }
  };

  /**
   * Cierra la sesión actual
   */
  const handleLogout = async () => {
    try {
      await authService.logout();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Limpiar estado local incluso si hay error
      setToken(null);
      setUser(null);
    }
  };

  /**
   * Actualiza los datos del usuario desde el servidor
   * Útil después de cambios en el perfil o puntos
   */
  const refreshUser = async () => {
    try {
      if (token) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        return currentUser;
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Si el token expiró, hacer logout
      if (error.response?.status === 401) {
        await handleLogout();
      }
      throw error;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para acceder al contexto de autenticación
 * @returns {Object} Contexto de autenticación
 * 
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
