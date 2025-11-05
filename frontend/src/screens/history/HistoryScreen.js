import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { reportService } from '../../services/api/reportService';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { THEME } from '../../styles/theme';
import ReportCard from '../../components/reports/ReportCard';
import StatusFilter from '../../components/reports/StatusFilter';
import { useAuth } from '../../contexts/AuthContext';

/**
 * HistoryScreen - User Dashboard
 * Displays a chronological list of all user reports with filtering capabilities
 */
export function HistoryScreen({ navigation, route }) {
  const { user } = useAuth();
  // State management
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [totalReports, setTotalReports] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // TODO: Replace with actual user ID from authentication
  const userId = user?.id;

  /**
   * Fetch user reports from the API
   */
  const fetchReports = useCallback(async (page = 1, status = 'all', append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      }

      const statusParam = status === 'all' ? null : status;
      const response = await reportService.getUserReports(userId, statusParam, page, 20);

      if (response) {
        const newReports = response.reports || [];

        if (append) {
          setReports(prev => [...prev, ...newReports]);
        } else {
          setReports(newReports);
        }

        setTotalReports(response.total || 0);
        setHasMore(newReports.length === 20); // If we got a full page, there might be more
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los reportes. Por favor, intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchReports(1, selectedStatus);
  }, [selectedStatus]);

  /**
   * Refresh on pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchReports(1, selectedStatus);
  }, [selectedStatus, fetchReports]);

  /**
   * Handle status filter change
   */
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    setReports([]);
  };

  /**
   * Handle report card press - navigate to detail view
   */
  const handleReportPress = (report) => {
    // TODO: Navigate to report detail screen
    Alert.alert(
      'Detalle del Reporte',
      `ID: ${report.id}\nTipo: ${report.waste_type}\nEstado: ${report.status}`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Navigate to camera to create new report
   */
  const handleCreateReport = () => {
    navigation.navigate('Camera', { from: 'History' });
  };

  /**
   * Load more reports (pagination)
   */
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchReports(nextPage, selectedStatus, true);
    }
  };

  /**
   * Render individual report item
   */
  const renderReportItem = ({ item }) => (
    <ReportCard report={item} onPress={handleReportPress} />
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (loading) return null;

    const emptyMessages = {
      all: {
        icon: 'inbox',
        title: 'No hay reportes',
        subtitle: '¡Comienza a reportar residuos ahora!',
      },
      pending: {
        icon: 'clock',
        title: 'No hay reportes pendientes',
        subtitle: 'Todos tus reportes están siendo procesados o ya fueron recolectados.',
      },
      in_progress: {
        icon: 'truck',
        title: 'No hay reportes en progreso',
        subtitle: 'No hay reportes en proceso de recolección en este momento.',
      },
      resolved: {
        icon: 'check-circle',
        title: 'No hay reportes recolectados',
        subtitle: 'Aún no tienes reportes completados.',
      },
    };

    const message = emptyMessages[selectedStatus] || emptyMessages.all;

    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name={message.icon} size={64} color={THEME.colors.textSecondary} />
        <Text style={styles.emptyTitle}>{message.title}</Text>
        <Text style={styles.emptySubtitle}>{message.subtitle}</Text>
        <TouchableOpacity onPress={handleCreateReport}>
          <LinearGradient
            colors={[THEME.colors.primary, '#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyButton}
          >
            <FontAwesome5 name="camera" size={20} color={THEME.colors.white} />
            <Text style={styles.emptyButtonText}>Crear Reporte</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render footer (loading indicator for pagination)
   */
  const renderFooter = () => {
    if (!hasMore || reports.length === 0) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={THEME.colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Reportes</Text>
          <Text style={styles.headerSubtitle}>
            {totalReports} {totalReports === 1 ? 'reporte' : 'reportes'} en total
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateReport}
        >
          <LinearGradient
            colors={[THEME.colors.primary, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <FontAwesome5 name="plus" size={20} color={THEME.colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <StatusFilter
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
      />

      {/* Reports List */}
      {loading && reports.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            reports.length === 0 && styles.listContentEmpty
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[THEME.colors.primary]}
              tintColor={THEME.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background || '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: THEME.colors.cardBackground,
    ...THEME.shadows?.small,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: THEME.colors.textSecondary,
  },
  listContent: {
    paddingVertical: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: THEME.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});