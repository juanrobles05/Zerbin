import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { THEME } from '../../styles/theme';

const WASTE_TYPES = [
  { id: 'organic', icon: 'leaf' },
  { id: 'plastic', icon: 'recycle' },
  { id: 'glass', icon: 'wine-bottle' },
  { id: 'paper', icon: 'file-alt' },
  { id: 'cardboard', icon: 'box' },
  { id: 'metal', icon: 'cog' },
  { id: 'electronic', icon: 'laptop' },
  { id: 'hazardous', icon: 'exclamation-triangle' },
  { id: 'other', icon: 'ellipsis-h' },
];

export default function WasteTypeSelector({ visible, onClose, onSelect, suggested }) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <FontAwesome5 name="recycle" size={20} color={THEME.colors.primary} />
            <Text style={styles.title}>Selecciona el tipo correcto</Text>
          </View>

          {/* Sugerencia */}
          {suggested && (
            <View style={styles.suggestedContainer}>
              <FontAwesome5 name="lightbulb" size={14} color={THEME.colors.primary} />
              <Text style={styles.suggestedLabel}>Sugerencia IA:</Text>
              <Text style={styles.suggestedValue}>{suggested}</Text>
            </View>
          )}

          {/* Lista de tipos de residuo */}
          <FlatList
            data={WASTE_TYPES}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const isSuggested = item.id === suggested;
              return (
                <TouchableOpacity
                  style={[styles.item, isSuggested && styles.itemSuggested]}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <FontAwesome5
                    name={item.icon}
                    size={16}
                    color={isSuggested ? THEME.colors.primary : THEME.colors.textSecondary}
                  />
                  <Text style={[styles.itemText, isSuggested && styles.itemTextSuggested]}>
                    {item.id}
                  </Text>
                  {isSuggested && (
                    <FontAwesome5
                      name="check-circle"
                      size={16}
                      color={THEME.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {/* Botón Cancelar */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: THEME.colors.cardBackground,
    borderRadius: 12,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: THEME.colors.textPrimary,
    marginLeft: 8,
  },
  suggestedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  suggestedLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginLeft: 8,
  },
  suggestedValue: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
    marginLeft: 6,
  },
  list: {
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.background,
    backgroundColor: 'transparent',
  },
  itemSuggested: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 16,
    color: THEME.colors.textPrimary,
    marginLeft: 12,
    flex: 1,
    textTransform: 'capitalize',
  },
  itemTextSuggested: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: THEME.colors.background,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
