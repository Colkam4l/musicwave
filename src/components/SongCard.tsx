import React, { useState } from "react";
import { Music, Play, Pause, Disc, Clock } from "lucide-react";
import { Song } from "../types/music";
import { usePlayer } from "../hooks/usePlayer";

interface SongCardProps {
  song: Song;
  index: number;
  onSelect?: (song: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({ song, index, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { currentSong, isPlaying, playSong, togglePlayPause } = usePlayer();

  const isCurrentSong = currentSong?.videoId === song.videoId;

  const handleClick = () => {
    if (isCurrentSong) {
      togglePlayPause();
    } else if (onSelect) {
      onSelect(song);
    } else {
      playSong(song);
    }
  };
  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.6rem 1rem",
        borderRadius: "var(--radius-md)",
        background: isCurrentSong
          ? "rgba(124, 58, 237, 0.12)"
          : isHovered
            ? "var(--bg-surface-hover)"
            : "transparent",
        cursor: "pointer",
        transition: "var(--transition-fast)",
        transform: isHovered ? "translateY(-1px)" : "none",
        outline: "none",
        border: isCurrentSong
          ? "1px solid rgba(124, 58, 237, 0.28)"
          : "1px solid transparent",
      }}
    >
      {/* Index or Play/Pause icon */}
      <div
        style={{
          width: 24,
          textAlign: "center",
          fontSize: "var(--font-size-sm)",
          color:
            isCurrentSong || isHovered
              ? "var(--accent-rose)"
              : "var(--text-muted)",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {isCurrentSong && isPlaying ? (
          <Pause size={16} fill="var(--accent-rose)" color="var(--accent-rose)" />
        ) : isHovered || isCurrentSong ? (
          <Play size={16} fill="var(--accent-rose)" color="var(--accent-rose)" />
        ) : (
          index + 1
        )}
      </div>

      {/* 48x48 Thumbnail with fallback */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          background: "var(--bg-surface-elevated)",
          position: "relative",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.5)" : "0 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        {song.thumbnailUrl && !imageError ? (
          <img
            src={song.thumbnailUrl}
            alt={song.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
              color: "var(--text-muted)",
            }}
          >
            <Music size={22} />
          </div>
        )}
      </div>

      {/* Song Title and Artist */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.2rem",
        }}
      >
        <span
          style={{
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: isHovered ? "var(--text-inverse)" : "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={song.title}
        >
          {song.title}
        </span>
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={song.artist}
        >
          {song.artist}
        </span>
      </div>

      {/* Album (hidden on narrow widths or displayed subtly) */}
      <div
        style={{
          flex: 0.8,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          color: "var(--text-muted)",
          fontSize: "var(--font-size-xs)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={song.album ?? "Single"}
      >
        <Disc size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {song.album ?? "Single"}
        </span>
      </div>

      {/* Duration */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          fontSize: "var(--font-size-xs)",
          color: "var(--text-muted)",
          minWidth: "55px",
          justifyContent: "flex-end",
          flexShrink: 0,
        }}
      >
        <Clock size={12} style={{ opacity: 0.6 }} />
        <span>{song.duration ?? "--:--"}</span>
      </div>
    </div>
  );
};
