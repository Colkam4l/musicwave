import React, { useState } from "react";
import { Music } from "lucide-react";
import { Song } from "../types/music";

interface NowPlayingProps {
  song: Song | null;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({ song }) => {
  const [imageError, setImageError] = useState(false);

  if (!song) {
    return <div style={{ width: 220 }} />;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        minWidth: 180,
        maxWidth: 280,
        flexShrink: 0,
      }}
    >
      {/* 40x40 Thumbnail with iridescent violet glow ring */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          boxShadow:
            "0 0 0 2px rgba(255, 255, 255, 0.06), 0 0 20px rgba(124, 58, 237, 0.40)",
          background: "var(--bg-surface-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
          <Music size={18} color="var(--text-muted)" />
        )}
      </div>

      {/* Song details */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.15rem",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: "var(--text-primary)",
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
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={song.artist}
        >
          {song.artist}
        </span>
      </div>
    </div>
  );
};
