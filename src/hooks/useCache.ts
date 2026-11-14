import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useCacheStore } from "../store/cacheStore";
import { CacheStats } from "../types/cache";
import { useToast } from "../components/Toast";

export const useCache = () => {
  const {
    stats,
    isDownloading,
    isOffline,
    setStats,
    setDownloading,
    setIsOffline,
  } = useCacheStore();
  const { showToast } = useToast();

  const refreshCacheStats = useCallback(async () => {
    try {
      const current = await invoke<CacheStats>("get_cache_stats");
      setStats(current);
    } catch (err) {
      console.error("[useCache] Failed fetching cache stats:", err);
    }
  }, [setStats]);

  useEffect(() => {
    refreshCacheStats();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshCacheStats, setIsOffline]);

  const downloadTrack = async (videoId: string, title?: string) => {
    if (isDownloading[videoId]) return;
    setDownloading(videoId, true);
    try {
      await invoke<string>("download_track_for_offline", { videoId });
      showToast(
        `Downloaded "${title || videoId}" for offline playback!`,
        "success"
      );
      await refreshCacheStats();
    } catch (err) {
      showToast(`Failed to download track: ${String(err)}`, "error");
    } finally {
      setDownloading(videoId, false);
    }
  };

  const clearCache = async () => {
    try {
      await invoke("clear_cache");
      showToast("Offline track cache cleared.", "info");
      await refreshCacheStats();
    } catch (err) {
      showToast(`Failed clearing cache: ${String(err)}`, "error");
    }
  };

  const isTrackCached = useCallback(
    (videoId: string) => {
      return stats.cachedVideoIds.includes(videoId);
    },
    [stats.cachedVideoIds]
  );

  return {
    stats,
    isDownloading,
    isOffline,
    isTrackCached,
    downloadTrack,
    clearCache,
    refreshCacheStats,
  };
};

