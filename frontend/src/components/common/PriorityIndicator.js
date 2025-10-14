import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { THEME } from '../../styles/theme';

export const PriorityIndicator = ({ 
  priority, 
  size = 'medium', 
  showLabel = true, 
  isUrgent = false 
}) => {
  const getPriorityInfo = (level) => {
    switch (level) {
      case 3:
        return {
          label: 'ALTA',
          color: '#EF4444',
          icon: 'exclamation-triangle',
          bgColor: '#EF4444'
        };
      case 2:
        return {
          label: 'MEDIA',
          color: '#F59E0B',
          icon: 'exclamation-circle',
          bgColor: '#F59E0B'
        };
      case 1:
      default:
        return {
          label: 'BAJA',
          color: '#10B981',
          icon: 'info-circle',
          bgColor: '#10B981'
        };
    }
  };

  const info = getPriorityInfo(priority);
  const sizeStyles = size === 'small' ? styles.small : size === 'large' ? styles.large : styles.medium;

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <View style={[styles.badge, { backgroundColor: info.bgColor }, sizeStyles.badge]}>
        <FontAwesome5 
          name={info.icon} 
          size={sizeStyles.iconSize} 
          color="#FFFFFF" 
        />
        {showLabel && (
          <Text style={[styles.label, sizeStyles.label]}>
            {info.label}
          </Text>
        )}
      </View>
      
      {isUrgent && (
        <View style={styles.urgentBadge}>
          <FontAwesome5 name="bell" size={10} color="#EF4444" />
        </View>
      )}
    </View>
  );
};

export const DecompositionTime = ({ days, compact = false }) => {
  const formatTime = (days) => {
    if (days < 30) {
      return `${days} día${days !== 1 ? 's' : ''}`;
    } else if (days < 365) {
      const months = Math.round(days / 30);
      return `${months} mes${months !== 1 ? 'es' : ''}`;
    } else {
      const years = Math.round(days / 365);
      return `${years} año${years !== 1 ? 's' : ''}`;
    }
  };

  return (
    <View style={styles.decompositionContainer}>
      <FontAwesome5 name="clock" size={12} color={THEME.colors.textSecondary} />
      <Text style={[styles.decompositionText, compact && styles.decompositionTextCompact]}>
        {compact ? formatTime(days) : `Descomposición: ${formatTime(days)}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  urgentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 2,
  },
  
  // Tamaños
  small: {
    container: {},
    badge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    label: {
      fontSize: 10,
    },
    iconSize: 10,
  },
  medium: {
    container: {},
    badge: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    label: {
      fontSize: 12,
    },
    iconSize: 12,
  },
  large: {
    container: {},
    badge: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    label: {
      fontSize: 14,
    },
    iconSize: 16,
  },
  
  // Tiempo de descomposición
  decompositionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  decompositionText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginLeft: 4,
  },
  decompositionTextCompact: {
    fontSize: 10,
  },
});