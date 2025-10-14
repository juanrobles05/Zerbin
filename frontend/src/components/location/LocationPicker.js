import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { THEME } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

export const LocationPicker = ({ 
  initialLocation, 
  onLocationSelected, 
  onCancel,
  title = "Seleccionar Ubicación" 
}) => {
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation ? {
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
    } : null
  );
  const [address, setAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 4.7110, // Bogotá default
    longitude: initialLocation?.longitude || -74.0721,
    latitudeDelta: 0.0122,
    longitudeDelta: 0.0121,
  });
  const mapRef = useRef(null);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      getAddressFromCoordinates(initialLocation.latitude, initialLocation.longitude);
    }
  }, [initialLocation]);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      });
      getAddressFromCoordinates(initialLocation.latitude, initialLocation.longitude);
    }
  }, [initialLocation]);

  const getAddressFromCoordinates = async (latitude, longitude) => {
    setIsLoadingAddress(true);
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const location = result[0];
        const addressParts = [
          location.street,
          location.streetNumber,
          location.district,
          location.city,
          location.region
        ].filter(Boolean);
        
        setAddress(addressParts.join(', ') || 'Dirección no disponible');
      } else {
        setAddress('Dirección no disponible');
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setAddress('Error al obtener la dirección');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
    getAddressFromCoordinates(coordinate.latitude, coordinate.longitude);
  };

  const handleMarkerDragEnd = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
    getAddressFromCoordinates(coordinate.latitude, coordinate.longitude);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelected({
        coords: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          accuracy: 5, // Approximate accuracy for manually selected location
        },
        timestamp: Date.now(),
      });
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para obtener tu posición actual');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0121,
      };

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setRegion(newRegion);
      setSelectedLocation(newLocation);
      
      // Animate map to current location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      
      getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <FontAwesome5 name="times" size={20} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Interactive Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onPress={handleMapPress}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType="standard"
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              pinColor={THEME.colors.primary}
            >
              <View style={styles.customMarker}>
                <FontAwesome5 name="map-marker-alt" size={30} color={THEME.colors.primary} />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Current Location Button */}
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
        >
          <FontAwesome5 name="crosshairs" size={20} color={THEME.colors.primary} />
        </TouchableOpacity>

        {/* Map Instructions Overlay */}
        <View style={styles.mapInstructions}>
          <Text style={styles.mapInstructionsText}>
            {selectedLocation ? 'Arrastra el pin para ajustar' : 'Toca el mapa para seleccionar ubicación'}
          </Text>
        </View>
      </View>

      {/* Address Display */}
      <View style={styles.addressContainer}>
        <View style={styles.addressHeader}>
          <FontAwesome5 name="map-marker-alt" size={16} color={THEME.colors.primary} />
          <Text style={styles.addressLabel}>Ubicación seleccionada</Text>
        </View>
        
        {isLoadingAddress ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Obteniendo dirección...</Text>
          </View>
        ) : (
          <Text style={styles.addressText}>{address || 'Selecciona una ubicación en el mapa'}</Text>
        )}

        {selectedLocation && (
          <Text style={styles.coordinatesText}>
            Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
          </Text>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          • Toca el mapa para seleccionar una ubicación
        </Text>
        <Text style={styles.instructionsText}>
          • Arrastra el pin para ajustar la posición exacta
        </Text>
        <Text style={styles.instructionsText}>
          • Usa el botón ⊕ para centrar en tu ubicación actual
        </Text>
      </View>

      {/* Confirm Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.confirmButton, !selectedLocation && styles.disabledButton]}
          onPress={handleConfirmLocation}
          disabled={!selectedLocation}
        >
          <LinearGradient
            colors={
              selectedLocation 
                ? [THEME.colors.primary, "#059669", "#047857"]
                : [THEME.colors.disabled, THEME.colors.disabled, THEME.colors.disabled]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmButtonGradient}
          >
            <FontAwesome5 name="check" size={20} color={THEME.colors.white} />
            <Text style={styles.confirmButtonText}>Confirmar Ubicación</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  placeholder: {
    width: 36,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: height * 0.5, // Take up half the screen
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: THEME.colors.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  mapInstructions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 8,
  },
  mapInstructionsText: {
    color: THEME.colors.white,
    fontSize: 12,
    textAlign: 'center',
  },
  addressContainer: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  coordinatesText: {
    fontSize: 12,
    color: THEME.colors.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  instructionsContainer: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
  },
  instructionsText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: THEME.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
