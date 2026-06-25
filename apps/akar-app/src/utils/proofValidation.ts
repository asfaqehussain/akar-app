import { useUploadStore } from '../store/useUploadStore';
import DeviceInfo from 'react-native-device-info';

/**
 * GPS Accuracy Tier Classification
 *
 * - good:    accuracy <= 20m  (Accept)
 * - warning: 20m < accuracy <= 50m (Warn)
 * - poor:    accuracy > 50m   (Reject-level, but still allow upload)
 */
export type AccuracyTier = 'good' | 'warning' | 'poor';

export function classifyAccuracy(accuracy: number | null): AccuracyTier {
  if (accuracy === null || accuracy === undefined) {
    return 'poor';
  }
  if (accuracy <= 20) {
    return 'good';
  }
  if (accuracy <= 50) {
    return 'warning';
  }
  return 'poor';
}

/**
 * Computes the Haversine distance between two GPS coordinates.
 *
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Checks whether a new capture is at the same coordinates as a previous one.
 *
 * Conditions (all must be true):
 * - Same device
 * - Distance < 5 meters from any previous capture
 * - Time difference < 60 seconds from that previous capture
 *
 * @returns true if a duplicate-location capture is detected
 */
export async function checkDuplicateCoordinates(
  latitude: number,
  longitude: number,
  timestamp: number
): Promise<boolean> {
  const store = useUploadStore.getState();
  const items = store.items;

  if (items.length === 0) {
    return false;
  }

  const DISTANCE_THRESHOLD_METERS = 5;
  const TIME_THRESHOLD_MS = 60 * 1000; // 1 minute

  for (const item of items) {
    const itemLat = item.metadata.latitude;
    const itemLon = item.metadata.longitude;
    const itemTime = item.createdAt;

    // Check time difference
    const timeDiff = Math.abs(timestamp - itemTime);
    if (timeDiff >= TIME_THRESHOLD_MS) {
      continue;
    }

    // Check distance
    const distance = haversineDistance(latitude, longitude, itemLat, itemLon);
    if (distance < DISTANCE_THRESHOLD_METERS) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether the new capture coordinates are identical to ANY previous
 * capture from the same device (regardless of time).
 * This is used to BLOCK captures at exact same location.
 *
 * The user must physically move to a new location before capturing again.
 *
 * @returns true if coordinates match a previous capture within 5m
 */
export function checkSameLocationBlock(
  latitude: number,
  longitude: number
): boolean {
  const store = useUploadStore.getState();
  const items = store.items;

  if (items.length === 0) {
    return false;
  }

  const DISTANCE_THRESHOLD_METERS = 5;

  for (const item of items) {
    const itemLat = item.metadata.latitude;
    const itemLon = item.metadata.longitude;

    const distance = haversineDistance(latitude, longitude, itemLat, itemLon);
    if (distance < DISTANCE_THRESHOLD_METERS) {
      return true;
    }
  }

  return false;
}
