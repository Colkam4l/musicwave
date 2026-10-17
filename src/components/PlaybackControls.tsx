import React from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  disabled?: boolean;
  onTogglePlayPause: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  disabled = false,
  onTogglePlayPause,
  onPrev,
  onNext,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        flexShrink: 0,
      }}
    >
      {/* Previous Song (Stub for Sprint 3 queue) */}
      <button
        type="button"
        disabled={disabled}
        onClick={onPrev}
        title="Previous (Queue coming in Sprint 3)"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "var(--transition-fast)",
          outline: "none",
          opacity: disabled ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
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
        title={isPlaying ? "Pause" : "Play"}
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
        {isPlaying ? (
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

      {/* Next Song (Stub for Sprint 3 queue) */}
      <button
        type="button"
        disabled={disabled}
        onClick={onNext}
        title="Next (Queue coming in Sprint 3)"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "var(--transition-fast)",
          outline: "none",
          opacity: disabled ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <SkipForward size={19} />
      </button>
    </div>
  );
};
