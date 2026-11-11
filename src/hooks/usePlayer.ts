import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { usePlayerStore } from "../store/playerStore";
import { useQueueStore } from "../store/queueStore";
import { useToastStore } from "../store/toastStore";
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
  const { setCurrentSong, setIsPlaying, setIsBuffering, setProgress } =
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
          useToastStore
            .getState()
            .addToast(
              "Authentication required. Please set up your credentials in Settings.",
              "warning",
              6000
            );
          setIsBuffering(false);
        }),
        listen<string>("player://error", (event) => {
          if (event.payload) {
            useToastStore.getState().addToast(event.payload, "error", 5000);
          }
        }),
        listen<Song>("player://track-changed", (event) => {
          const nextSong = event.payload;
          const prevSong = usePlayerStore.getState().currentSong;
          if (prevSong && prevSong.videoId !== nextSong.videoId) {
            useQueueStore.getState().pushHistory(prevSong);
          }
          setCurrentSong(nextSong);
          setIsPlaying(true);
          setIsBuffering(true);
          invoke<Song[]>("get_queue")
            .then((q) => useQueueStore.getState().setQueue(q))
            .catch(() => {});
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
  }, [setCurrentSong, setIsPlaying, setIsBuffering, setProgress]);
};

export const usePlayer = () => {
  const {
    currentSong,
    isPlaying,
    isBuffering,
    elapsedSeconds,
    totalSeconds,
    volume,
    setCurrentSong,
    setIsPlaying,
    setIsBuffering,
    setProgress,
    setVolume,
  } = usePlayerStore();

  const playSong = useCallback(
    async (song: Song, options?: { recordHistory?: boolean }) => {
      const recordHistory = options?.recordHistory ?? true;
      const prevSong = usePlayerStore.getState().currentSong;
      if (recordHistory && prevSong && prevSong.videoId !== song.videoId) {
        useQueueStore.getState().pushHistory(prevSong);
      }

      try {
        setCurrentSong(song);
        setIsPlaying(true);
        setIsBuffering(true);
        await invoke("play_song", { videoId: song.videoId, song });
      } catch (err) {
        const msg =
          typeof err === "string"
            ? err
            : err instanceof Error
            ? err.message
            : "Failed to play song";
        console.error("Error playing song:", err);
        useToastStore.getState().addToast(msg, "error");
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
    playSong,
    togglePlayPause,
    seekTo,
    changeVolume,
  };
};
