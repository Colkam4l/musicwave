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

export const usePlayerEvents = () => {
  const { setIsPlaying, setIsBuffering, setProgress, setAuthRequiredToast } =
    usePlayerStore();

  useEffect(() => {
    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    const setupListeners = async () => {
      const listeners = await Promise.all([
        listen<ProgressPayload>("player://progress", (event) => {
          const payload = event.payload;
          const elapsed = payload.elapsed_seconds ?? payload.elapsedSeconds ?? 0;
          const total = payload.total_seconds ?? payload.totalSeconds ?? 0;
          const playing = payload.is_playing ?? payload.isPlaying;

          if (typeof playing === "boolean") {
            setIsPlaying(playing);
            if (playing) {
              setIsBuffering(false);
            }
          }
          if (elapsed > 0) {
            setIsBuffering(false);
          }
          setProgress(elapsed, total);
        }),
        listen("player://ended", () => {
          setIsPlaying(false);
          setIsBuffering(false);
        }),
        listen("player://auth-required", () => {
          setAuthRequiredToast(true);
          setIsBuffering(false);
        }),
      ]);

      if (cancelled) {
        listeners.forEach((unlisten) => unlisten());
        return;
      }
      unlisteners.push(...listeners);
    };

    setupListeners();

    return () => {
      cancelled = true;
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [setIsPlaying, setIsBuffering, setProgress, setAuthRequiredToast]);
};

export const usePlayer = () => {
  const {
    currentSong,
    isPlaying,
    isBuffering,
    elapsedSeconds,
    totalSeconds,
    volume,
    authRequiredToast,
    setCurrentSong,
    setIsPlaying,
    setIsBuffering,
    setProgress,
    setVolume,
    setAuthRequiredToast,
  } = usePlayerStore();

  const playSong = useCallback(
    async (song: Song) => {
      try {
        setCurrentSong(song);
        setIsPlaying(true);
        setIsBuffering(true);
        await invoke("play_song", { videoId: song.videoId });
      } catch (err) {
        console.error("Error playing song:", err);
        // Only reset playback indicators if another song hasn't superseded this request.
        if (usePlayerStore.getState().currentSong?.videoId === song.videoId) {
          setIsPlaying(false);
          setIsBuffering(false);
        }
      }
    },
    [setCurrentSong, setIsPlaying, setIsBuffering]
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
    isBuffering,
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
