import { create } from "zustand";
import { Song } from "../types/music";

const MAX_HISTORY_LEN = 50;

export interface QueueState {
  queue: Song[];
  history: Song[];
  isQueueOpen: boolean;
  setQueue: (queue: Song[]) => void;
  pushHistory: (song: Song) => void;
  popHistory: () => Song | undefined;
  setQueueOpen: (open: boolean) => void;
  toggleQueueOpen: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  history: [],
  isQueueOpen: false,
  setQueue: (queue) => set({ queue }),
  pushHistory: (song) =>
    set((state) => {
      const last = state.history[state.history.length - 1];
      if (last?.videoId === song.videoId) {
        return state;
      }
      return {
        history: [...state.history.slice(-(MAX_HISTORY_LEN - 1)), song],
      };
    }),
  popHistory: () => {
    const current = get().history;
    if (current.length === 0) return undefined;
    const prev = current[current.length - 1];
    set({ history: current.slice(0, -1) });
    return prev;
  },
  setQueueOpen: (isQueueOpen) => set({ isQueueOpen }),
  toggleQueueOpen: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
}));

