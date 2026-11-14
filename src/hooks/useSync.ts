import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../store/authStore";
import { SyncSummary } from "../types/auth";
import { useToast } from "../components/Toast";

export const useSync = () => {
  const { syncStatus, setSyncStatus } = useAuthStore();
  const { showToast } = useToast();

  const syncLibrary = useCallback(async () => {
    setSyncStatus({ ...syncStatus, isSyncing: true, error: null });
    try {
      const summary = await invoke<SyncSummary>("sync_library");
      showToast(
        `Synced ${summary.likedSongsSynced} tracks and ${summary.playlistsSynced} playlists from YouTube Music!`,
        "success"
      );
      return summary;
    } catch (err) {
      const errorMsg = String(err);
      setSyncStatus({ ...syncStatus, isSyncing: false, error: errorMsg });
      showToast(`Library sync failed: ${errorMsg}`, "error");
      throw err;
    }
  }, [syncStatus, setSyncStatus, showToast]);

  return {
    syncStatus,
    isSyncing: syncStatus.isSyncing,
    isLinked: syncStatus.isLinked,
    lastSynced: syncStatus.lastSynced,
    syncLibrary,
  };
};
