import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { THEME } from '../../styles/theme';
import { reportService, classify, priorityService } from '../../services/api/reportService';
import { PointsOverlay } from "../../components/PointsOverlay";
import WasteTypeSelector from '../../components/common/WasteTypeSelector';
import { useLocation } from '../../hooks/useLocation';
import { useAuth } from '../../contexts/AuthContext';

export function ReportScreen({ navigation, route }) {
  const { user, token } = useAuth();
  const imageUri = route?.params?.image;
  const initialLocation = route?.params?.location;

  const [classification, setClassification] = useState(null);
  const [priorityInfo, setPriorityInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');
  const [showPointsOverlay, setShowPointsOverlay] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [manualClassification, setManualClassification] = useState(false);
  const [manualSelectedType, setManualSelectedType] = useState(null);

  const { manualLocation, setManualSelectedLocation, getActiveLocation } = useLocation();

  useEffect(() => {
    if (imageUri) classifyImage(imageUri);
  }, [imageUri]);

  useEffect(() => {
    if (initialLocation && !manualLocation) {
      setManualSelectedLocation(initialLocation);
    }
  }, [initialLocation, manualLocation]);

  useEffect(() => {
    const activeLocation = getActiveLocation();
    if (activeLocation) getAddressFromLocation(activeLocation);
  }, [manualLocation, initialLocation]);

  const classifyImage = async (uri) => {
    setLoading(true);
    try {
      const data = await classify.image(uri);
      setClassification(data);
    } catch (error) {
      console.error('Error clasificando:', error);
      alert('Error al clasificar la imagen');
    } finally {
      setLoading(false);
    }
  };

// Fetch priority info for a given waste type and update state
  const fetchPriorityInfo = async (wasteType) => {
    if (!wasteType) return;
    try {
      const info = await priorityService.getPriorityInfo(wasteType);
      setPriorityInfo(info);
    } catch (err) {
      console.warn('Could not fetch priority info for', wasteType, err);
      setPriorityInfo(null);
    }
  };

  // Whenever classification or manual selection changes, refresh priority info
  useEffect(() => {
    const selectedType = manualSelectedType || classification?.type;
    if (selectedType) fetchPriorityInfo(selectedType);
  }, [classification, manualSelectedType]);

  const getAddressFromLocation = async (location) => {
    if (!location?.coords) return;
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (result.length > 0) {
        const info = result[0];
        const parts = [info.street, info.streetNumber, info.district, info.city, info.region].filter(Boolean);
        setLocationAddress(parts.join(', ') || 'Dirección no disponible');
      } else {
        setLocationAddress('Dirección no disponible');
      }
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
      setLocationAddress('Error al obtener la dirección');
    }
  };

  const handleSelectLocation = () => {
    const currentLocation = getActiveLocation();
    const defaultLocation = currentLocation?.coords || initialLocation?.coords || {
      latitude: 4.7110, longitude: -74.0721
    };

    navigation.navigate('LocationSelector', {
      initialLocation: defaultLocation,
      title: "Ubicación del Residuo",
      onLocationSelected: (selectedLocation) => {
        setManualSelectedLocation(selectedLocation);
        getAddressFromLocation(selectedLocation);
      }
    });
  };

  const handleReportSubmit = async () => {
    const currentUser = user;
    const activeLocation = getActiveLocation();

    if (!activeLocation?.coords) {
      Alert.alert(
        'Ubicación Requerida',
        'Por favor selecciona la ubicación del residuo antes de enviar el reporte.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Seleccionar Ubicación', onPress: handleSelectLocation }
        ]
      );
      return;
    }

    setReportLoading(true);
    // Después de enviar el reporte exitosamente:
    try {
      const reportResponse = await reportService.createReport(
        imageUri,
        activeLocation,
        description,
        classification,
        manualSelectedType,
        currentUser,
        token
      );

      // 🔹 Obtener puntos ganados de la respuesta del reporte
      const pointsThisReport = reportResponse?.points_earned || 0;
      
      // 🔹 Obtener puntos totales actualizados del usuario
      const pointsData = await reportService.getUserPoints(currentUser.id);
      const totalUserPoints = pointsData?.points || 0;

      // Mostrar overlay con puntos
      setEarnedPoints(pointsThisReport);
      setTotalPoints(totalUserPoints);
      setShowPointsOverlay(true);
    } catch (e) {
      // Si no hay sistema de puntos → fallback al Alert existente
      Alert.alert('Reporte enviado', 'Reporte enviado correctamente.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } finally {
      setManualSelectedType(null);
      setManualClassification(false);
    }

  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Completa los detalles del residuo</Text>
        </View>

        {/* Sección de Imagen */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="camera" size={20} color={THEME.colors.primary} />
            <Text style={styles.sectionTitle}>Imagen del Residuo</Text>
          </View>

          <View style={styles.imageContainer}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.successBadge}>
                  <FontAwesome5 name="check-circle" size={16} color="#10B981"/>
                  <Text style={styles.successText}>Imagen capturada exitosamente</Text>
                </View>
              </>
            ) : (
              <View style={styles.placeholderImage}>
                <FontAwesome5 name="image" size={48} color="#9CA3AF"/>
                <Text style={styles.placeholderText}>No se ha capturado ninguna imagen</Text>
              </View>
            )}
          </View>
        </View>

        {/* Sección de Ubicación */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="map-marker-alt" size={20} color={THEME.colors.primary} />
            <Text style={styles.sectionTitle}>Ubicación del Residuo</Text>
          </View>

          {getActiveLocation()?.coords ? (
            <View style={styles.locationContainer}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>
                  {manualLocation ? 'Ubicación seleccionada manualmente' : 'Ubicación detectada por GPS'}
                </Text>
                <Text style={styles.locationText}>
                  {locationAddress || 'Obteniendo dirección...'}
                </Text>
              </View>
              <TouchableOpacity style={styles.changeButton} onPress={handleSelectLocation}>
                <FontAwesome5 name="edit" size={14} color={THEME.colors.primary} />
                <Text style={styles.changeButtonText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <FontAwesome5 name="exclamation-triangle" size={32} color={THEME.colors.warning} />
              <Text style={styles.noLocationText}>No se detectó ubicación automáticamente</Text>
              <TouchableOpacity style={styles.actionButton} onPress={handleSelectLocation}>
                <LinearGradient
                  colors={[THEME.colors.primary, "#059669", "#047857"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  <FontAwesome5 name="map" size={16} color={THEME.colors.white} />
                  <Text style={styles.actionButtonText}>Seleccionar en Mapa</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sección de Clasificación */}
        {loading && (
          <View style={styles.section}>
            <Text style={styles.loadingText}>Cargando clasificación...</Text>
          </View>
        )}

        {classification && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="microscope" size={20} color={THEME.colors.primary} />
              <Text style={styles.sectionTitle}>Clasificación Automática</Text>
            </View>

            <View style={styles.classificationContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo detectado (IA):</Text>
                <Text style={styles.infoValue}>{classification.type}</Text>
              </View>
              {manualSelectedType && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tipo corregido:</Text>
                  <Text style={styles.infoValue}>{manualSelectedType}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Confianza de IA:</Text>
                <Text style={styles.infoValue}>{classification.confidence}%</Text>
              </View>

              <TouchableOpacity style={styles.correctButton} onPress={() => setSelectorVisible(true)}>
                <FontAwesome5 name="edit" size={14} color={THEME.colors.primary} />
                <Text style={styles.correctButtonText}>Corregir clasificación</Text>
              </TouchableOpacity>

              {priorityInfo && (
                <View style={styles.prioritySectionInline}>
                  <View style={[styles.priorityBadge, priorityInfo.priority === 3 ? styles.priorityHigh : priorityInfo.priority === 2 ? styles.priorityMedium : styles.priorityLow]}>
                    <FontAwesome5 name={priorityInfo.priority === 3 ? 'exclamation-triangle' : priorityInfo.priority === 2 ? 'clock' : 'check-circle'} size={12} color="#fff" />
                    <Text style={styles.priorityBadgeText}>{priorityInfo.priority === 3 ? 'Alta' : priorityInfo.priority === 2 ? 'Media' : 'Baja'}</Text>
                  </View>
                  <Text style={styles.decompText}>{priorityInfo.decomposition_days} días</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <WasteTypeSelector
          visible={selectorVisible}
          suggested={classification?.type}
          onClose={() => setSelectorVisible(false)}
          onSelect={(type) => {
            // keep original AI detection in `classification.type`, but store manual selection separately
            setManualSelectedType(type);
            setManualClassification(true);
          }}
        />

        {/* Sección de Descripción */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="align-left" size={20} color={THEME.colors.primary} />
            <Text style={styles.sectionTitle}>Descripción (opcional)</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Agrega una descripción..."
            placeholderTextColor="THEME.colors.textSecondary"
            value={description}
            onChangeText={setDescription}
            numberOfLines={6}
          />
        </View>
      </ScrollView>

      {/* Botón de Envío */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          onPress={handleReportSubmit}
          style={styles.submitButtonContainer}
          disabled={reportLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={reportLoading ? ["#9CA3AF", "#9CA3AF", "#9CA3AF"] : ["#10B981", "#059669", "#047857"]}
            style={styles.submitButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5
              name={reportLoading ? "spinner" : "paper-plane"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.submitButtonText}>
              {reportLoading ? 'ENVIANDO...' : 'ENVIAR REPORTE'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Overlay de puntos */}
      <PointsOverlay
        visible={showPointsOverlay}
        points={earnedPoints}
        totalPoints={totalPoints}
        onClose={() => {
          setShowPointsOverlay(false);
          navigation.navigate("Home");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Contenedor Principal
  container: {
    flex: 1,
    backgroundColor: "#374151",
  },
  scrollView: {
    flex: 1,
  },

// Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBackground,
  },
  headerSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },

// Secciones
  section: {
    backgroundColor: THEME.colors.cardBackground,
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 12,
    padding: 15,
    opacity: 0.8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginLeft: 10,
  },

  // Imagen
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: THEME.colors.background,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  placeholderText: {
    color: THEME.colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  successBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  successText: {
    color: THEME.colors.primary,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  // Ubicación
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderRadius: 12,
    padding: 16,
  },
  locationInfo: {
    flex: 1,
    marginRight: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  changeButtonText: {
    color: THEME.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noLocationText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: THEME.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Clasificación
  loadingText: {
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  classificationContainer: {
    backgroundColor: THEME.colors.background,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBackground,
  },
  infoLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
  },
  correctButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  correctButtonText: {
    color: THEME.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  manualBadge: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Priority badge
  prioritySectionInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityBadgeText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 12,
  },
  priorityHigh: {
    backgroundColor: '#DC2626',
  },
  priorityMedium: {
    backgroundColor: '#F59E0B',
  },
  priorityLow: {
    backgroundColor: '#10B981',
  },
  decompText: {
    marginLeft: 12,
    color: THEME.colors.textSecondary,
    fontSize: 12,
  },

  // Descripción
  textInput: {
    backgroundColor: THEME.colors.background,
    borderRadius: 12,
    padding: 16,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Botón de Envío
  submitContainer: {
    padding: 20,
    backgroundColor: THEME.colors.background,
  },
  submitButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    color: THEME.colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});