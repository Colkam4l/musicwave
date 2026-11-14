import { useCallback, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useLibraryStore } from "../store/libraryStore";
import { useToastStore } from "../store/toastStore";
import { Song, UserPlaylist } from "../types/music";

export const useLibrarySync = () => {
  const { setLikedSongs, setRecentPlays, setPlaylists, setLoading } =
    useLibraryStore();

  useEffect(() => {
    let cancelled = false;
    let unlistenRecents: (() => void) | undefined;

    const loadInitial = async () => {
      setLoading(true);
      try {
        const [liked, recents, playlists] = await Promise.all([
          invoke<Song[]>("get_liked_songs"),
          invoke<Song[]>("get_recent_plays"),
          invoke<UserPlaylist[]>("get_playlists").catch(() => []),
        ]);
        if (!cancelled) {
          setLikedSongs(liked);
          setRecentPlays(recents);
          setPlaylists(playlists);
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
  }, [setLikedSongs, setRecentPlays, setPlaylists, setLoading]);
};

export const useLibrary = () => {
  const {
    likedSongs,
    recentPlays,
    playlists,
    isLoading,
    setLikedSongs,
    setRecentPlays,
    setPlaylists,
  } = useLibraryStore();

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
      const [liked, recents, pls] = await Promise.all([
        invoke<Song[]>("get_liked_songs"),
        invoke<Song[]>("get_recent_plays"),
        invoke<UserPlaylist[]>("get_playlists").catch(() => []),
      ]);
      setLikedSongs(liked);
      setRecentPlays(recents);
      setPlaylists(pls);
    } catch (err) {
      console.error("Failed refreshing library:", err);
    }
  }, [setLikedSongs, setRecentPlays, setPlaylists]);

  const createPlaylist = useCallback(
    async (name: string, description?: string) => {
      try {
        const created = await invoke<UserPlaylist>("create_playlist", {
          name,
          description: description || null,
        });
        setPlaylists([...playlists, created]);
        useToastStore
          .getState()
          .addToast(`Created playlist "${name}"`, "success", 2500);
        return created;
      } catch (err) {
        const msg =
          typeof err === "string" ? err : "Failed to create playlist";
        useToastStore.getState().addToast(msg, "error");
        throw err;
      }
    },
    [playlists, setPlaylists]
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      try {
        const remaining = await invoke<UserPlaylist[]>("delete_playlist", {
          playlistId,
        });
        setPlaylists(remaining);
        useToastStore
          .getState()
          .addToast("Playlist deleted", "success", 2500);
      } catch (err) {
        const msg =
          typeof err === "string" ? err : "Failed to delete playlist";
        useToastStore.getState().addToast(msg, "error");
      }
    },
    [setPlaylists]
  );

  const renamePlaylist = useCallback(
    async (playlistId: string, name: string, description?: string) => {
      try {
        const updated = await invoke<UserPlaylist>("rename_playlist", {
          playlistId,
          name,
          description: description || null,
        });
        setPlaylists(
          playlists.map((p) => (p.id === playlistId ? updated : p))
        );
        useToastStore
          .getState()
          .addToast("Playlist updated", "success", 2500);
        return updated;
      } catch (err) {
        const msg =
          typeof err === "string" ? err : "Failed to update playlist";
        useToastStore.getState().addToast(msg, "error");
        throw err;
      }
    },
    [playlists, setPlaylists]
  );

  const addToPlaylist = useCallback(
    async (playlistId: string, song: Song) => {
      try {
        const updated = await invoke<UserPlaylist>("add_to_playlist", {
          playlistId,
          song,
        });
        setPlaylists(
          playlists.map((p) => (p.id === playlistId ? updated : p))
        );
        useToastStore
          .getState()
          .addToast(
            `Added "${song.title}" to "${updated.name}"`,
            "success",
            2500
          );
      } catch (err) {
        const msg =
          typeof err === "string" ? err : "Failed to add song to playlist";
        useToastStore.getState().addToast(msg, "error");
      }
    },
    [playlists, setPlaylists]
  );

  const removeFromPlaylist = useCallback(
    async (playlistId: string, videoId: string) => {
      try {
        const updated = await invoke<UserPlaylist>("remove_from_playlist", {
          playlistId,
          videoId,
        });
        setPlaylists(
          playlists.map((p) => (p.id === playlistId ? updated : p))
        );
        useToastStore
          .getState()
          .addToast("Removed song from playlist", "success", 2500);
      } catch (err) {
        const msg =
          typeof err === "string"
            ? err
            : "Failed to remove song from playlist";
        useToastStore.getState().addToast(msg, "error");
      }
    },
    [playlists, setPlaylists]
  );

  return {
    likedSongs,
    recentPlays,
    playlists,
    isLoading,
    isLiked,
    toggleLike,
    refreshLibrary,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addToPlaylist,
    removeFromPlaylist,
  };
};

