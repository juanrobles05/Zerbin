import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../styles/colors';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Validaciones
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    // Validar password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Usar el contexto de autenticación
      const response = await login(formData.email, formData.password);

      // Login exitoso - navegar al dashboard/home
      Alert.alert(
        '¡Bienvenido!',
        `Hola ${response.user.username}, has iniciado sesión exitosamente.`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              // Navegar al Home o Dashboard
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      // Manejar errores
      let errorMessage = 'Ocurrió un error al iniciar sesión. Intenta de nuevo.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Email o contraseña incorrectos. Verifica tus credenciales.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      Alert.alert('Error al iniciar sesión', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>
            Accede a tu cuenta para ver tus reportes y recompensas
          </Text>
        </View>

        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="tu@email.com"
              placeholderTextColor="#90A4AE"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Tu contraseña"
              placeholderTextColor="#90A4AE"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Link to Register */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Regístrate</Text>
            </TouchableOpacity>
          </View>

          {/* Continue without account */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }}
          >
            <Text style={styles.guestButtonText}>Continuar sin cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3A4750', // Fondo oscuro de la app
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF', // Título en blanco para contraste
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5', // Texto secundario gris claro
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF', // Labels en blanco
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#607D8B', // Border gris azulado
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#4E5B66', // Fondo de input tipo "surface"
    color: '#FFFFFF', // Texto del input en blanco
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: '#FF6347', // Error en rojo
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#2E8B57', // Verde primario de la app
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#607D8B', // Gris cuando está deshabilitado
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#B0BEC5', // Gris claro
  },
  linkText: {
    fontSize: 14,
    color: '#3CB371', // Verde claro para enlaces
    fontWeight: 'bold',
  },
  guestButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#607D8B',
    borderRadius: 8,
  },
  guestButtonText: {
    fontSize: 14,
    color: '#B0BEC5', // Gris claro
  },
});
