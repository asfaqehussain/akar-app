import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProofMetadata } from '../../services/upload';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed';

export interface UploadItem {
  id: string; // The proofId
  localUri: string; // File path to the watermarked image
  metadata: ProofMetadata;
  status: UploadStatus;
  createdAt: number;
  error?: string;
  serverUrl?: string; // Filled when completed
}

interface UploadStore {
  items: UploadItem[];
  // Actions
  addUpload: (item: UploadItem) => void;
  updateStatus: (id: string, status: UploadStatus, updates?: Partial<UploadItem>) => void;
  removeUpload: (id: string) => void;
  clearHistory: () => void;
}

export const useUploadStore = create<UploadStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addUpload: (item) => {
        set({ items: [item, ...get().items] });
      },
      
      updateStatus: (id, status, updates) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, status, ...updates } : item
          ),
        });
      },
      
      removeUpload: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      
      clearHistory: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'akar-upload-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
