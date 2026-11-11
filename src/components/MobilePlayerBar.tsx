import React from "react";
import { Loader2, Music, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { usePlayer } from "../hooks/usePlayer";
import { useQueue } from "../hooks/useQueue";

interface MobilePlayerBarProps {
  onOpenFullScreen: () => void;
}

const controlBtnStyle = (disabled: boolean): React.CSSProperties => ({
  minWidth: 44,
  minHeight: 44,
  width: 44,
  height: 44,
  borderRadius: "var(--radius-full)",
  border: "none",
  background: "transparent",
  color: disabled ? "var(--text-muted)" : "var(--text-primary)",
  opacity: disabled ? 0.45 : 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: disabled ? "default" : "pointer",
  flexShrink: 0,
});

/**
 * Compact one-line mobile player bar fixed above BottomNav.
 */
export const MobilePlayerBar: React.FC<MobilePlayerBarProps> = ({
  onOpenFullScreen,
}) => {
  const {
    currentSong,
    isPlaying,
    isBuffering,
    elapsedSeconds,
    totalSeconds,
    togglePlayPause,
  } = usePlayer();
  const { canSkipPrev, canSkipNext, skipPrev, skipNext } = useQueue();

  const progressPct =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100))
      : 0;

  return (
    <div
      className="mobile-player-bar"
      role="button"
      tabIndex={0}
      onClick={onOpenFullScreen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenFullScreen();
        }
      }}
      aria-label="Open full-screen player"
    >
      {/* Thin top progress strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "var(--accent-gradient)",
          }}
        />
      </div>

      {/* Album thumbnail */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          background: "var(--bg-surface-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {currentSong?.thumbnailUrl ? (
          <img
            src={currentSong.thumbnailUrl}
            alt={currentSong.title}
            referrerPolicy="no-referrer"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Music size={18} color="var(--text-muted)" />
        )}
      </div>

      {/* Title · Artist */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          fontSize: "var(--font-size-sm)",
          color: currentSong ? "var(--text-primary)" : "var(--text-muted)",
        }}
      >
        {currentSong ? (
          <>
            <span style={{ fontWeight: 600 }}>{currentSong.title}</span>
            <span style={{ color: "var(--text-secondary)" }}>
              {" "}
              · {currentSong.artist}
            </span>
          </>
        ) : (
          "Nothing Playing"
        )}
      </div>

      {/* Transport Controls */}
      <div
        style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => void skipPrev()}
          disabled={!canSkipPrev}
          aria-label="Previous track"
          style={controlBtnStyle(!canSkipPrev)}
        >
          <SkipBack size={18} />
        </button>

        <button
          type="button"
          onClick={() => void togglePlayPause()}
          disabled={!currentSong}
          aria-label={isPlaying ? "Pause" : "Play"}
          style={controlBtnStyle(!currentSong)}
        >
          {isBuffering ? (
            <Loader2 size={20} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </button>

        <button
          type="button"
          onClick={() => void skipNext()}
          disabled={!canSkipNext}
          aria-label="Next track"
          style={controlBtnStyle(!canSkipNext)}
        >
          <SkipForward size={18} />
        </button>
      </div>
    </div>
  );
};

