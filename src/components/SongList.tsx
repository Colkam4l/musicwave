import React from "react";
import { AlertCircle, Music2, SearchX } from "lucide-react";
import { Song } from "../types/music";
import { SongCard } from "./SongCard";
import { Spinner } from "./Spinner";

interface SongListProps {
  songs: Song[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  query: string;
  onSelectSong?: (song: Song) => void;
  onDismissError?: () => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  isLoading,
  error,
  hasSearched,
  query,
  onSelectSong,
  onDismissError,
}) => {
  // Loading State
  if (isLoading) {
    return <Spinner label={`Searching for "${query}"...`} />;
  }

  // Error Banner
  const errorBanner = error && (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.85rem 1.25rem",
        borderRadius: "var(--radius-md)",
        background: "var(--error-bg)",
        border: "1px solid var(--error-border)",
        color: "var(--error-text)",
        marginBottom: "1.5rem",
        fontSize: "var(--font-size-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <AlertCircle size={18} style={{ flexShrink: 0 }} />
        <span>{error}</span>
      </div>
      {onDismissError && (
        <button
          onClick={onDismissError}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--error-text)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "var(--font-size-xs)",
            textDecoration: "underline",
          }}
        >
          Dismiss
        </button>
      )}
    </div>
  );

  // Empty State after searching
  if (hasSearched && songs.length === 0 && !error) {
    return (
      <div style={{ width: "100%", maxWidth: "860px", margin: "0 auto" }}>
        {errorBanner}
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem 1rem",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <SearchX size={30} style={{ opacity: 0.6 }} />
          </div>
          <h3
            style={{
              fontSize: "var(--font-size-lg)",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
              fontWeight: 600,
            }}
          >
            No results found for &ldquo;{query}&rdquo;
          </h3>
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              maxWidth: "380px",
              lineHeight: 1.5,
            }}
          >
            Try checking for spelling errors or searching with different artist, song, or album keywords.
          </p>
        </div>
      </div>
    );
  }

  // Initial prompt before searching
  if (!hasSearched && songs.length === 0) {
    return (
      <div style={{ width: "100%", maxWidth: "860px", margin: "0 auto" }}>
        {errorBanner}
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "5rem 1rem",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, rgba(194, 24, 91, 0.15) 0%, rgba(30, 30, 30, 0.4) 100%)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <Music2 size={34} style={{ color: "var(--accent)" }} />
          </div>
          <h2
            style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Search YouTube Music
          </h2>
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              maxWidth: "420px",
              lineHeight: 1.6,
            }}
          >
            Find any track, album, or artist from millions of songs. Type your search above and press Enter.
          </p>
        </div>
      </div>
    );
  }

  // Results list
  return (
    <div
      className="animate-fade-in"
      style={{
        width: "100%",
        maxWidth: "860px",
        margin: "0 auto",
      }}
    >
      {errorBanner}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem 0.75rem 1rem",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "0.5rem",
          fontSize: "var(--font-size-xs)",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ width: 24, textAlign: "center" }}>#</span>
          <span>Title</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <span>Album</span>
          <span style={{ minWidth: "55px", textAlign: "right" }}>Duration</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {songs.map((song, index) => (
          <SongCard
            key={song.videoId || `${song.title}-${index}`}
            song={song}
            index={index}
            onSelect={onSelectSong}
          />
        ))}
      </div>
    </div>
  );
};
