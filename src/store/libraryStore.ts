import { create } from "zustand";
import { Song, UserPlaylist } from "../types/music";

export interface LibraryState {
  likedSongs: Song[];
  recentPlays: Song[];
  playlists: UserPlaylist[];
  isLoading: boolean;
  setLikedSongs: (songs: Song[]) => void;
  setRecentPlays: (songs: Song[]) => void;
  setPlaylists: (playlists: UserPlaylist[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  likedSongs: [],
  recentPlays: [],
  playlists: [],
  isLoading: false,
  setLikedSongs: (likedSongs) => set({ likedSongs }),
  setRecentPlays: (recentPlays) => set({ recentPlays }),
  setPlaylists: (playlists) => set({ playlists }),
  setLoading: (isLoading) => set({ isLoading }),
}));

