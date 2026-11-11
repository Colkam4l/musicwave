import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, ListPlus, Play, User } from "lucide-react";
import { Song } from "../types/music";
import { SongList } from "../components/SongList";
import { usePlayer } from "../hooks/usePlayer";
import { useQueueStore } from "../store/queueStore";
import { useToast } from "../components/Toast";

export const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const artistName = decodeURIComponent(id ?? "").trim();

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { playSong } = usePlayer();
  const setQueue = useQueueStore((s) => s.setQueue);
  const { showToast } = useToast();

  useEffect(() => {
    if (!artistName) {
      setSongs([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    invoke<Song[]>("search_songs", { query: artistName })
      .then((results) => {
        if (cancelled) return;
        const lower = artistName.toLowerCase();
        const exactArtistMatches = results.filter((song) =>
          song.artist.toLowerCase().includes(lower)
        );
        setSongs(exactArtistMatches.length > 0 ? exactArtistMatches : results);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          typeof err === "string"
            ? err
            : err instanceof Error
            ? err.message
            : "Failed to load artist songs.";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [artistName]);

  const handleQueueAll = async () => {
    let added = 0;
    let latestQueue: Song[] | null = null;
    for (const song of songs) {
      try {
        latestQueue = await invoke<Song[]>("enqueue_last", { song });
        added += 1;
      } catch (err) {
        const msg =
          typeof err === "string" ? err : "Queue is full (200 songs max).";
        showToast(msg, "warning");
        break;
      }
    }
    if (latestQueue) {
      setQueue(latestQueue);
    }
    if (added > 0) {
      showToast(`Added ${added} tracks by ${artistName} to queue`, "success", 2500);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        width: "100%",
        maxWidth: "960px",
        margin: "0 auto",
        padding: "2rem 1.75rem 4rem 1.75rem",
      }}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.45rem",
          background: "transparent",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          fontSize: "var(--font-size-sm)",
          marginBottom: "1.5rem",
          padding: "0.25rem 0",
        }}
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* Artist Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "1.5rem",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px var(--accent-glow)",
              flexShrink: 0,
            }}
          >
            <User size={28} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              Artist
            </div>
            <h1
              style={{
                fontSize: "var(--font-size-xl)",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {artistName || "Unknown Artist"}
            </h1>
          </div>
        </div>

        {songs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => playSong(songs[0])}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.65rem 1.2rem",
                minHeight: 44,
                borderRadius: "var(--radius-full)",
                border: "none",
                background: "var(--accent-gradient)",
                color: "#ffffff",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 14px var(--accent-glow)",
              }}
            >
              <Play size={15} fill="#ffffff" />
              <span>Play Top</span>
            </button>
            <button
              type="button"
              onClick={handleQueueAll}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.65rem 1.1rem",
                minHeight: 44,
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface-elevated)",
                color: "var(--text-primary)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ListPlus size={16} />
              <span>Queue All</span>
            </button>
          </div>
        )}
      </header>

      <SongList
        songs={songs}
        isLoading={isLoading}
        error={error}
        hasSearched={true}
        query={artistName}
        onSelectSong={(song) => playSong(song)}
        onDismissError={() => setError(null)}
      />
    </div>
  );
};
