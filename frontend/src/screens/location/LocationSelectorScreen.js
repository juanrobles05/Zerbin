import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationPicker } from '../../components/location/LocationPicker';
import { THEME } from '../../styles/theme';

export const LocationSelectorScreen = ({ navigation, route }) => {
  const { initialLocation, onLocationSelected, title } = route.params || {};

  const handleLocationSelected = (location) => {
    if (onLocationSelected) {
      onLocationSelected(location);
    }
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LocationPicker
        initialLocation={initialLocation}
        onLocationSelected={handleLocationSelected}
        onCancel={handleCancel}
        title={title || "Seleccionar Ubicación"}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
