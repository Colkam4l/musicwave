import { create } from "zustand";
import {
  M3TonalPalette,
  PRESET_THEMES,
  PresetThemeName,
  extractPaletteFromImageUrl,
} from "../theme/palette";
import { applyM3Theme } from "../theme/dynamicTheme";

const SAVED_PRESET_KEY = "musicwave_theme_preset";
const SAVED_MODE_KEY = "musicwave_theme_mode";
const SAVED_MOTION_KEY = "musicwave_reduced_motion";

interface ThemeState {
  themeMode: "dynamic" | "preset";
  selectedPreset: PresetThemeName;
  currentPalette: M3TonalPalette;
  reducedMotion: boolean;
  setThemeMode: (mode: "dynamic" | "preset") => void;
  setSelectedPreset: (preset: PresetThemeName) => void;
  updateFromArtwork: (imageUrl: string | null) => Promise<void>;
  setReducedMotion: (reduced: boolean) => void;
}

const initialPreset: PresetThemeName =
  (typeof localStorage !== "undefined" &&
    (localStorage.getItem(SAVED_PRESET_KEY) as PresetThemeName)) ||
  "violet";

const initialMode: "dynamic" | "preset" =
  (typeof localStorage !== "undefined" &&
    (localStorage.getItem(SAVED_MODE_KEY) as "dynamic" | "preset")) ||
  "dynamic";

const initialPalette = PRESET_THEMES[initialPreset] || PRESET_THEMES.violet;
if (typeof document !== "undefined") {
  applyM3Theme(initialPalette);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: initialMode,
  selectedPreset: initialPreset,
  currentPalette: initialPalette,
  reducedMotion:
    typeof localStorage !== "undefined"
      ? localStorage.getItem(SAVED_MOTION_KEY) === "true"
      : false,

  setThemeMode: (mode) => {
    localStorage.setItem(SAVED_MODE_KEY, mode);
    set({ themeMode: mode });
    if (mode === "preset") {
      const p = PRESET_THEMES[get().selectedPreset];
      applyM3Theme(p);
      set({ currentPalette: p });
    }
  },

  setSelectedPreset: (preset) => {
    localStorage.setItem(SAVED_PRESET_KEY, preset);
    const p = PRESET_THEMES[preset] || PRESET_THEMES.violet;
    applyM3Theme(p);
    set({ selectedPreset: preset, currentPalette: p });
  },

  updateFromArtwork: async (imageUrl) => {
    const { themeMode } = get();
    if (themeMode !== "dynamic" || !imageUrl) return;

    try {
      const palette = await extractPaletteFromImageUrl(imageUrl);
      applyM3Theme(palette);
      set({ currentPalette: palette });
    } catch (err) {
      console.warn("[themeStore] Dynamic theme extraction failed:", err);
    }
  },

  setReducedMotion: (reduced) => {
    localStorage.setItem(SAVED_MOTION_KEY, String(reduced));
    set({ reducedMotion: reduced });
  },
}));
