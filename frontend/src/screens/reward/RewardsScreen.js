// frontend/src/screens/RewardsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { rewardService } from '../../services/api/rewardService';
import { reportService } from '../../services/api/reportService';
import Toast from 'react-native-toast-message';
import { PointsOverlay } from '../../components/PointsOverlay';

export const RewardsScreen = () => {
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [pointsGanados, setPointsGanados] = useState(0);

  const userId = 1; // ID de prueba del usuario autenticado

  const loadRewards = async () => {
    try {
      const [rewardsData, pointsData] = await Promise.all([
        rewardService.getRewards(),
        reportService.getUserPoints(userId),
      ]);
      setRewards(rewardsData);
      setUserPoints(pointsData.points || 0);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar las recompensas.',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId) => {
    setRedeeming(rewardId);
    try {
      const res = await rewardService.redeemReward(userId, rewardId);
      const rewardName = res.reward?.name || 'una recompensa';

      // Actualizar puntos locales con el valor que devuelve el backend
      setUserPoints(res.user_points || 0);

      // Mostrar overlay de puntos ganados
      setPointsGanados(res.reward?.points_required || 0);
      setOverlayVisible(true);

      Toast.show({
        type: 'success',
        text1: '🎉 ¡Recompensa canjeada!',
        text2: `Has canjeado ${rewardName}.`,
        visibilityTime: 3000,
      });

      loadRewards();
    } catch (error) {
      console.error('Error al canjear:', error);
      const msg = error.response?.data?.detail || 'Error al canjear la recompensa.';
      Toast.show({
        type: 'error',
        text1: '⚠️ Error',
        text2: msg,
        visibilityTime: 3000,
      });
    } finally {
      setRedeeming(null);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>   Tienda de Recompensas</Text>
      <Text style={styles.pointsText}>Tienes {userPoints} puntos</Text>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const canRedeem = userPoints >= item.points_required;
          return (
            <View style={styles.card}>
              <Image
                source={{
                  uri:
                    item.image_url ||
                    'https://cdn-icons-png.flaticon.com/512/679/679922.png',
                }}
                style={styles.image}
              />
              <View style={styles.info}>
                <Text style={styles.rewardName}>{item.name}</Text>
                <Text style={styles.rewardDescription}>{item.description}</Text>
                <Text style={styles.costText}>
                  🔹 Costo: <Text style={styles.costPoints}>{item.points_required}</Text> puntos
                </Text>

                <TouchableOpacity
                  style={[styles.button, !canRedeem && styles.disabledButton]}
                  onPress={() => handleRedeem(item.id)}
                  disabled={!canRedeem || redeeming === item.id}
                >
                  <Text style={styles.buttonText}>
                    {redeeming === item.id
                      ? 'Canjeando...'
                      : canRedeem
                      ? 'Canjear'
                      : 'Puntos insuficientes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Overlay de puntos ganados */}
      <PointsOverlay
        visible={overlayVisible}
        points={pointsGanados}
        totalPoints={userPoints}
        onClose={() => setOverlayVisible(false)}
      />

      {/* Toast global */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rewardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginVertical: 4,
  },
  costText: {
    fontSize: 14,
    color: '#374151',
  },
  costPoints: {
    fontWeight: 'bold',
    color: '#10B981',
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
