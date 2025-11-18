import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../styles/colors';
import { adminService } from '../../services/api/adminService';
import { useAuth } from '../../contexts/AuthContext';

export function AdminScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null); // null = all
  const [filterPriority, setFilterPriority] = useState(null); // null = all

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [filterStatus, filterPriority])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterPriority !== null) filters.priority = filterPriority;

      const [reportsData, statsData] = await Promise.all([
        adminService.getAllReports(filters),
        adminService.getStats(),
      ]);

      setReports(reportsData);
      setStats(statsData);
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      if (error.response?.status === 403) {
        Alert.alert('Acceso Denegado', 'No tienes permisos de administrador.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'No se pudieron cargar los datos. Verifica tu conexión y que el servidor esté activo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStatusChange = async (reportId, currentStatus) => {
    const statuses = ['pending', 'in_progress', 'resolved'];
    const statusLabels = {
      pending: 'Pendiente',
      in_progress: 'En Proceso',
      resolved: 'Resuelto',
    };

    const buttons = statuses
      .filter((s) => s !== currentStatus)
      .map((status) => ({
        text: statusLabels[status],
        onPress: async () => {
          try {
            await adminService.updateReportStatus(reportId, status);
            Alert.alert('✅ Actualizado', `Estado cambiado a ${statusLabels[status]}`);
            loadData();
          } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado.');
          }
        },
      }));

    buttons.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert('Cambiar Estado', 'Selecciona el nuevo estado:', buttons);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return '#22c55e';
      case 'in_progress':
        return '#3b82f6';
      case 'pending':
      default:
        return '#eab308';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'resolved':
        return 'Resuelto';
      case 'in_progress':
        return 'En Proceso';
      case 'pending':
      default:
        return 'Pendiente';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 3:
        return 'Alta';
      case 2:
        return 'Media';
      case 1:
      default:
        return 'Baja';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 3:
        return '#ef4444';
      case 2:
        return '#f59e0b';
      case 1:
      default:
        return '#10b981';
    }
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Image source={{ uri: item.image_url }} style={styles.reportImage} />
        <View style={styles.reportInfo}>
          <Text style={styles.reportWasteType}>{item.waste_type || 'Residuo'}</Text>
          <Text style={styles.reportUser}>Usuario: {item.username}</Text>
          <Text style={styles.reportDate}>
            {new Date(item.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.badgeText}>{getPriorityLabel(item.priority)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
      </View>

      {/* Descripción */}
      {item.description ? (
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Descripción:</Text>
          <Text style={styles.reportDescription}>{item.description}</Text>
        </View>
      ) : null}

      {/* Ubicación con coordenadas */}
      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Ubicación:</Text>
        {item.address ? (
          <View style={styles.locationRow}>
            <FontAwesome5 name="map-marker-alt" size={12} color={COLORS.textSecondary} />
            <Text style={styles.reportAddress}>{item.address}</Text>
          </View>
        ) : null}
        <Text style={styles.coordinates}>
          📍 Lat: {item.latitude.toFixed(6)}, Lng: {item.longitude.toFixed(6)}
        </Text>
      </View>

      {/* Clasificación IA */}
      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Clasificación IA:</Text>
        <View style={styles.classificationRow}>
          <FontAwesome5 name="robot" size={14} color={COLORS.primary} />
          <Text style={styles.classificationText}>
            {item.waste_type || 'No clasificado'}
          </Text>
          {item.confidence_score ? (
            <Text style={styles.confidenceText}>
              ({(item.confidence_score * 100).toFixed(1)}% confianza)
            </Text>
          ) : null}
        </View>
      </View>

      {/* Clasificación Manual (si existe) */}
      {item.manual_classification ? (
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Corrección Manual:</Text>
          <View style={styles.classificationRow}>
            <FontAwesome5 name="user-edit" size={14} color="#f59e0b" />
            <Text style={[styles.classificationText, { color: '#f59e0b' }]}>
              {typeof item.manual_classification === 'string'
                ? item.manual_classification
                : item.manual_classification?.type || 'Clasificación corregida'}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Prioridad detallada */}
      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Nivel de Prioridad:</Text>
        <View style={styles.priorityRow}>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityNumber}>{item.priority}</Text>
          </View>
          <View style={styles.priorityInfo}>
            <Text style={[styles.priorityLabel, { color: getPriorityColor(item.priority) }]}>
              {getPriorityLabel(item.priority).toUpperCase()}
            </Text>
            <Text style={styles.priorityDescription}>
              {item.priority === 3
                ? 'Requiere atención inmediata'
                : item.priority === 2
                ? 'Atención en las próximas 48h'
                : 'Atención en la próxima semana'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.changeStatusButton}
        onPress={() => handleStatusChange(item.id, item.status)}
      >
        <FontAwesome5 name="edit" size={14} color={COLORS.primary} />
        <Text style={styles.changeStatusText}>Cambiar Estado</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Panel de Administración</Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Cerrar Sesión',
              '¿Estás seguro que deseas cerrar sesión?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Cerrar sesión',
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  },
                },
              ]
            );
          }}
          style={styles.logoutButton}
        >
          <FontAwesome5 name="sign-out-alt" size={20} color="#FF6347" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total_reports}</Text>
            <Text style={styles.statLabel}>Reportes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.reports_by_status.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.active_reports_by_priority.high}</Text>
            <Text style={styles.statLabel}>Prioridad Alta</Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filtros:</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === null && styles.filterButtonActive]}
            onPress={() => setFilterStatus(null)}
          >
            <Text style={[styles.filterButtonText, filterStatus === null && styles.filterButtonTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'pending' && styles.filterButtonTextActive]}>
              Pendientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'in_progress' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('in_progress')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'in_progress' && styles.filterButtonTextActive]}>
              En Proceso
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'resolved' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('resolved')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'resolved' && styles.filterButtonTextActive]}>
              Resueltos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reports List */}
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="inbox" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No hay reportes con estos filtros</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#2a3642',
  },
  logoutButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statCard: {
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border || '#2a3642',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reportImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  reportWasteType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  reportUser: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportDescription: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  infoSection: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#2a3642',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordinates: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  classificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classificationText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  confidenceText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priorityInfo: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  priorityDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reportAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  changeStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border || '#2a3642',
    marginTop: 8,
    gap: 8,
  },
  changeStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});
