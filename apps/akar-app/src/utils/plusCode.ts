/**
 * Generates an Open Location Code (Plus Code) from latitude and longitude.
 * Based on Google's Open Location Code specification.
 * https://github.com/google/open-location-code
 */

const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
const ENCODING_BASE = CODE_ALPHABET.length; // 20
const PAIR_CODE_LENGTH = 10;
const SEPARATOR = '+';
const SEPARATOR_POSITION = 8;
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;

/**
 * Encode a latitude/longitude into a Plus Code string.
 *
 * @param latitude Decimal degrees latitude
 * @param longitude Decimal degrees longitude
 * @param codeLength Desired code length (default 10 for ~14m precision)
 * @returns Plus Code string (e.g. "C3MF+8R9")
 */
export function encodePlusCode(
  latitude: number,
  longitude: number,
  codeLength: number = PAIR_CODE_LENGTH
): string {
  // Clamp latitude
  let lat = Math.min(Math.max(latitude, -LATITUDE_MAX), LATITUDE_MAX);
  let lng = longitude;

  // Normalize longitude
  while (lng < -LONGITUDE_MAX) lng += 360;
  while (lng >= LONGITUDE_MAX) lng += 360;

  // Shift values to positive ranges
  lat += LATITUDE_MAX;
  lng += LONGITUDE_MAX;

  let code = '';
  let latDigit = 0;
  let lngDigit = 0;
  let latPlaceValue = ENCODING_BASE * ENCODING_BASE * ENCODING_BASE * ENCODING_BASE; // 20^4
  let lngPlaceValue = ENCODING_BASE * ENCODING_BASE * ENCODING_BASE * ENCODING_BASE;

  // Pair encoding for the first 10 digits (5 pairs of lat/lng)
  for (let i = 0; i < PAIR_CODE_LENGTH; i += 2) {
    // Latitude digit
    latDigit = Math.floor(lat / latPlaceValue);
    lat -= latDigit * latPlaceValue;
    latPlaceValue /= ENCODING_BASE;

    // Longitude digit
    lngDigit = Math.floor(lng / lngPlaceValue);
    lng -= lngDigit * lngPlaceValue;
    lngPlaceValue /= ENCODING_BASE;

    code += CODE_ALPHABET.charAt(latDigit);
    code += CODE_ALPHABET.charAt(lngDigit);

    if (code.length === SEPARATOR_POSITION) {
      code += SEPARATOR;
    }
  }

  // Trim to requested length (plus separator)
  if (codeLength < SEPARATOR_POSITION) {
    code = code.substring(0, codeLength) + SEPARATOR;
  }

  return code;
}
