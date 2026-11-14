import { create } from "zustand";
import { LyricsResponse, RepeatMode, Song } from "../types/music";

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  isBuffering: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  volume: number; // 0.0–1.0
  authRequiredToast: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isAutoQueueEnabled: boolean;
  isNowPlayingOpen: boolean;
  currentLyrics: LyricsResponse | null;
  isLyricsLoading: boolean;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsBuffering: (isBuffering: boolean) => void;
  setProgress: (elapsedSeconds: number, totalSeconds: number) => void;
  setVolume: (volume: number) => void;
  setAuthRequiredToast: (show: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  setIsShuffled: (shuffled: boolean) => void;
  setIsAutoQueueEnabled: (enabled: boolean) => void;
  setIsNowPlayingOpen: (open: boolean) => void;
  setCurrentLyrics: (lyrics: LyricsResponse | null) => void;
  setIsLyricsLoading: (loading: boolean) => void;
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
  repeatMode: "off",
  isShuffled: false,
  isAutoQueueEnabled: true,
  isNowPlayingOpen: false,
  currentLyrics: null,
  isLyricsLoading: false,
  setCurrentSong: (song) =>
    set({
      currentSong: song,
      elapsedSeconds: 0,
      totalSeconds: song?.durationSeconds ?? 0,
      currentLyrics: null,
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
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  cycleRepeatMode: () =>
    set((state) => {
      const next: RepeatMode =
        state.repeatMode === "off"
          ? "all"
          : state.repeatMode === "all"
            ? "one"
            : "off";
      return { repeatMode: next };
    }),
  setIsShuffled: (shuffled) => set({ isShuffled: shuffled }),
  setIsAutoQueueEnabled: (enabled) => set({ isAutoQueueEnabled: enabled }),
  setIsNowPlayingOpen: (open) => set({ isNowPlayingOpen: open }),
  setCurrentLyrics: (lyrics) => set({ currentLyrics: lyrics }),
  setIsLyricsLoading: (loading) => set({ isLyricsLoading: loading }),
  reset: () =>
    set({
      currentSong: null,
      isPlaying: false,
      elapsedSeconds: 0,
      totalSeconds: 0,
      currentLyrics: null,
    }),
}));
