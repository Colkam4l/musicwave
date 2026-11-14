import React from "react";
import { Play, Pause, SkipBack, SkipForward, Loader2, Shuffle, Repeat, Repeat1 } from "lucide-react";
import { RepeatMode } from "../types/music";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isBuffering?: boolean;
  disabled?: boolean;
  disablePrev?: boolean;
  disableNext?: boolean;
  canSkipPrev?: boolean;
  canSkipNext?: boolean;
  repeatMode?: RepeatMode;
  isShuffled?: boolean;
  onTogglePlayPause: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSkipPrev?: () => void;
  onSkipNext?: () => void;
  onCycleRepeat?: () => void;
  onToggleShuffle?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isBuffering = false,
  disabled = false,
  disablePrev = false,
  disableNext = false,
  canSkipPrev,
  canSkipNext,
  repeatMode,
  isShuffled = false,
  onTogglePlayPause,
  onPrev,
  onNext,
  onSkipPrev,
  onSkipNext,
  onCycleRepeat,
  onToggleShuffle,
}) => {
  const handlePrev = onPrev ?? onSkipPrev;
  const handleNext = onNext ?? onSkipNext;
  const prevDisabled =
    disabled ||
    disablePrev ||
    (canSkipPrev !== undefined ? !canSkipPrev : !handlePrev);
  const nextDisabled =
    disabled ||
    disableNext ||
    (canSkipNext !== undefined ? !canSkipNext : !handleNext);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        flexShrink: 0,
      }}
    >
      {/* Shuffle Button (Optional) */}
      {onToggleShuffle && (
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleShuffle}
          title={isShuffled ? "Shuffle active" : "Shuffle queue"}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "none",
            background: isShuffled ? "rgba(124, 58, 237, 0.2)" : "transparent",
            color: isShuffled ? "#a855f7" : "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "var(--transition-fast)",
            outline: "none",
          }}
        >
          <Shuffle size={16} />
        </button>
      )}

      {/* Previous Song */}
      <button
        type="button"
        disabled={prevDisabled}
        onClick={handlePrev}
        title="Previous"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: prevDisabled ? "var(--text-muted)" : "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: prevDisabled ? "not-allowed" : "pointer",
          transition: "var(--transition-fast)",
          outline: "none",
          opacity: prevDisabled ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (!prevDisabled) {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (!prevDisabled) {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <SkipBack size={19} />
      </button>

      {/* Play / Pause Toggle Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={onTogglePlayPause}
        title={isBuffering ? "Buffering audio..." : isPlaying ? "Pause" : "Play"}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: "var(--accent-gradient)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: disabled
            ? "none"
            : "0 4px 16px rgba(124, 58, 237, 0.40)",
          transition: "var(--transition-fast)",
          outline: "none",
          opacity: disabled ? 0.4 : 1,
          transform: "scale(1)",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = "scale(1.06)";
            e.currentTarget.style.boxShadow =
              "0 6px 20px rgba(124, 58, 237, 0.55)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 4px 16px rgba(124, 58, 237, 0.40)";
          }
        }}
      >
        {isBuffering ? (
          <Loader2 size={20} color="#ffffff" className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={20} fill="#ffffff" color="#ffffff" />
        ) : (
          <Play
            size={20}
            fill="#ffffff"
            color="#ffffff"
            style={{ marginLeft: 2 }}
          />
        )}
      </button>

      {/* Next Song */}
      <button
        type="button"
        disabled={nextDisabled}
        onClick={handleNext}
        title="Next"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: nextDisabled ? "var(--text-muted)" : "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: nextDisabled ? "not-allowed" : "pointer",
          transition: "var(--transition-fast)",
          outline: "none",
          opacity: nextDisabled ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (!nextDisabled) {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (!nextDisabled) {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <SkipForward size={19} />
      </button>

      {/* Repeat Mode Button (Optional) */}
      {onCycleRepeat && (
        <button
          type="button"
          disabled={disabled}
          onClick={onCycleRepeat}
          title={`Repeat mode: ${repeatMode ?? "off"}`}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "none",
            background:
              repeatMode && repeatMode !== "off"
                ? "rgba(124, 58, 237, 0.2)"
                : "transparent",
            color:
              repeatMode && repeatMode !== "off"
                ? "#a855f7"
                : "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "var(--transition-fast)",
            outline: "none",
            position: "relative",
          }}
        >
          {repeatMode === "one" ? <Repeat1 size={17} /> : <Repeat size={16} />}
        </button>
      )}
    </div>
  );
};
