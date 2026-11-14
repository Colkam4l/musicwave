import { create } from "zustand";
import { Song } from "../types/music";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuState {
  isOpen: boolean;
  position: ContextMenuPosition;
  song: Song | null;
  openContextMenu: (position: ContextMenuPosition, song: Song) => void;
  closeContextMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  position: { x: 0, y: 0 },
  song: null,
  openContextMenu: (position, song) => set({ isOpen: true, position, song }),
  closeContextMenu: () => set({ isOpen: false, song: null }),
}));
