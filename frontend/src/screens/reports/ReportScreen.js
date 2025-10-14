import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { THEME } from '../../styles/theme';
import { reportService, classify } from '../../services/api/reportService';
import WasteTypeSelector from '../../components/common/WasteTypeSelector';
import { useLocation } from '../../hooks/useLocation';

const getAddressFromCoords = async (lat, lon) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": "my-app" }, // Nominatim lo exige
    });
    const data = await response.json();

    function clean(str) {
      return str ? String(str).trim() : "";
    }

    const city = clean(data.address?.city).replace("Perímetro Urbano", "");
    const neighborhood = clean(data.address?.neighbourhood);
    const road = clean(data.address?.road);
    const houseNumber = data.address?.house_number ? `#${clean(data.address.house_number)}` : "";

    const direccion = [road, houseNumber, neighborhood, city]
      .filter(Boolean)
      .join(", ")
      || "Dirección no encontrada";

    return direccion;
  } catch (error) {
    console.error("Error obteniendo dirección:", error);
    return null;
  }
};

export function ReportScreen({ navigation, route }) {
  const imageUri = route?.params?.image;
  const initialLocation = route?.params?.location;
  const [classification, setClassification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');

  const { 
    manualLocation, 
    setManualSelectedLocation, 
    getActiveLocation 
  } = useLocation();

  useEffect(() => {
    if (imageUri) {
      classifyImage(imageUri);
    }
  }, [imageUri]);

  useEffect(() => {
    // If there's an initial location from camera but no manual location selected, use it
    if (initialLocation && !manualLocation) {
      // Set the initial location as manual to ensure it's available for the report
      setManualSelectedLocation(initialLocation);
    }
  }, [initialLocation, manualLocation]);

  useEffect(() => {
    // Update address when location changes
    const activeLocation = getActiveLocation();
    if (activeLocation) {
      getAddressFromLocation(activeLocation);
    }
  }, [manualLocation, initialLocation]);

  const classifyImage = async (uri) => {
    setLoading(true);
    try {
      const data = await classify.image(uri);
      setClassification(data);
    } catch (error) {
      console.error('Error clasificando:', error);
      alert('Error al clasificar la imagen');
    }
    setLoading(false);
  };

  const getAddressFromLocation = async (location) => {
    if (!location?.coords) return;
    
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (result.length > 0) {
        const locationData = result[0];
        const addressParts = [
          locationData.street,
          locationData.streetNumber,
          locationData.district,
          locationData.city,
          locationData.region
        ].filter(Boolean);
        
        setLocationAddress(addressParts.join(', ') || 'Dirección no disponible');
      } else {
        setLocationAddress('Dirección no disponible');
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setLocationAddress('Error al obtener la dirección');
    }
  };

  const handleSelectLocation = () => {
    const currentLocation = getActiveLocation();
    const defaultLocation = currentLocation?.coords || initialLocation?.coords || {
      latitude: 4.7110, // Bogotá default
      longitude: -74.0721
    };

    navigation.navigate('LocationSelector', {
      initialLocation: defaultLocation,
      title: "Ubicación del Residuo",
      onLocationSelected: (selectedLocation) => {
        setManualSelectedLocation(selectedLocation);
        // Update address immediately when location is selected
        getAddressFromLocation(selectedLocation);
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>Completa los detalles del residuo</Text>
          </View>
        </View>

        {/* Image Preview */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
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
              <TouchableOpacity
                style={styles.changeLocationButton}
                onPress={handleSelectLocation}
              >
                <FontAwesome5 name="edit" size={16} color={THEME.colors.primary} />
                <Text style={styles.changeLocationText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <FontAwesome5 name="exclamation-triangle" size={24} color={THEME.colors.warning} />
              <Text style={styles.noLocationText}>
                No se detectó ubicación automáticamente
              </Text>
              <TouchableOpacity
                style={styles.selectLocationButton}
                onPress={handleSelectLocation}
              >
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
        {loading && <Text style={styles.text}>Cargando clasificación...</Text>}
        {classification && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Clasificación</Text>
            <Text>Tipo de residuo: {classification.type}</Text>
            <Text>Confianza: {classification.confidence}%</Text>
            <TouchableOpacity style={styles.fixButton} onPress={() => setSelectorVisible(true)}>
              <Text style={styles.fixText}>Corregir clasificación</Text>
            </TouchableOpacity>
          </View>
        )}

      <WasteTypeSelector
        visible={selectorVisible}
        suggested={classification?.type}
        onClose={() => setSelectorVisible(false)}
        onSelect={(type) => {
          // Update classification in-memory so the corrected value is submitted
          setClassification((prev) => ({
            ...prev,
            type,
            corrected_by_user: true,
          }));
        }}
      />

      {/* (location display handled above in the locationSection) */}

        {/* Descripción */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Descripción (opcional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Agrega una descripción del residuo..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          onPress={async () => {
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
              alert('Reporte enviado exitosamente');
              navigation.navigate('Home');
            } catch (error) {
              console.error('Error al enviar el reporte:', error);
              alert('Error al enviar el reporte');
            } finally {
              setReportLoading(false);
            }
          }}
          style={[styles.submitButtonContainer, reportLoading && styles.disabledButton]}
          disabled={reportLoading}
        >
          <LinearGradient
            colors={reportLoading ? ["#9CA3AF", "#9CA3AF", "#9CA3AF"] : ["#10B981", "#059669", "#047857"]}
            style={styles.submitButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {reportLoading ? (
              <FontAwesome5 name="spinner" size={20} color="#FFFFFF" />
            ) : (
              <FontAwesome5 name="paper-plane" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.submitButtonText}>
              {reportLoading ? 'ENVIANDO...' : 'ENVIAR REPORTE'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#374151",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#374151",
  },
  backButton: {
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 2,
  },
  imageContainer: {
    margin: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#4B5563",
  },
  previewImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  successText: {
    color: "#10B981",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  detailsContainer: {
    backgroundColor: "#4B5563",
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#10B981",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 16,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeButtonText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 80,
  },
  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  priorityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    opacity: 0.7,
  },
  prioritySelected: {
    opacity: 1,
  },
  priorityHigh: {
    backgroundColor: "#EF4444",
  },
  priorityMedium: {
    backgroundColor: "#F59E0B",
  },
  priorityLow: {
    backgroundColor: "#10B981",
  },
  priorityText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  submitContainer: {
    padding: 20,
    backgroundColor: "#374151",
  },
  submitButtonContainer: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  // New location styles
  locationSection: {
    backgroundColor: "#4B5563",
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sectionTitleCentered: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 8,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  changeLocationText: {
    color: THEME.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noLocationText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 12,
  },
  selectLocationButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  selectLocationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  selectLocationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
})