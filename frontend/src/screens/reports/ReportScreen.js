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
import { PriorityIndicator, DecompositionTime } from '../../components/common/PriorityIndicator';

export function ReportScreen({ navigation, route }) {
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

      if (data.type) {
        const priority = await priorityService.getPriorityInfo(data.type);
        setPriorityInfo(priority);
      }
    } catch (error) {
      console.error('Error clasificando:', error);
      alert('Error al clasificar la imagen');
    } finally {
      setLoading(false);
    }
  };

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
    try {
      await reportService.createReport(imageUri, activeLocation, description, classification);

      const response = await fetch("http://192.168.0.102:8000/api/v1/users/1/points");
      const data = await response.json();
      const lastReport = data.history[data.history.length - 1];
      const pointsThisReport = lastReport ? lastReport.points : 0;

      setEarnedPoints(pointsThisReport);
      setTotalPoints(data.points || 0);
      setShowPointsOverlay(true);
    } catch (error) {
      console.error('Error al enviar el reporte:', error);
      alert('Error al enviar el reporte');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Completa los detalles del residuo</Text>
        </View>

        {/* Imagen */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesome5 name="image" size={60} color="#A3A3A3" />
              <Text style={{ color: '#A3A3A3', marginTop: 8 }}>Sin imagen</Text>
            </View>
          )}
          {imageUri && (
            <View style={styles.successBadge}>
              <FontAwesome5 name="check-circle" size={16} color="#10B981" />
              <Text style={styles.successText}>Imagen capturada exitosamente</Text>
            </View>
          )}
        </View>

        {/* Ubicación */}
        <View style={styles.locationSection}>
          <View style={styles.sectionHeaderCentered}>
            <FontAwesome5 name="map-marker-alt" size={20} color={THEME.colors.primary} />
            <Text style={styles.sectionTitleCentered}>Ubicación del Residuo</Text>
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
              <TouchableOpacity style={styles.changeLocationButton} onPress={handleSelectLocation}>
                <FontAwesome5 name="edit" size={16} color={THEME.colors.primary} />
                <Text style={styles.changeLocationText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <FontAwesome5 name="exclamation-triangle" size={24} color={THEME.colors.warning} />
              <Text style={styles.noLocationText}>No se detectó ubicación automáticamente</Text>
              <TouchableOpacity style={styles.selectLocationButton} onPress={handleSelectLocation}>
                <LinearGradient
                  colors={[THEME.colors.primary, "#059669", "#047857"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.selectLocationGradient}
                >
                  <FontAwesome5 name="map" size={16} color={THEME.colors.white} />
                  <Text style={styles.selectLocationButtonText}>Seleccionar en Mapa</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Clasificación */}
        {loading && <Text style={styles.textLoader}>Cargando clasificación...</Text>}
        {classification && (
          <View style={styles.detailsContainer}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="microscope" size={20} color={THEME.colors.primary} />
              <Text style={styles.sectionTitle}>Clasificación Automática</Text>
            </View>
            
            <View style={styles.classificationContainer}>
              <View style={styles.classificationRow}>
                <Text style={styles.classificationLabel}>Tipo de residuo:</Text>
                <Text style={styles.classificationValue}>{classification.type}</Text>
              </View>
              <View style={styles.classificationRow}>
                <Text style={styles.classificationLabel}>Confianza de IA:</Text>
                <Text style={styles.classificationValue}>{classification.confidence}%</Text>
              </View>

              <TouchableOpacity style={styles.fixButton} onPress={() => setSelectorVisible(true)}>
                <Text style={styles.fixText}>Corregir clasificación</Text>
              </TouchableOpacity>

              {priorityInfo && (
                <View style={styles.prioritySection}>
                  <Text style={styles.priorityTitle}>Nivel de Prioridad</Text>
                  <PriorityIndicator priority={priorityInfo.priority} size="large" isUrgent={priorityInfo.is_urgent} />
                  <DecompositionTime days={priorityInfo.decomposition_days} />
                  {priorityInfo.is_urgent && (
                    <View style={styles.urgentAlert}>
                      <FontAwesome5 name="bell" size={16} color="#EF4444" />
                      <Text style={styles.urgentAlertText}>
                        ¡Residuo de descomposición rápida! Requiere atención prioritaria.
                      </Text>
                    </View>
                  )}
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
            setClassification((prev) => ({
              ...prev,
              type,
              corrected_by_user: true,
            }));
          }}
        />

        {/* Descripción */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Descripción (opcional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Agrega una descripción..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
      </ScrollView>

      {/* Botón enviar */}
      <View style={styles.submitContainer}>
        <TouchableOpacity 
          onPress={handleReportSubmit}
          style={[styles.submitButtonContainer, reportLoading && styles.disabledButton]}
          disabled={reportLoading}
        >
          <LinearGradient
            colors={reportLoading ? ["#9CA3AF", "#9CA3AF", "#9CA3AF"] : ["#10B981", "#059669", "#047857"]}
            style={styles.submitButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name={reportLoading ? "spinner" : "paper-plane"} size={20} color="#FFFFFF" />
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
  container: { flex: 1, backgroundColor: "#374151" },
  scrollView: { flex: 1 },
  header: { padding: 20, backgroundColor: "#374151" },
  headerSubtitle: { fontSize: 14, color: "#9CA3AF", marginTop: 2 },
  imageContainer: { margin: 20, borderRadius: 12, overflow: "hidden", backgroundColor: "#4B5563" },
  previewImage: { width: "100%", height: 200 },
  successBadge: { flexDirection: "row", justifyContent: "center", paddingVertical: 12, backgroundColor: "rgba(16,185,129,0.1)" },
  successText: { color: "#10B981", fontSize: 14, marginLeft: 8 },
  textLoader: { color: "#9CA3AF", textAlign: "center", marginVertical: 10 },
  detailsContainer: { backgroundColor: "#4B5563", margin: 20, borderRadius: 12, padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF", marginLeft: 8 },
  classificationContainer: { marginTop: 8 },
  classificationRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#374151' },
  classificationLabel: { fontSize: 14, color: '#9CA3AF' },
  classificationValue: { fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },
  prioritySection: { marginTop: 16, padding: 16, backgroundColor: '#374151', borderRadius: 8 },
  priorityTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  priorityIndicator: { alignItems: 'center', marginBottom: 12 },
  urgentAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, marginTop: 8 },
  urgentAlertText: { fontSize: 13, color: '#EF4444', marginLeft: 8, flex: 1 },
  textInput: { backgroundColor: "#374151", borderRadius: 8, padding: 16, color: "#FFFFFF", fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  submitContainer: { padding: 20, backgroundColor: "#374151" },
  submitButtonContainer: { borderRadius: 12, overflow: "hidden", elevation: 8 },
  submitButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", marginLeft: 12 },
  disabledButton: { opacity: 0.6 },
  locationSection: { backgroundColor: "#4B5563", margin: 20, borderRadius: 12, padding: 20 },
  sectionHeaderCentered: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  sectionTitleCentered: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF", marginLeft: 8 },
  locationContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#374151", borderRadius: 8, padding: 16 },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 4 },
  locationText: { fontSize: 14, color: "#FFFFFF" },
  changeLocationButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 6 },
  changeLocationText: { color: THEME.colors.primary, fontSize: 14, fontWeight: "500", marginLeft: 4 },
  noLocationContainer: { alignItems: "center", paddingVertical: 24 },
  noLocationText: { fontSize: 16, color: "#9CA3AF", textAlign: "center", marginVertical: 12 },
  selectLocationButton: { borderRadius: 8, overflow: "hidden", marginTop: 8 },
  selectLocationGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 24 },
  selectLocationButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
});