import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { reportService, classify } from '../../services/api/reportService';
import { PointsOverlay } from "../../components/PointsOverlay";

const getAddressFromCoords = async (lat, lon) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(url, { headers: { "User-Agent": "my-app" } });
    const data = await response.json();

    const clean = str => str ? String(str).trim() : "";
    const city = clean(data.address?.city).replace("Perímetro Urbano", "");
    const neighborhood = clean(data.address?.neighbourhood);
    const road = clean(data.address?.road);
    const houseNumber = data.address?.house_number ? `#${clean(data.address.house_number)}` : "";

    return [road, houseNumber, neighborhood, city].filter(Boolean).join(", ") || "Dirección no encontrada";
  } catch (error) {
    console.error("Error obteniendo dirección:", error);
    return null;
  }
};

export function ReportScreen({ navigation, route }) {
  const imageUri = route?.params?.image;
  const location = route?.params?.location;

  const [classification, setClassification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [showPointsOverlay, setShowPointsOverlay] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (location) {
      getAddressFromCoords(location.coords.latitude, location.coords.longitude)
        .then(direccion => setAddress(direccion));
    } else {
      setAddress("Ubicación no disponible");
    }
    if (imageUri) classifyImage(imageUri);
  }, [imageUri]);

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

  const handleReportSubmit = async () => {
    setReportLoading(true);
    try {
      if (!location || !location.coords) {
        alert('Falta ubicación');
        return;
      }

      await reportService.createReport(imageUri, location, description, classification);

      
      const response = await fetch("http://192.168.0.102:8000/api/v1/users/1/points"); // Cambiar con TU dirección IP y puerto utilizado
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Completa los detalles del residuo</Text>
      </View>
      {reportLoading && <Text style={styles.textLoader}>Enviando reporte...</Text>}

      {/* Image Preview */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
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
        </View>

        {/* Clasificación */}
        {loading && <Text style={styles.textLoader}>Cargando clasificación...</Text>}
        {classification && (
          <>
            <Text style={styles.sectionTitle}>Clasificación</Text>
            <View style={styles.classificationContainer}>
              <Text>Tipo de residuo: {classification.type}</Text>
              <Text>Confianza: {classification.confidence}%</Text>
            </View>
          </>
        )}

        {/* Ubicación */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Ubicación detectada</Text>
          <View style={styles.locationContainer}>
            <View style={styles.locationInfo}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#10B981" />
              <Text style={styles.locationText}>{address}</Text>
            </View>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Descripción (opcional)</Text>
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

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity onPress={handleReportSubmit} style={styles.submitButtonContainer}>
          <LinearGradient
            colors={["#10B981", "#059669", "#047857"]}
            style={styles.submitButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name="paper-plane" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>ENVIAR REPORTE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 🔽 OVERLAY DE PUNTOS */}
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
  container: {
    flex: 1,
    backgroundColor: "#4B5563",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#4B5563",
    borderBottomWidth: 1,
    borderBottomColor: "#6B7280",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
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
  scrollView: {
    flex: 1,
  },
  imageSection: {
    padding: 8,
  },
  imageContainer: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#6B7280",
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
    margin: 10,
  },
  previewImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  placeholderImage: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  successText: {
    color: "#10B981",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  // detailsSection: {
  //   backgroundColor: "#6B7280",
  //   margin: 20,
  //   marginTop: 0,
  //   borderRadius: 12,
  //   padding: 20,
  //   borderWidth: 1,
  //   borderColor: "#9CA3AF",
  // },
  // detailsTitle: {
  //   fontSize: 18,
  //   fontWeight: "bold",
  //   color: "#FFFFFF",
  //   marginBottom: 20,
  // },
  fieldContainer: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    marginHorizontal: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#4B5563",
    borderRadius: 8,
    padding: 4,
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
    padding: 10,
    marginHorizontal: 20,
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
    marginHorizontal: 20,
  },
  textLoader: {
    color: "#10B981",           // Verde destacado
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
    backgroundColor: "rgba(16,185,129,0.08)", // Fondo suave verde
    padding: 10,
    borderRadius: 8,
    letterSpacing: 0.5,
    marginHorizontal: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    marginHorizontal: 20,
  },
  classificationContainer: {
    backgroundColor: "#374151", // verde suave con transparencia
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
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
  submitContainer: {
    padding: 20,
    backgroundColor: "#4B5563",
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
})