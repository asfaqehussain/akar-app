import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const useCurrentLocation = () => {
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const fetchLocation = useCallback(async (): Promise<GPSLocation | null> => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      let status = currentStatus;
      
      if (status !== 'granted') {
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        status = requestStatus;
      }
      
      const granted = status === 'granted';
      setPermissionGranted(granted);
      
      if (!granted) {
        setErrorMsg('Location permission denied');
        setLoading(false);
        return null;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const data: GPSLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? 0,
      };

      setLocation(data);
      setLoading(false);
      return data;
    } catch (err: any) {
      console.error('Failed to get location:', err);
      setErrorMsg(err?.message || 'Failed to fetch GPS coordinates');
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    loading,
    errorMsg,
    permissionGranted,
    refetchLocation: fetchLocation,
  };
};
