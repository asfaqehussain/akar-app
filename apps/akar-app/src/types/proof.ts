export interface Proof {
  proofId: string;
  imageUrl: string;
  storagePath: string;
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
  city: string;
  state: string;
  country: string;
}
