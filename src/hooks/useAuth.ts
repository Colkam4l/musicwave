import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAuthStore } from "../store/authStore";
import { UserProfile } from "../types/auth";

export const useAuth = () => {
  const {
    activeProfile,
    profiles,
    syncStatus,
    isAuthModalOpen,
    isLoading,
    setActiveProfile,
    setProfiles,
    setSyncStatus,
    setAuthModalOpen,
    setLoading,
  } = useAuthStore();

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const [active, list, status] = await Promise.all([
        invoke<UserProfile>("get_active_profile"),
        invoke<UserProfile[]>("list_profiles"),
        invoke<any>("get_sync_status"),
      ]);
      setActiveProfile(active);
      setProfiles(list);
      setSyncStatus(status);
    } catch (err) {
      console.error("[useAuth] Failed loading profile state:", err);
    } finally {
      setLoading(false);
    }
  }, [setActiveProfile, setProfiles, setSyncStatus, setLoading]);

  useEffect(() => {
    loadProfiles();

    let unlistenProfile: (() => void) | undefined;
    let unlistenSync: (() => void) | undefined;

    listen<UserProfile>("auth://profile-updated", (event) => {
      setActiveProfile(event.payload);
      loadProfiles();
    }).then((unsub) => {
      unlistenProfile = unsub;
    });

    listen("sync://status-changed", () => {
      invoke<any>("get_sync_status")
        .then((s) => setSyncStatus(s))
        .catch(console.error);
    }).then((unsub) => {
      unlistenSync = unsub;
    });

    return () => {
      unlistenProfile?.();
      unlistenSync?.();
    };
  }, [loadProfiles, setActiveProfile, setSyncStatus]);

  const createProfile = async (displayName: string, avatarUrl?: string) => {
    setLoading(true);
    try {
      const created = await invoke<UserProfile>("create_profile", {
        displayName,
        avatarUrl: avatarUrl || null,
      });
      await loadProfiles();
      return created;
    } finally {
      setLoading(false);
    }
  };

  const switchProfile = async (profileId: string) => {
    setLoading(true);
    try {
      const switched = await invoke<UserProfile>("switch_profile", {
        profileId,
      });
      await loadProfiles();
      return switched;
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (profileId: string) => {
    setLoading(true);
    try {
      const deleted = await invoke<UserProfile>("delete_profile", {
        profileId,
      });
      await loadProfiles();
      return deleted;
    } finally {
      setLoading(false);
    }
  };

  const linkYoutubeAccount = async (cookie: string) => {
    setLoading(true);
    try {
      const linked = await invoke<UserProfile>("link_youtube_account", {
        cookie,
      });
      setActiveProfile(linked);
      await loadProfiles();
      return linked;
    } finally {
      setLoading(false);
    }
  };

  const disconnectYoutubeAccount = async () => {
    setLoading(true);
    try {
      const updated = await invoke<UserProfile>("disconnect_youtube_account");
      setActiveProfile(updated);
      await loadProfiles();
      return updated;
    } finally {
      setLoading(false);
    }
  };

  return {
    activeProfile,
    profiles,
    syncStatus,
    isAuthModalOpen,
    isLoading,
    openAuthModal: () => setAuthModalOpen(true),
    closeAuthModal: () => setAuthModalOpen(false),
    createProfile,
    switchProfile,
    deleteProfile,
    linkYoutubeAccount,
    disconnectYoutubeAccount,
    reloadProfiles: loadProfiles,
  };
};
