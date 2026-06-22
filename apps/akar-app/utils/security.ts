import * as Crypto from 'expo-crypto';
import DeviceInfo from 'react-native-device-info';

/**
 * Converts an ArrayBuffer to a HEX string.
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes the SHA-256 hash of the provided ArrayBuffer.
 * 
 * @param buffer ArrayBuffer containing file data
 * @returns The SHA-256 hex digest string
 */
export async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
  try {
    const hashBuffer = await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA256,
      new Uint8Array(buffer)
    );
    return arrayBufferToHex(hashBuffer);
  } catch (error) {
    console.error('Failed to compute hash:', error);
    throw new Error('Hash calculation failed.');
  }
}

/**
 * Gathers device metadata and checks if the device is rooted or jailbroken.
 */
export async function checkDeviceSecurity() {
  try {
    const isRooted = await DeviceInfo.isEmulator();
    const deviceName = await DeviceInfo.getDeviceName();
    const brand = DeviceInfo.getBrand();
    const model = DeviceInfo.getModel();
    const systemVersion = DeviceInfo.getSystemVersion();

    return {
      isRooted,
      deviceName,
      deviceModel: `${brand} ${model}`,
      osVersion: systemVersion,
    };
  } catch (error) {
    console.error('Failed to retrieve device security info:', error);
    return {
      isRooted: false,
      deviceName: 'Unknown',
      deviceModel: 'Unknown Device',
      osVersion: 'Unknown',
    };
  }
}
