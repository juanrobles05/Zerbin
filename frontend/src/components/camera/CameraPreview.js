import { View, Image, TouchableOpacity, StyleSheet, Text } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { FontAwesome5 } from "@expo/vector-icons"

export function CameraPreview({ imageUri, onConfirm, onRetake, onShowCoords }) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <LinearGradient colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.9)"]} style={styles.controls}>
        <TouchableOpacity onPress={onRetake} style={styles.buttonContainer}>
          <LinearGradient colors={["#ef4444", "#dc2626", "#b91c1c"]} style={styles.button}>
            <FontAwesome5 name="redo" size={18} color="white" />
            <Text style={styles.buttonText}>Retomar</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={onConfirm} style={styles.buttonContainer}>
          <LinearGradient colors={["#22c55e", "#16a34a", "#15803d"]} style={styles.button}>
            <FontAwesome5 name="check" size={18} color="white" />
            <Text style={styles.buttonText}>Confirmar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    paddingBottom: 30,
  },
  buttonContainer: {
    borderRadius: 25,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 25,
    gap: 8,
    paddingLeft: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})