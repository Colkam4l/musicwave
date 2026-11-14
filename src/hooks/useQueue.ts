import { useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useQueueStore } from "../store/queueStore";
import { usePlayerStore } from "../store/playerStore";
import { useToastStore } from "../store/toastStore";
import { usePlayer } from "./usePlayer";
import { Song } from "../types/music";

const formatInvokeError = (err: unknown, fallback: string) =>
  typeof err === "string" ? err : err instanceof Error ? err.message : fallback;

export const useQueueSync = () => {
  const setQueue = useQueueStore((s) => s.setQueue);

  useEffect(() => {
    invoke<Song[]>("get_queue")
      .then((q) => setQueue(q))
      .catch((err) => console.error("Failed to fetch initial queue:", err));
  }, [setQueue]);
};

export const useQueue = () => {
  const {
    queue,
    history,
    isQueueOpen,
    setQueue,
    popHistory,
    setQueueOpen,
    toggleQueueOpen,
  } = useQueueStore();
  const { currentSong, elapsedSeconds, playSong, seekTo } = usePlayer();

  const addToQueue = useCallback(
    async (song: Song) => {
      try {
        const updated = await invoke<Song[]>("enqueue_last", { song });
        setQueue(updated);
        useToastStore
          .getState()
          .addToast(`Added "${song.title}" to queue`, "success", 2500);
      } catch (err) {
        const msg = formatInvokeError(err, "Failed to add song to queue");
        useToastStore
          .getState()
          .addToast(msg, msg.includes("Queue is full") ? "warning" : "error");
      }
    },
    [setQueue]
  );

  const playNext = useCallback(
    async (song: Song) => {
      try {
        const updated = await invoke<Song[]>("enqueue_next", { song });
        setQueue(updated);
        useToastStore
          .getState()
          .addToast(`Playing "${song.title}" next`, "success", 2500);
      } catch (err) {
        const msg = formatInvokeError(err, "Failed to queue song next");
        useToastStore
          .getState()
          .addToast(msg, msg.includes("Queue is full") ? "warning" : "error");
      }
    },
    [setQueue]
  );

  const removeFromQueue = useCallback(
    async (index: number) => {
      try {
        const updated = await invoke<Song[]>("remove_from_queue", { index });
        setQueue(updated);
      } catch (err) {
        console.error("Failed removing queued item:", err);
      }
    },
    [setQueue]
  );

  const reorderQueue = useCallback(
    async (from: number, to: number) => {
      try {
        const updated = await invoke<Song[]>("reorder_queue", { from, to });
        setQueue(updated);
      } catch (err) {
        console.error("Failed reordering queue:", err);
      }
    },
    [setQueue]
  );

  const clearQueue = useCallback(async () => {
    try {
      const updated = await invoke<Song[]>("clear_queue");
      setQueue(updated);
    } catch (err) {
      console.error("Failed clearing queue:", err);
    }
  }, [setQueue]);

  const shuffleQueue = useCallback(async () => {
    try {
      const updated = await invoke<Song[]>("shuffle_queue");
      setQueue(updated);
      usePlayerStore.getState().setIsShuffled(true);
      useToastStore.getState().addToast("Queue shuffled", "info", 2000);
    } catch (err) {
      console.error("Failed shuffling queue:", err);
    }
  }, [setQueue]);

  const skipNext = useCallback(async () => {
    try {
      const nextSong = await invoke<Song | null>("dequeue_front");
      const updated = await invoke<Song[]>("get_queue");
      setQueue(updated);
      if (nextSong) {
        await playSong(nextSong);
      }
    } catch (err) {
      console.error("Failed skipping next:", err);
    }
  }, [setQueue, playSong]);

  const skipPrev = useCallback(async () => {
    if (!currentSong) return;

    if (elapsedSeconds > 3) {
      await seekTo(0);
      return;
    }

    const prevSong = popHistory();
    if (!prevSong) {
      await seekTo(0);
      return;
    }

    const active = usePlayerStore.getState().currentSong;
    if (active && active.videoId !== prevSong.videoId) {
      try {
        const updated = await invoke<Song[]>("enqueue_next", { song: active });
        setQueue(updated);
      } catch {
        // Ignore if queue is at max capacity.
      }
    }

    await playSong(prevSong, { recordHistory: false });
  }, [currentSong, elapsedSeconds, seekTo, popHistory, setQueue, playSong]);

  return {
    queue,
    history,
    isQueueOpen,
    canSkipNext: queue.length > 0,
    canSkipPrev: Boolean(currentSong) && (history.length > 0 || elapsedSeconds > 3),
    setQueueOpen,
    toggleQueueOpen,
    addToQueue,
    playNext,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    shuffleQueue,
    skipNext,
    skipPrev,
  };
};

