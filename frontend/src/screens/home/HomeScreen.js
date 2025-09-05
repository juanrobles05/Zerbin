import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../styles/theme';
import { Button } from '../../components/common/Button';

export const HomeScreen = ({ navigation }) => {
  const navigateToCamera = () => {
    navigation.navigate('Camera');
  };

  const navigateToReports = () => {
    navigation.navigate('Reports');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>¡Bienvenido a Zerbin!</Text>
          <Text style={styles.subtitleText}>
            Ayuda a mantener limpia nuestra ciudad
          </Text>
        </View>

        {/* Main Action Card */}
        <View style={styles.mainCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera" size={64} color={THEME.colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Reportar Residuo</Text>
          <Text style={styles.cardDescription}>
            Toma una foto del residuo mal dispuesto y ayúdanos a identificarlo 
            para una recolección rápida y eficiente.
          </Text>
          <Button
            title="Abrir Cámara"
            onPress={navigateToCamera}
            style={styles.mainButton}
          />
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="leaf-outline" size={32} color={THEME.colors.success} />
            <Text style={styles.statNumber}>1,247</Text>
            <Text style={styles.statLabel}>Reportes este mes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={32} color={THEME.colors.primary} />
            <Text style={styles.statNumber}>856</Text>
            <Text style={styles.statLabel}>Ciudadanos activos</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToReports}>
            <Ionicons name="list-outline" size={24} color={THEME.colors.primary} />
            <Text style={styles.actionText}>Mis Reportes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="map-outline" size={24} color={THEME.colors.primary} />
            <Text style={styles.actionText}>Ver Mapa</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="information-circle-outline" size={24} color={THEME.colors.primary} />
            <Text style={styles.actionText}>Acerca de</Text>
          </TouchableOpacity>
        </View>

        {/* Impact Section */}
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>Tu Impacto</Text>
          <Text style={styles.impactDescription}>
            Cada reporte cuenta. Juntos hemos evitado que{' '}
            <Text style={styles.highlightText}>29,000 toneladas</Text> de residuos 
            lleguen al relleno sanitario La Pradera este año.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  welcomeText: {
    fontSize: THEME.fontSize.xlarge,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  subtitleText: {
    fontSize: THEME.fontSize.medium,
    color: THEME.colors.gray.dark,
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: THEME.spacing.md,
  },
  cardTitle: {
    fontSize: THEME.fontSize.large,
    fontWeight: '600',
    color: THEME.colors.black,
    marginBottom: THEME.spacing.sm,
  },
  cardDescription: {
    fontSize: THEME.fontSize.medium,
    color: THEME.colors.gray.dark,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.spacing.lg,
  },
  mainButton: {
    minWidth: 200,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: 'center',
    marginHorizontal: THEME.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: THEME.fontSize.large,
    fontWeight: 'bold',
    color: THEME.colors.black,
    marginTop: THEME.spacing.sm,
  },
  statLabel: {
    fontSize: THEME.fontSize.small,
    color: THEME.colors.gray.dark,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: 'center',
    marginHorizontal: THEME.spacing.xs,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: THEME.fontSize.small,
    color: THEME.colors.gray.dark,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  impactCard: {
    backgroundColor: THEME.colors.primaryLight,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    alignItems: 'center',
  },
  impactTitle: {
    fontSize: THEME.fontSize.large,
    fontWeight: '600',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.sm,
  },
  impactDescription: {
    fontSize: THEME.fontSize.medium,
    color: THEME.colors.gray.dark,
    textAlign: 'center',
    lineHeight: 22,
  },
  highlightText: {
    fontWeight: 'bold',
    color: THEME.colors.primary,
  },
});