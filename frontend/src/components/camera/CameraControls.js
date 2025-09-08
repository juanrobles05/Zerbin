import { View, TouchableOpacity, StyleSheet, Text } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { FontAwesome5 } from "@expo/vector-icons"

export function CameraControls({ onCapture, onClose }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <LinearGradient colors={["#ef4444", "#dc2626", "#b91c1c"]} style={styles.closeButtonGradient}>
          <FontAwesome5 name="times" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={onCapture} style={styles.captureButton}>
        <LinearGradient colors={["#22c55e", "#16a34a", "#15803d"]} style={styles.captureButtonGradient}>
          <FontAwesome5 name="camera" size={24} color="#fff" />
          <Text style={styles.buttonText}>Capturar</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  captureButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonGradient: {
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonGradient: {
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})