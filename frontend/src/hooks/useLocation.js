import { useRef, useState } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [permission, setPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualLocation, setManualLocation] = useState(null);
  const watcherRef = useRef(null);

  const requestLocationPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermission(status === 'granted');
      return status === 'granted';
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!permission) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return null;
    }
    setIsLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(currentLocation);
      return currentLocation;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const startWatchingLocation = async () => {
    if (!permission) {
      const ok = await requestLocationPermission();
      if (!ok) return null;
    }
    if (watcherRef.current) return watcherRef.current;
    watcherRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 3 },
      l => setLocation(l)
    );
    return watcherRef.current;
  };

  const stopWatchingLocation = () => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
  };

  const setManualSelectedLocation = (selectedLocation) => {
    setManualLocation(selectedLocation);
  };

  const getActiveLocation = () => {
    return manualLocation || location;
  };

  const clearManualLocation = () => {
    setManualLocation(null);
  };

  return {
    location,
    manualLocation,
    permission,
    isLoading,
    requestLocationPermission,
    getCurrentLocation,
    startWatchingLocation,
    stopWatchingLocation,
    setManualSelectedLocation,
    getActiveLocation,
    clearManualLocation
  };
};
