import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

const WASTE_TYPES = [
  'organico', 'plastico', 'vidrio', 'papel', 'carton', 'metal', 'electronico', 'peligroso', 'otros'
];

export default function WasteTypeSelector({ visible, onClose, onSelect, suggested }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Selecciona el tipo correcto</Text>
          <Text style={styles.suggested}>Sugerencia IA: {suggested}</Text>
          <FlatList
            data={WASTE_TYPES}
            keyExtractor={(i) => i}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={styles.itemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.close} onPress={onClose}><Text>Cancelar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '90%', maxHeight: '70%', backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  suggested: { fontSize: 14, marginBottom: 12, color: '#555' },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16 },
  close: { marginTop: 12, alignItems: 'center' }
});
