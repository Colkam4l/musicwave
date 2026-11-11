import { useCallback, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useLibraryStore } from "../store/libraryStore";
import { useToastStore } from "../store/toastStore";
import { Song } from "../types/music";

export const useLibrarySync = () => {
  const { setLikedSongs, setRecentPlays, setLoading } = useLibraryStore();

  useEffect(() => {
    let cancelled = false;
    let unlistenRecents: (() => void) | undefined;

    const loadInitial = async () => {
      setLoading(true);
      try {
        const [liked, recents] = await Promise.all([
          invoke<Song[]>("get_liked_songs"),
          invoke<Song[]>("get_recent_plays"),
        ]);
        if (!cancelled) {
          setLikedSongs(liked);
          setRecentPlays(recents);
        }
      } catch (err) {
        console.error("Failed to load library:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitial();

    listen<Song[]>("library://recents-updated", (event) => {
      if (!cancelled && Array.isArray(event.payload)) {
        setRecentPlays(event.payload);
      }
    }).then((unlisten) => {
      if (cancelled) {
        unlisten();
      } else {
        unlistenRecents = unlisten;
      }
    });

    return () => {
      cancelled = true;
      if (unlistenRecents) unlistenRecents();
    };
  }, [setLikedSongs, setRecentPlays, setLoading]);
};

export const useLibrary = () => {
  const { likedSongs, recentPlays, isLoading, setLikedSongs, setRecentPlays } =
    useLibraryStore();

  const likedIds = useMemo(
    () => new Set(likedSongs.map((s) => s.videoId)),
    [likedSongs]
  );

  const isLiked = useCallback(
    (videoId: string) => likedIds.has(videoId),
    [likedIds]
  );

  const toggleLike = useCallback(
    async (song: Song) => {
      const currentlyLiked = likedIds.has(song.videoId);
      try {
        const updated = currentlyLiked
          ? await invoke<Song[]>("unlike_song", { videoId: song.videoId })
          : await invoke<Song[]>("like_song", { song });
        setLikedSongs(updated);
        useToastStore
          .getState()
          .addToast(
            currentlyLiked
              ? `Removed "${song.title}" from Liked Songs`
              : `Added "${song.title}" to Liked Songs`,
            "success",
            2500
          );
      } catch (err) {
        const msg =
          typeof err === "string" ? err : "Failed to update Liked Songs";
        useToastStore.getState().addToast(msg, "error");
      }
    },
    [likedIds, setLikedSongs]
  );

  const refreshLibrary = useCallback(async () => {
    try {
      const [liked, recents] = await Promise.all([
        invoke<Song[]>("get_liked_songs"),
        invoke<Song[]>("get_recent_plays"),
      ]);
      setLikedSongs(liked);
      setRecentPlays(recents);
    } catch (err) {
      console.error("Failed refreshing library:", err);
    }
  }, [setLikedSongs, setRecentPlays]);

  return {
    likedSongs,
    recentPlays,
    isLoading,
    isLiked,
    toggleLike,
    refreshLibrary,
  };
};
