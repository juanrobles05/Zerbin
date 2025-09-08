import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { THEME } from '../../styles/theme';
import { reportService, classify } from '../../services/api/reportService';

export function ReportScreen({ navigation, route }) {
  const imageUri = route?.params?.image;
  const location = route?.params?.location;
  const [classification, setClassification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (imageUri) {
      classifyImage(imageUri);
    }
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
        {location && location.coords && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Ubicación detectada</Text>
            <Text>Latitud: {location.coords.latitude}</Text>
            <Text>Longitud: {location.coords.longitude}</Text>
          </View>
        )}

        {/* Clasificación */}
        {loading && <Text style={styles.text}>Cargando clasificación...</Text>}
        {classification && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Clasificación</Text>
            <Text>Tipo de residuo: {classification.type}</Text>
            <Text>Confianza: {classification.confianza}%</Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          onPress={async () => {
            setLoading(true);
            try {
              await reportService.uploadImage(imageUri, location);
              alert('Reporte enviado exitosamente');
              navigation.goBack();
            } catch (error) {
              alert('Error al enviar el reporte');
            }
            setLoading(false);
          }}
          style={styles.submitButtonContainer}
        >
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
})