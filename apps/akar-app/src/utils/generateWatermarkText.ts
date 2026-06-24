import { encodePlusCode } from './plusCode';

export interface WatermarkInput {
  /** Formatted timestamp string (already styled) */
  formattedTimestamp: string;
  /** Decimal latitude */
  latitude: number;
  /** Decimal longitude */
  longitude: number;
  /** GPS accuracy in meters */
  accuracy: number;
  /** Reverse-geocoded short place name (e.g. "Kukana, Maharashtra, India") */
  placeName: string;
  /** Reverse-geocoded full address (e.g. "Kukana, Maharashtra 414604, India") */
  fullAddress: string;
}

/**
 * Builds the multi-line watermark text matching the reference format:
 *
 * Line 1: Place name (city, state, country)
 * Line 2: Plus code, full address with postal code
 * Line 3: Lat / Long with degree symbol (6 decimal places)
 * Line 4: Hindi day, DD/MM/YYYY HH:MM AM/PM GMT +offset
 */
export const generateWatermarkText = (input: WatermarkInput): string => {
  const plusCode = encodePlusCode(input.latitude, input.longitude);

  const line1 = input.placeName;
  const line2 = `${plusCode}, ${input.fullAddress}`;
  const line3 = `Lat ${input.latitude.toFixed(6)}° Long ${input.longitude.toFixed(6)}°`;
  const line4 = input.formattedTimestamp;

  return `${line1}\n${line2}\n${line3}\n${line4}`;
};
