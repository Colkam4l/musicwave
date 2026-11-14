import React from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  Shuffle,
  Repeat,
  Repeat1,
} from "lucide-react";
import { RepeatMode } from "../types/music";
import { M3Tokens } from "../theme/tokens";
import { useThemeStore } from "../store/themeStore";

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
  const { reducedMotion } = useThemeStore();
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
        gap: "0.5rem",
        flexShrink: 0,
      }}
    >
      {/* Shuffle Button with M3 Tonal Pill */}
      {onToggleShuffle && (
        <motion.button
          type="button"
          disabled={disabled}
          onClick={onToggleShuffle}
          whileHover={disabled || reducedMotion ? undefined : { scale: 1.08 }}
          whileTap={disabled || reducedMotion ? undefined : { scale: 0.92 }}
          transition={M3Tokens.motion.tactilePress}
          title={isShuffled ? "Shuffle active" : "Shuffle queue"}
          style={{
            width: 38,
            height: 38,
            borderRadius: M3Tokens.shape.cornerFull,
            border: "none",
            background: isShuffled
              ? "var(--md-sys-color-secondary-container, #4a4458)"
              : "transparent",
            color: isShuffled
              ? "var(--md-sys-color-on-secondary-container, #ffffff)"
              : "var(--md-sys-color-on-surface-variant, #cac4d0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            outline: "none",
            opacity: disabled ? 0.35 : 1,
            transition: "background 0.2s ease, color 0.2s ease",
          }}
        >
          <Shuffle size={16} />
        </motion.button>
      )}

      {/* Previous Track */}
      <motion.button
        type="button"
        disabled={prevDisabled}
        onClick={handlePrev}
        whileHover={prevDisabled || reducedMotion ? undefined : { scale: 1.08 }}
        whileTap={prevDisabled || reducedMotion ? undefined : { scale: 0.92 }}
        transition={M3Tokens.motion.tactilePress}
        title="Previous"
        style={{
          width: 40,
          height: 40,
          borderRadius: M3Tokens.shape.cornerFull,
          border: "none",
          background: "transparent",
          color: prevDisabled
            ? "var(--md-sys-color-outline, rgba(255, 255, 255, 0.2))"
            : "var(--md-sys-color-on-surface, #ffffff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: prevDisabled ? "not-allowed" : "pointer",
          outline: "none",
          opacity: prevDisabled ? 0.4 : 1,
        }}
      >
        <SkipBack size={19} />
      </motion.button>

      {/* Play / Pause M3 Expressive Pill */}
      <motion.button
        type="button"
        disabled={disabled}
        onClick={onTogglePlayPause}
        whileHover={
          disabled || reducedMotion
            ? undefined
            : { scale: 1.06, boxShadow: M3Tokens.elevation.level3 }
        }
        whileTap={disabled || reducedMotion ? undefined : { scale: 0.92 }}
        transition={M3Tokens.motion.tactilePress}
        title={isBuffering ? "Buffering audio..." : isPlaying ? "Pause" : "Play"}
        style={{
          width: 48,
          height: 48,
          borderRadius: M3Tokens.shape.cornerFull,
          border: "none",
          background: "var(--md-sys-color-primary, #d0bcff)",
          color: "var(--md-sys-color-on-primary, #381e72)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: disabled ? "none" : M3Tokens.elevation.level2,
          outline: "none",
          opacity: disabled ? 0.4 : 1,
          transition: "background 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease",
        }}
      >
        {isBuffering ? (
          <Loader2
            size={22}
            color="currentColor"
            style={{ animation: "spin 1s linear infinite" }}
          />
        ) : isPlaying ? (
          <Pause size={22} fill="currentColor" color="currentColor" />
        ) : (
          <Play
            size={22}
            fill="currentColor"
            color="currentColor"
            style={{ marginLeft: 2 }}
          />
        )}
      </motion.button>

      {/* Next Track */}
      <motion.button
        type="button"
        disabled={nextDisabled}
        onClick={handleNext}
        whileHover={nextDisabled || reducedMotion ? undefined : { scale: 1.08 }}
        whileTap={nextDisabled || reducedMotion ? undefined : { scale: 0.92 }}
        transition={M3Tokens.motion.tactilePress}
        title="Next"
        style={{
          width: 40,
          height: 40,
          borderRadius: M3Tokens.shape.cornerFull,
          border: "none",
          background: "transparent",
          color: nextDisabled
            ? "var(--md-sys-color-outline, rgba(255, 255, 255, 0.2))"
            : "var(--md-sys-color-on-surface, #ffffff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: nextDisabled ? "not-allowed" : "pointer",
          outline: "none",
          opacity: nextDisabled ? 0.4 : 1,
        }}
      >
        <SkipForward size={19} />
      </motion.button>

      {/* Repeat Button with M3 Tonal Pill */}
      {onCycleRepeat && (
        <motion.button
          type="button"
          disabled={disabled}
          onClick={onCycleRepeat}
          whileHover={disabled || reducedMotion ? undefined : { scale: 1.08 }}
          whileTap={disabled || reducedMotion ? undefined : { scale: 0.92 }}
          transition={M3Tokens.motion.tactilePress}
          title={`Repeat: ${repeatMode ?? "off"}`}
          style={{
            width: 38,
            height: 38,
            borderRadius: M3Tokens.shape.cornerFull,
            border: "none",
            background:
              repeatMode && repeatMode !== "off"
                ? "var(--md-sys-color-secondary-container, #4a4458)"
                : "transparent",
            color:
              repeatMode && repeatMode !== "off"
                ? "var(--md-sys-color-on-secondary-container, #ffffff)"
                : "var(--md-sys-color-on-surface-variant, #cac4d0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            outline: "none",
            opacity: disabled ? 0.35 : 1,
            transition: "background 0.2s ease, color 0.2s ease",
          }}
        >
          {repeatMode === "one" ? <Repeat1 size={17} /> : <Repeat size={16} />}
        </motion.button>
      )}
    </div>
  );
};
