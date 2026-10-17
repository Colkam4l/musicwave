import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { usePlayerStore } from "../store/playerStore";
import { Song } from "../types/music";

interface ProgressPayload {
  elapsed_seconds?: number;
  elapsedSeconds?: number;
  total_seconds?: number;
  totalSeconds?: number;
  is_playing?: boolean;
  isPlaying?: boolean;
}

export const usePlayer = () => {
  const {
    currentSong,
    isPlaying,
    elapsedSeconds,
    totalSeconds,
    volume,
    authRequiredToast,
    setCurrentSong,
    setIsPlaying,
    setProgress,
    setVolume,
    setAuthRequiredToast,
  } = usePlayerStore();

  useEffect(() => {
    let unlistenProgress: (() => void) | undefined;
    let unlistenEnded: (() => void) | undefined;
    let unlistenAuthRequired: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenProgress = await listen<ProgressPayload>("player://progress", (event) => {
        const payload = event.payload;
        const elapsed = payload.elapsed_seconds ?? payload.elapsedSeconds ?? 0;
        const total = payload.total_seconds ?? payload.totalSeconds ?? 0;
        const playing = payload.is_playing ?? payload.isPlaying;

        if (typeof playing === "boolean") {
          setIsPlaying(playing);
        }
        setProgress(elapsed, total);
      });

      unlistenEnded = await listen("player://ended", () => {
        setIsPlaying(false);
      });

      unlistenAuthRequired = await listen("player://auth-required", () => {
        setAuthRequiredToast(true);
      });
    };

    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenEnded) unlistenEnded();
      if (unlistenAuthRequired) unlistenAuthRequired();
    };
  }, [setIsPlaying, setProgress, setAuthRequiredToast]);

  const playSong = useCallback(
    async (song: Song) => {
      try {
        setCurrentSong(song);
        setIsPlaying(true);
        await invoke("play_song", { videoId: song.videoId });
      } catch (err) {
        console.error("Error playing song:", err);
        // Ensure UI doesn't claim it's playing if an error occurred
        setIsPlaying(false);
      }
    },
    [setCurrentSong, setIsPlaying]
  );

  const togglePlayPause = useCallback(async () => {
    if (!currentSong) return;

    try {
      if (isPlaying) {
        await invoke("pause_playback");
        setIsPlaying(false);
      } else {
        await invoke("resume_playback");
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Error toggling playback:", err);
    }
  }, [currentSong, isPlaying, setIsPlaying]);

  const seekTo = useCallback(
    async (positionSeconds: number) => {
      try {
        // Optimistically update progress in UI
        setProgress(positionSeconds, totalSeconds);
        await invoke("seek_to", { positionSeconds });
      } catch (err) {
        console.error("Error seeking:", err);
      }
    },
    [setProgress, totalSeconds]
  );

  const changeVolume = useCallback(
    async (newVolume: number) => {
      try {
        setVolume(newVolume);
        await invoke("set_volume", { volume: newVolume });
      } catch (err) {
        console.error("Error changing volume:", err);
      }
    },
    [setVolume]
  );

  return {
    currentSong,
    isPlaying,
    elapsedSeconds,
    totalSeconds,
    volume,
    authRequiredToast,
    setAuthRequiredToast,
    playSong,
    togglePlayPause,
    seekTo,
    changeVolume,
  };
};
