import { create } from "zustand";
import { CacheStats } from "../types/cache";

export interface CacheState {
  stats: CacheStats;
  isDownloading: Record<string, boolean>;
  isOffline: boolean;
  setStats: (stats: CacheStats) => void;
  setDownloading: (videoId: string, downloading: boolean) => void;
  setIsOffline: (offline: boolean) => void;
}

export const useCacheStore = create<CacheState>((set) => ({
  stats: {
    totalBytes: 0,
    trackCount: 0,
    cachedVideoIds: [],
  },
  isDownloading: {},
  isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
  setStats: (stats) => set({ stats }),
  setDownloading: (videoId, downloading) =>
    set((state) => ({
      isDownloading: { ...state.isDownloading, [videoId]: downloading },
    })),
  setIsOffline: (isOffline) => set({ isOffline }),
}));
