import { create } from "zustand";
import { Song } from "../types/music";

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  isBuffering: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  volume: number; // 0.0–1.0
  authRequiredToast: boolean;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsBuffering: (isBuffering: boolean) => void;
  setProgress: (elapsedSeconds: number, totalSeconds: number) => void;
  setVolume: (volume: number) => void;
  setAuthRequiredToast: (show: boolean) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  isPlaying: false,
  isBuffering: false,
  elapsedSeconds: 0,
  totalSeconds: 0,
  volume: 0.8,
  authRequiredToast: false,
  setCurrentSong: (song) =>
    set({
      currentSong: song,
      elapsedSeconds: 0,
      totalSeconds: song?.durationSeconds ?? 0,
    }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setProgress: (elapsedSeconds, totalSeconds) =>
    set((state) => ({
      elapsedSeconds,
      totalSeconds: totalSeconds > 0 ? totalSeconds : state.totalSeconds,
    })),
  setVolume: (volume) => set({ volume }),
  setAuthRequiredToast: (show) => set({ authRequiredToast: show }),
  reset: () =>
    set({
      currentSong: null,
      isPlaying: false,
      elapsedSeconds: 0,
      totalSeconds: 0,
    }),
}));
