import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Heart, Music, Play } from "lucide-react";
import { useLibrary } from "../hooks/useLibrary";
import { usePlayer } from "../hooks/usePlayer";
import { SongCard } from "../components/SongCard";
import { Spinner } from "../components/Spinner";

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { likedSongs, recentPlays, isLoading } = useLibrary();
  const { playSong } = usePlayer();

  const recentTen = recentPlays.slice(0, 10);

  if (isLoading && likedSongs.length === 0 && recentPlays.length === 0) {
    return (
      <div style={{ padding: "4rem 1.5rem" }}>
        <Spinner label="Loading your library..." />
      </div>
    );
  }

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
      <header style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "var(--font-size-xl)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: "0.35rem",
          }}
        >
          Your Library
        </h1>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
          Liked tracks and recently played history saved locally.
        </p>
      </header>

      {/* Recently Played Horizontal Row */}
      <section style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.55rem",
            marginBottom: "1rem",
          }}
        >
          <Clock size={18} color="var(--accent-blue)" />
          <h2
            style={{
              fontSize: "var(--font-size-md)",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Recently Played
          </h2>
        </div>

        {recentTen.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Play any song from Search to build your recent listening history.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "1rem",
              overflowX: "auto",
              paddingBottom: "0.5rem",
            }}
          >
            {recentTen.map((song) => (
              <div
                key={song.videoId}
                onClick={() => playSong(song)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    playSong(song);
                  }
                }}
                style={{
                  width: 156,
                  flexShrink: 0,
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  transition: "var(--transition-fast)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    background: "var(--bg-surface-elevated)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "0.65rem",
                  }}
                >
                  {song.thumbnailUrl ? (
                    <img
                      src={song.thumbnailUrl}
                      alt={song.title}
                      referrerPolicy="no-referrer"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Music size={28} color="var(--text-muted)" />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      right: 8,
                      bottom: 8,
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "var(--accent-gradient)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
                    }}
                  >
                    <Play size={13} fill="#ffffff" color="#ffffff" style={{ marginLeft: 1 }} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: "0.2rem",
                  }}
                  title={song.title}
                >
                  {song.title}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/artist/${encodeURIComponent(song.artist)}`);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                    textAlign: "left",
                  }}
                  title={song.artist}
                >
                  {song.artist}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Liked Songs Section */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <Heart size={18} color="var(--accent-rose)" fill="var(--accent-rose)" />
            <h2
              style={{
                fontSize: "var(--font-size-md)",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Liked Songs
            </h2>
            <span
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-muted)",
              }}
            >
              ({likedSongs.length})
            </span>
          </div>
        </div>

        {likedSongs.length === 0 ? (
          <div
            style={{
              padding: "2rem 1.5rem",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-surface)",
              border: "1px dashed var(--border-subtle)",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            No liked songs yet. Click the heart icon on any track to save it here.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {likedSongs.map((song, index) => (
              <SongCard key={song.videoId} song={song} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

