import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  mocked: boolean;
  timestamp: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) {
        setError('Location permission denied.');
      }
      return granted;
    } catch (err) {
      setError('Error requesting location permission.');
      return false;
    }
  }, []);

  const fetchLocation = useCallback(async (): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);
    try {
      // Check current permission status
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setLoading(false);
          return null;
        }
      }

      // Fetch accurate GPS coordinates
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const data: LocationData = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        altitude: pos.coords.altitude,
        accuracy: pos.coords.accuracy,
        mocked: !!(pos as any).mocked, // Android flag
        timestamp: pos.timestamp,
      };

      setLocation(data);
      setLoading(false);
      return data;
    } catch (err: any) {
      console.error('Failed to get location:', err);
      setError(err?.message || 'Failed to fetch GPS coordinates.');
      setLoading(false);
      return null;
    }
  }, [requestPermission]);

  useEffect(() => {
    // Check permission on mount
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setPermissionGranted(status === 'granted');
    });
  }, []);

  return {
    location,
    loading,
    error,
    permissionGranted,
    requestPermission,
    fetchLocation,
  };
}
