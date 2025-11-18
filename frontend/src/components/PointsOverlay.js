// components/PointsOverlay.js
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { useNavigation } from "@react-navigation/native";

export const PointsOverlay = ({ visible, points, totalPoints, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const handleGoToRewards = () => {
    onClose(); // Cierra el overlay
    navigation.navigate("Rewards"); // Va al catálogo
  };

  return (
    <View style={styles.overlay}>
      <ConfettiCannon count={50} origin={{ x: 200, y: -10 }} fadeOut />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>🎉 ¡Puntos ganados!</Text>
        <Text style={styles.pointsText}>
          Has recibido <Text style={styles.pointsNumber}>{points}</Text> puntos por este reporte
        </Text>
        <Text style={styles.totalText}>
          Total acumulado: <Text style={styles.pointsNumber}>{totalPoints}</Text> puntos
        </Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleGoToRewards}>
            <Text style={styles.buttonText}>Ver Catálogo</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  content: {
    backgroundColor: "#374151",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  totalText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  pointsNumber: {
    fontWeight: "bold",
    color: "#10B981",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: "#6B7280",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
