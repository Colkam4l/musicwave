import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useQueueStore } from "../store/queueStore";
import { usePlayer } from "./usePlayer";
import { useToastStore } from "../store/toastStore";
import { Song } from "../types/music";

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { playSong } = usePlayer();
  const setQueue = useQueueStore((s) => s.setQueue);

  const fetchRecommendations = useCallback(async (videoId: string) => {
    setIsLoading(true);
    try {
      const recs = await invoke<Song[]>("get_watch_playlist", { videoId });
      setRecommendations(recs);
      return recs;
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startRadio = useCallback(
    async (song: Song) => {
      try {
        await playSong(song);
        useToastStore
          .getState()
          .addToast(`Started radio based on "${song.title}"`, "info", 2500);
        const recs = await invoke<Song[]>("get_watch_playlist", {
          videoId: song.videoId,
        });
        const queueTracks = recs.filter((r) => r.videoId !== song.videoId);
        await invoke("clear_queue");
        for (const track of queueTracks.slice(0, 20)) {
          await invoke("enqueue_last", { song: track });
        }
        const updated = await invoke<Song[]>("get_queue");
        setQueue(updated);
      } catch (err) {
        console.error("Failed to start radio:", err);
        useToastStore
          .getState()
          .addToast("Failed to start song radio", "error");
      }
    },
    [playSong, setQueue]
  );

  return {
    recommendations,
    isLoading,
    fetchRecommendations,
    startRadio,
  };
};

