import React from "react";
import { ListMusic } from "lucide-react";
import { NowPlaying } from "./NowPlaying";
import { PlaybackControls } from "./PlaybackControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";
import { NowPlayingModal } from "./NowPlayingModal";
import { usePlayer } from "../hooks/usePlayer";
import { useQueue } from "../hooks/useQueue";
import { usePlayerStore } from "../store/playerStore";

export const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    isBuffering,
    elapsedSeconds,
    totalSeconds,
    volume,
    repeatMode,
    isShuffled,
    togglePlayPause,
    seekTo,
    changeVolume,
    cycleRepeat,
  } = usePlayer();
  const {
    queue,
    isQueueOpen,
    canSkipPrev,
    canSkipNext,
    toggleQueueOpen,
    skipPrev,
    skipNext,
    shuffleQueue,
  } = useQueue();
  const isNowPlayingOpen = usePlayerStore((s) => s.isNowPlayingOpen);
  const setIsNowPlayingOpen = usePlayerStore((s) => s.setIsNowPlayingOpen);

  return (
    <>
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
          isBuffering={isBuffering}
          disabled={!currentSong}
          disablePrev={!canSkipPrev}
          disableNext={!canSkipNext}
          repeatMode={repeatMode}
          isShuffled={isShuffled}
          onTogglePlayPause={togglePlayPause}
          onPrev={skipPrev}
          onNext={skipNext}
          onCycleRepeat={cycleRepeat}
          onToggleShuffle={shuffleQueue}
        />

        {/* Center Right: Scrubable Progress Bar */}
        <ProgressBar
          elapsedSeconds={elapsedSeconds}
          totalSeconds={totalSeconds}
          onSeek={seekTo}
          disabled={!currentSong}
        />

        {/* Right: Queue Toggle & Volume Control */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <button
            type="button"
            onClick={toggleQueueOpen}
            title="Toggle Queue"
            style={{
              position: "relative",
              width: 38,
              height: 38,
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: isQueueOpen ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: isQueueOpen ? "var(--accent-rose)" : "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "var(--transition-fast)",
            }}
          >
            <ListMusic size={18} />
            {queue.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  minWidth: 15,
                  height: 15,
                  padding: "0 4px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--accent-violet)",
                  color: "#ffffff",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {queue.length}
              </span>
            )}
          </button>

          <VolumeControl volume={volume} onVolumeChange={changeVolume} />
        </div>
      </footer>

      {/* Expandable Now Playing Modal */}
      <NowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
      />
    </>
  );
};
