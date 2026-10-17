import React, { useState, useEffect, useRef } from "react";

interface ProgressBarProps {
  elapsedSeconds: number;
  totalSeconds: number;
  onSeek: (positionSeconds: number) => void;
  disabled?: boolean;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  elapsedSeconds,
  totalSeconds,
  onSeek,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync internal dragValue with elapsedSeconds when not actively dragging
  useEffect(() => {
    if (!isDragging) {
      setDragValue(elapsedSeconds);
    }
  }, [elapsedSeconds, isDragging]);

  const currentSeconds = isDragging ? dragValue : elapsedSeconds;
  const maxSeconds = totalSeconds > 0 ? totalSeconds : 1;
  const percentage = Math.min(100, Math.max(0, (currentSeconds / maxSeconds) * 100));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || totalSeconds <= 0) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled || totalSeconds <= 0) return;
    updateFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled || totalSeconds <= 0) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture already lost
    }
    onSeek(dragValue);
  };

  const updateFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || totalSeconds <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, clickX / rect.width));
    const newPos = ratio * totalSeconds;
    setDragValue(newPos);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        flex: 1,
        maxWidth: 560,
        minWidth: 160,
      }}
    >
      {/* Elapsed time label */}
      <span
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--text-muted)",
          minWidth: 36,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTime(currentSeconds)}
      </span>

      {/* Scrubable Seek Track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="slider"
        aria-valuenow={Math.round(currentSeconds)}
        aria-valuemin={0}
        aria-valuemax={Math.round(totalSeconds)}
        tabIndex={disabled ? -1 : 0}
        style={{
          flex: 1,
          height: 24,
          display: "flex",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          touchAction: "none",
        }}
      >
        {/* Background track rail */}
        <div
          style={{
            width: "100%",
            height: isHovered || isDragging ? 6 : 4,
            borderRadius: "var(--radius-full)",
            background: "rgba(255, 255, 255, 0.14)",
            position: "relative",
            overflow: "hidden",
            transition: "height var(--transition-fast)",
          }}
        >
          {/* Iridescent Gradient Fill */}
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              background: "var(--accent-gradient)",
              borderRadius: "var(--radius-full)",
            }}
          />
        </div>

        {/* Thumb indicator */}
        <div
          style={{
            position: "absolute",
            left: `${percentage}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: isHovered || isDragging ? 14 : 0,
            height: isHovered || isDragging ? 14 : 0,
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.5), 0 0 8px var(--accent-glow)",
            transition: isDragging
              ? "none"
              : "width var(--transition-fast), height var(--transition-fast)",
            pointerEvents: "none",
            opacity: isHovered || isDragging ? 1 : 0,
          }}
        />
      </div>

      {/* Total time label */}
      <span
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--text-muted)",
          minWidth: 36,
          textAlign: "left",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTime(totalSeconds)}
      </span>
    </div>
  );
};
