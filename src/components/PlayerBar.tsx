import React from "react";
import { NowPlaying } from "./NowPlaying";
import { PlaybackControls } from "./PlaybackControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";
import { usePlayer } from "../hooks/usePlayer";

export const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    elapsedSeconds,
    totalSeconds,
    volume,
    togglePlayPause,
    seekTo,
    changeVolume,
  } = usePlayer();

  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        zIndex: 100,
        /* Glassmorphism recipe from CLAUDE.md */
        background: "rgba(12, 12, 12, 0.72)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.13)",
        boxShadow: "0 -4px 32px rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        gap: "1.25rem",
      }}
    >
      {/* Left: Now Playing Song Info */}
      <NowPlaying song={currentSong} />

      {/* Center Left: Playback Controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        disabled={!currentSong}
        onTogglePlayPause={togglePlayPause}
      />

      {/* Center Right: Scrubable Progress Bar */}
      <ProgressBar
        elapsedSeconds={elapsedSeconds}
        totalSeconds={totalSeconds}
        onSeek={seekTo}
        disabled={!currentSong}
      />

      {/* Right: Volume Control */}
      <VolumeControl
        volume={volume}
        onVolumeChange={changeVolume}
      />
    </footer>
  );
};
