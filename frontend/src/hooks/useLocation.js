import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [permission, setPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocationPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
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
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    location,
    permission,
    isLoading,
    requestLocationPermission,
    getCurrentLocation
  };
};