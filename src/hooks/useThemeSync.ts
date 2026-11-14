import { useEffect } from "react";
import { usePlayer } from "./usePlayer";
import { useThemeStore } from "../store/themeStore";

export const useThemeSync = () => {
  const { currentSong } = usePlayer();
  const { updateFromArtwork, themeMode } = useThemeStore();

  useEffect(() => {
    if (themeMode === "dynamic" && currentSong?.thumbnailUrl) {
      updateFromArtwork(currentSong.thumbnailUrl);
    }
  }, [currentSong?.thumbnailUrl, themeMode, updateFromArtwork]);
};
