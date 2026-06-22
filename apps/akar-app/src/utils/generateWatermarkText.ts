export const generateWatermarkText = (
  formattedTimestamp: string,
  latitude: number,
  longitude: number,
  accuracy: number
): string => {
  return `${formattedTimestamp}\nLat: ${latitude.toFixed(4)}\nLng: ${longitude.toFixed(4)}\nAccuracy: ${Math.round(accuracy)}m`;
};
