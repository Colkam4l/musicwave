import { create } from "zustand";
import { Song } from "../types/music";

export interface LibraryState {
  likedSongs: Song[];
  recentPlays: Song[];
  isLoading: boolean;
  setLikedSongs: (songs: Song[]) => void;
  setRecentPlays: (songs: Song[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  likedSongs: [],
  recentPlays: [],
  isLoading: false,
  setLikedSongs: (likedSongs) => set({ likedSongs }),
  setRecentPlays: (recentPlays) => set({ recentPlays }),
  setLoading: (isLoading) => set({ isLoading }),
}));
