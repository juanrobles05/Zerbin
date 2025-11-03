import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { THEME } from '../../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReportCard({ report, onPress }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          color: THEME.colors.warning || '#F59E0B',
          icon: 'clock',
          bgColor: '#FEF3C7'
        };
      case 'in_progress':
        return {
          label: 'En Progreso',
          color: THEME.colors.info || '#3B82F6',
          icon: 'truck',
          bgColor: '#DBEAFE'
        };
      case 'resolved':
        return {
          label: 'Recolectado',
          color: THEME.colors.success || '#10B981',
          icon: 'check-circle',
          bgColor: '#D1FAE5'
        };
      default:
        return {
          label: status,
          color: THEME.colors.secondary || '#6B7280',
          icon: 'question',
          bgColor: '#F3F4F6'
        };
    }
  };

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 3:
        return { label: 'Alta', color: '#EF4444', icon: 'exclamation-triangle' };
      case 2:
        return { label: 'Media', color: '#F59E0B', icon: 'exclamation-circle' };
      case 1:
      default:
        return { label: 'Baja', color: '#10B981', icon: 'info-circle' };
    }
  };

  const statusInfo = getStatusInfo(report.status);
  const priorityInfo = getPriorityInfo(report.priority);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress && onPress(report)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {report.image_url ? (
            <Image 
              source={{ uri: report.image_url }} 
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <FontAwesome5 name="image" size={30} color={THEME.colors.textSecondary} />
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          {/* Header with Status Badge */}
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <FontAwesome5 name={statusInfo.icon} size={12} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
            {report.priority > 1 && (
              <View style={styles.priorityBadge}>
                <FontAwesome5 name={priorityInfo.icon} size={10} color={priorityInfo.color} />
                <Text style={[styles.priorityText, { color: priorityInfo.color }]}>
                  {priorityInfo.label}
                </Text>
              </View>
            )}
          </View>

          {/* Waste Type */}
          <View style={styles.wasteTypeContainer}>
            <FontAwesome5 name="recycle" size={16} color={THEME.colors.primary} />
            <Text style={styles.wasteType}>
              {report.waste_type || 'Sin clasificar'}
            </Text>
            {report.confidence_score && (
              <Text style={styles.confidence}>
                ({Math.round(report.confidence_score)}%)
              </Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.detailRow}>
            <FontAwesome5 name="calendar" size={12} color={THEME.colors.textSecondary} />
            <Text style={styles.detailText}>
              {formatDate(report.created_at)}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <FontAwesome5 name="map-marker-alt" size={12} color={THEME.colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
              {report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
            </Text>
          </View>

          {/* Description if available */}
          {report.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
                {report.description}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron for navigation */}
      <View style={styles.chevronContainer}>
        <FontAwesome5 name="chevron-right" size={16} color={THEME.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...THEME.shadows.medium,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  wasteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  wasteType: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
    textTransform: 'capitalize',
  },
  confidence: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border || '#E5E7EB',
  },
  description: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
  chevronContainer: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
