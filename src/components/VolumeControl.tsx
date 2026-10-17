import React, { useState, useRef } from "react";
import { Volume2, Volume1, VolumeX } from "lucide-react";

interface VolumeControlProps {
  volume: number; // 0.0 - 1.0
  onVolumeChange: (volume: number) => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
}) => {
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolume > 0 ? prevVolume : 0.5);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      updateFromPointer(e);
    }
  };

  const updateFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, clickX / rect.width));
    onVolumeChange(ratio);
  };

  const percentage = Math.round(volume * 100);

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={18} />;
    if (volume < 0.5) return <Volume1 size={18} />;
    return <Volume2 size={18} />;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        minWidth: 120,
        maxWidth: 160,
        flexShrink: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mute / Unmute Button */}
      <button
        type="button"
        onClick={toggleMute}
        title={volume === 0 ? "Unmute" : "Mute"}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          color: isHovered ? "var(--text-primary)" : "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "var(--transition-fast)",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text-primary)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isHovered
            ? "var(--text-primary)"
            : "var(--text-secondary)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        {getVolumeIcon()}
      </button>

      {/* Volume Slider Rail */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        role="slider"
        aria-label="Volume"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        style={{
          flex: 1,
          height: 24,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          position: "relative",
          touchAction: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            height: isHovered ? 5 : 4,
            borderRadius: "var(--radius-full)",
            background: "rgba(255, 255, 255, 0.14)",
            position: "relative",
            overflow: "hidden",
            transition: "height var(--transition-fast)",
          }}
        >
          {/* Fill track */}
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              background: isHovered
                ? "var(--accent-gradient)"
                : "var(--text-secondary)",
              borderRadius: "var(--radius-full)",
              transition: "background var(--transition-fast)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
