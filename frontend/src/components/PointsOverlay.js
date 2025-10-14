// components/PointsOverlay.js
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

export const PointsOverlay = ({ visible, points, totalPoints, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity>
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
  button: {
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

