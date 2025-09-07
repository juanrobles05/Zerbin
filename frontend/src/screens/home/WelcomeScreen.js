import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../../styles/theme';
import { FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';

const ICON_SIZE = 30;
const ICON_COLOR = THEME.colors.primary;

const FeatureItem = ({ icon, text, subtext }) => (
  <View style={styles.featureItem}>
    <View style={styles.iconContainer}>
      {icon}
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.featureText}>{text}</Text>
      <Text style={styles.featureSubtext}>{subtext}</Text>
    </View>
  </View>
);

export function WelcomeScreen({ navigation }) {
  const handleStartPress = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome5 name="leaf" size={60} color={THEME.colors.white} />
          </View>
          <Text style={styles.title}>ZERBIN</Text>
          <Text style={styles.subtitle}>Tu ciudad más limpia</Text>
        </View>

        <View style={styles.featuresList}>
          <FeatureItem
            icon={<FontAwesome5 name="camera" size={ICON_SIZE} color={ICON_COLOR} />}
            text="Reporta residuos"
            subtext="Toma fotos y reporta facilmente"
          />
          <FeatureItem
            icon={<MaterialIcons name="notifications-active" size={ICON_SIZE} color={ICON_COLOR} />}
            text="Notificación Automática"
            subtext="Empresas recolectoras alertadas"
          />
          <FeatureItem
            icon={<Feather name="globe" size={ICON_SIZE} color={ICON_COLOR} />}
            text="Impacto Real"
            subtext="Contribuye al medio ambiente"
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleStartPress}>
            <Text style={styles.buttonText}>comenzar →</Text>
          </TouchableOpacity>
          <Text style={styles.joinText}>
            Únete a miles de usuarios que ya están haciendo la diferencia
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 18,
    color: THEME.colors.textSecondary,
  },
  featuresList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  textContainer: {
    flex: 1,
  },
  featureText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  featureSubtext: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignSelf: 'stretch',
    marginBottom: 15,
  },
  buttonText: {
    color: THEME.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  joinText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
});
