import React, { useEffect, useState } from "react";
import { Music, Maximize2 } from "lucide-react";
import { Song } from "../types/music";
import { usePlayerStore } from "../store/playerStore";

interface NowPlayingProps {
  song: Song | null;
  onOpenModal?: () => void;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({ song, onOpenModal }) => {
  const [imageError, setImageError] = useState(false);
  const setIsNowPlayingOpen = usePlayerStore((s) => s.setIsNowPlayingOpen);

  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      setIsNowPlayingOpen(true);
    }
  };

  useEffect(() => {
    setImageError(false);
  }, [song?.thumbnailUrl]);

  if (!song) {
    return <div style={{ width: 220 }} />;
  }

  return (
    <div
      onClick={handleClick}
      title="Click to expand Now Playing & Lyrics"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        minWidth: 180,
        maxWidth: 280,
        flexShrink: 0,
        cursor: "pointer",
        borderRadius: "8px",
        padding: "4px 8px",
        margin: "-4px -8px",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
          flex: 1,
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

      <Maximize2
        size={14}
        color="var(--text-muted)"
        style={{ opacity: 0.6, flexShrink: 0 }}
      />
    </div>
  );
};
