import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { THEME } from '../../styles/theme';

/**
 * StatusFilter Component
 * Allows users to filter reports by status: all, pending, in_progress, or resolved (collected)
 */
export default function StatusFilter({ selectedStatus, onStatusChange }) {
  const filters = [
    {
      id: 'all',
      label: 'Todos',
      icon: 'list',
      count: null,
    },
    {
      id: 'pending',
      label: 'Pendientes',
      icon: 'clock',
      color: '#F59E0B',
    },
    {
      id: 'in_progress',
      label: 'En Progreso',
      icon: 'truck',
      color: '#3B82F6',
    },
    {
      id: 'resolved',
      label: 'Recolectados',
      icon: 'check-circle',
      color: '#10B981',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isSelected = selectedStatus === filter.id;
          const backgroundColor = isSelected 
            ? (filter.color || THEME.colors.primary)
            : THEME.colors.white;
          const textColor = isSelected 
            ? THEME.colors.white 
            : (filter.color || THEME.colors.text);
          const borderColor = filter.color || THEME.colors.primary;

          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                {
                  backgroundColor,
                  borderColor: isSelected ? 'transparent' : borderColor,
                },
              ]}
              onPress={() => onStatusChange(filter.id)}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name={filter.icon} 
                size={16} 
                color={isSelected ? THEME.colors.white : (filter.color || THEME.colors.text)} 
              />
              <Text style={[styles.filterText, { color: textColor }]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.background || '#F9FAFB',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border || '#E5E7EB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
    ...THEME.shadows?.small,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
