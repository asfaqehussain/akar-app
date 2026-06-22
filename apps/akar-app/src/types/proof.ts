export interface Proof {
  proofId: string;
  imageUrl: string;
  r2Key: string;
  capturedAt: string;
  uploadedAt: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  hash: string;
  deviceId: string;
  deviceModel: string;
  appVersion: string;
  mockLocation: boolean;
}
