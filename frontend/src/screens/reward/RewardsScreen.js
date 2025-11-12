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
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { rewardService } from '../../services/api/rewardService';
import { reportService } from '../../services/api/reportService';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../styles/colors';

export const RewardsScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  const loadRewards = async () => {
    try {
      setLoading(true);

      // Cargar recompensas disponibles
      const rewardsData = await rewardService.getRewards();

      setRewards(rewardsData);

      // Cargar puntos del usuario si está autenticado
      if (user?.id) {
        try {
          const pointsResp = await reportService.getUserPoints(user.id);
          const pts = (pointsResp && typeof pointsResp === 'object' && 'points' in pointsResp) 
            ? pointsResp.points
            : Number(pointsResp) || 0;
          setUserPoints(pts);
        } catch (err) {
          // Si falla, intentar obtener de caché
          const cached = await AsyncStorage.getItem('user_points');
          setUserPoints(Number(cached) || 0);
        }
      }
    } catch (error) {
      console.error('Error cargando recompensas:', error);
      Alert.alert('Error', 'No se pudieron cargar las recompensas.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId, rewardName, pointsRequired) => {
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para canjear recompensas.');
      return;
    }

    if (userPoints < pointsRequired) {
      Alert.alert(
        'Puntos Insuficientes',
        `Necesitas ${pointsRequired} puntos para canjear esta recompensa. Actualmente tienes ${userPoints} puntos.`
      );
      return;
    }

    Alert.alert(
      'Confirmar Canje',
      `¿Deseas canjear "${rewardName}" por ${pointsRequired} puntos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Canjear',
          style: 'default',
          onPress: async () => {
            setRedeeming(rewardId);
            try {
              const res = await rewardService.redeemReward(user.id, rewardId);

              // Actualizar puntos locales
              const newPoints = res.user_points || (userPoints - pointsRequired);
              setUserPoints(newPoints);
              const now = Date.now().toString();
              await AsyncStorage.setItem('user_points', String(newPoints));

              // Actualizar marcadores de tiempo para que Home y Profile detecten el cambio
              await AsyncStorage.setItem('last_report_at', now);
              await AsyncStorage.setItem('home_last_checked_report_at', '0');
              await AsyncStorage.setItem('profile_last_checked_report_at', '0');

              // Mostrar mensaje con información de recogida
              Alert.alert(
                '🎉 ¡Recompensa Canjeada!',
                `Has canjeado "${rewardName}" exitosamente.\n\n` +
                `Puntos canjeados: ${res.points_redeemed || pointsRequired}\n` +
                `Puntos restantes: ${newPoints}\n\n` +
                `📍 ${res.pickup_message || 'Puedes recoger tu recompensa en las oficinas de Zerbin.'}\n\n` +
                `🎫 Código de canje:\n${res.redemption_code || 'N/A'}\n\n` +
                `Presenta este código al momento de recoger tu premio.`,
                [{ text: 'OK', onPress: () => loadRewards() }]
              );
            } catch (error) {
              console.error('Error al canjear:', error);
              const msg = error.response?.data?.detail || 'Error al canjear la recompensa.';
              Alert.alert('⚠️ Error', msg);
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadRewards();
  }, [user?.id]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <FontAwesome5 name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recompensas</Text>
          </View>

          <View style={styles.emptyContainer}>
            <FontAwesome5 name="gift" size={80} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Inicia sesión para ver recompensas</Text>
            <Text style={styles.emptySubtitle}>
              Acumula puntos reportando residuos y canjéalos por increíbles premios
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando recompensas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Tarjeta de puntos del usuario */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsIconContainer}>
            <FontAwesome5 name="star" size={32} color="#FFD700" />
          </View>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>Tus Puntos Disponibles</Text>
            <Text style={styles.pointsNumber}>{userPoints}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Información sobre recogida de recompensas */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <FontAwesome5 name="info-circle" size={20} color={COLORS.primary} />
              <Text style={styles.infoTitle}>Cómo recoger tus recompensas</Text>
            </View>
            <Text style={styles.infoText}>
              Una vez canjeada, presenta tu código en las oficinas de Zerbin para recoger tu premio.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Recompensas Disponibles</Text>

          {rewards.length === 0 ? (
            <View style={styles.emptyRewards}>
              <FontAwesome5 name="inbox" size={60} color={COLORS.textSecondary} />
              <Text style={styles.emptyRewardsText}>
                No hay recompensas disponibles en este momento
              </Text>
            </View>
          ) : (
            rewards.map((item) => {
              const canRedeem = userPoints >= item.points_required;
              const isRedeeming = redeeming === item.id;

              // Construir la URL de la imagen - manejar URLs de Supabase y otras
              let imageUrl = 'https://cdn-icons-png.flaticon.com/512/679/679922.png'; // Fallback por defecto

              if (item.image_url && item.image_url.trim() !== '') {
                // Si ya tiene http/https, usar directamente
                if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
                  imageUrl = item.image_url.trim();
                } else {
                  // Si no tiene protocolo, agregar https://
                  imageUrl = `https://${item.image_url.trim()}`;
                }
              } else {
                console.log('⚠️ No hay image_url, usando fallback');
              }

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.imageContainer}>
                    {/* Placeholder de fondo */}
                    <View style={styles.imagePlaceholder}>
                      <FontAwesome5 name="gift" size={30} color={COLORS.textSecondary} />
                    </View>

                    {/* Imagen principal */}
                    {imageUrl && (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={(error) => {
                          console.error(`\n❌ ERROR CARGANDO IMAGEN`);
                          console.error(`   Recompensa: "${item.name}"`);
                          console.error(`   URL que falló: ${imageUrl}`);
                          console.error(`   Error nativo:`, error.nativeEvent);
                        }}
                      />
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.rewardName}>{item.name}</Text>
                    <Text style={styles.rewardDescription}>{item.description}</Text>

                    <View style={styles.costContainer}>
                      <FontAwesome5 name="coins" size={14} color="#FFD700" />
                      <Text style={styles.costText}>
                        {' '}{item.points_required} puntos
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        !canRedeem && styles.disabledButton,
                        isRedeeming && styles.redeemingButton,
                      ]}
                      onPress={() => handleRedeem(item.id, item.name, item.points_required)}
                      disabled={!canRedeem || isRedeeming}
                    >
                      {isRedeeming ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>
                          {canRedeem ? 'Canjear' : 'Puntos insuficientes'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginBottom: 10,
    marginLeft: 20,
    marginRight: 20,
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  pointsIconContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 50,
    padding: 15,
    marginRight: 15,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  pointsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.divider,
    borderRadius: 12,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rewardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  rewardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  costText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
  },
  redeemingButton: {
    backgroundColor: COLORS.primaryDark,
  },
  buttonText: {
    textAlign: 'center',
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyRewards: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyRewardsText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
