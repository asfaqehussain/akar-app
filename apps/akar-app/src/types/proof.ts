export interface Proof {
  proofId: string;
  imageUrl: string;
  storagePath: string;
  capturedAt: string;
  uploadedAt: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  accuracyTier: 'good' | 'warning' | 'poor';
  hash: string;
  deviceId: string;
  deviceModel: string;
  appVersion: string;
  mockLocation: boolean;
  isRooted: boolean;
  duplicateProof: boolean;
  city: string;
  state: string;
  country: string;
}
