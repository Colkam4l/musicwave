import { create } from "zustand";
import { UserProfile, SyncStatus } from "../types/auth";

export interface AuthState {
  activeProfile: UserProfile | null;
  profiles: UserProfile[];
  syncStatus: SyncStatus;
  isAuthModalOpen: boolean;
  isLoading: boolean;
  setActiveProfile: (profile: UserProfile | null) => void;
  setProfiles: (profiles: UserProfile[]) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setAuthModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  activeProfile: null,
  profiles: [],
  syncStatus: {
    isLinked: false,
    isSyncing: false,
    lastSynced: null,
    totalSyncedTracks: 0,
    totalSyncedPlaylists: 0,
    error: null,
  },
  isAuthModalOpen: false,
  isLoading: false,
  setActiveProfile: (activeProfile) => set({ activeProfile }),
  setProfiles: (profiles) => set({ profiles }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
  setLoading: (isLoading) => set({ isLoading }),
}));

