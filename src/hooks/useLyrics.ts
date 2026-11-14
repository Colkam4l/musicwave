import { useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePlayerStore } from "../store/playerStore";
import { LyricsResponse } from "../types/music";

export const useLyrics = () => {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const elapsedSeconds = usePlayerStore((s) => s.elapsedSeconds);
  const currentLyrics = usePlayerStore((s) => s.currentLyrics);
  const isLyricsLoading = usePlayerStore((s) => s.isLyricsLoading);
  const setCurrentLyrics = usePlayerStore((s) => s.setCurrentLyrics);
  const setIsLyricsLoading = usePlayerStore((s) => s.setIsLyricsLoading);

  useEffect(() => {
    if (!currentSong) {
      setCurrentLyrics(null);
      return;
    }

    let cancelled = false;
    setIsLyricsLoading(true);

    invoke<LyricsResponse>("get_lyrics", {
      videoId: currentSong.videoId,
      title: currentSong.title,
      artist: currentSong.artist,
      duration: currentSong.durationSeconds ?? null,
    })
      .then((lyrics) => {
        if (!cancelled) {
          setCurrentLyrics(lyrics);
          setIsLyricsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load lyrics:", err);
        if (!cancelled) {
          setCurrentLyrics(null);
          setIsLyricsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentSong?.videoId, setCurrentLyrics, setIsLyricsLoading]);

  // Determine active lyric index
  const activeLyricIndex = useMemo(() => {
    if (!currentLyrics?.syncedLyrics || currentLyrics.syncedLyrics.length === 0) {
      return -1;
    }
    const synced = currentLyrics.syncedLyrics;
    let index = -1;
    for (let i = 0; i < synced.length; i++) {
      if (elapsedSeconds >= synced[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [currentLyrics?.syncedLyrics, elapsedSeconds]);

  return {
    lyrics: currentLyrics,
    isLoading: isLyricsLoading,
    activeLyricIndex,
    hasSyncedLyrics: Boolean(currentLyrics?.syncedLyrics?.length),
    hasPlainLyrics: Boolean(currentLyrics?.plainLyrics),
  };
};
