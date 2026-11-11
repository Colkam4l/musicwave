import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  ListMusic,
  Loader2,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { usePlayer } from "../hooks/usePlayer";
import { useQueue } from "../hooks/useQueue";
import { useLibrary } from "../hooks/useLibrary";
import { ProgressBar } from "./ProgressBar";

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen mobile now-playing sheet with large artwork, seek bar, like, and 56x56 transport buttons.
 */
export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const {
    currentSong,
    isPlaying,
    isBuffering,
    elapsedSeconds,
    totalSeconds,
    togglePlayPause,
    seekTo,
  } = usePlayer();
  const { canSkipPrev, canSkipNext, skipPrev, skipNext, toggleQueueOpen } =
    useQueue();
  const { isLiked, toggleLike } = useLibrary();

  const liked = currentSong ? isLiked(currentSong.videoId) : false;

  const handleOpenArtist = () => {
    if (!currentSong) return;
    onClose();
    navigate(`/artist/${encodeURIComponent(currentSong.artist)}`, {
      state: { artistName: currentSong.artist },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background:
              "radial-gradient(circle at 50% 15%, rgba(124, 58, 237, 0.25) 0%, var(--bg-primary) 65%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Collapse player"
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--radius-full)",
                border: "none",
                background: "transparent",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ChevronDown size={26} />
            </button>

            <span
              style={{
                fontSize: "var(--font-size-xs)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-secondary)",
              }}
            >
              Now Playing
            </span>

            <button
              type="button"
              onClick={() => {
                onClose();
                toggleQueueOpen();
              }}
              aria-label="Open queue"
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--radius-full)",
                border: "none",
                background: "transparent",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ListMusic size={22} />
            </button>
          </div>

          {/* Album Artwork */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem 0",
            }}
          >
            <div
              style={{
                width: "min(80vw, 320px)",
                height: "min(80vw, 320px)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                background: "var(--bg-surface-elevated)",
                boxShadow: "0 18px 48px rgba(0, 0, 0, 0.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                <Music size={64} color="var(--text-muted)" />
              )}
            </div>
          </div>

          {/* Track Metadata, Like, Progress, and Transport */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "var(--font-size-xl)",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentSong?.title ?? "Nothing Playing"}
                </h2>
                <button
                  type="button"
                  onClick={handleOpenArtist}
                  disabled={!currentSong}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0.25rem 0",
                    color: "var(--text-secondary)",
                    fontSize: "var(--font-size-md)",
                    cursor: currentSong ? "pointer" : "default",
                    textAlign: "left",
                    minHeight: 44,
                  }}
                >
                  {currentSong?.artist ?? "Select a track to listen"}
                </button>
              </div>

              <button
                type="button"
                disabled={!currentSong}
                onClick={() => currentSong && void toggleLike(currentSong)}
                aria-label={liked ? "Unlike song" : "Like song"}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: "transparent",
                  color: liked ? "var(--accent-rose)" : "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: currentSong ? "pointer" : "default",
                  flexShrink: 0,
                }}
              >
                <Heart size={24} fill={liked ? "currentColor" : "none"} />
              </button>
            </div>

            <ProgressBar
              elapsedSeconds={elapsedSeconds}
              totalSeconds={totalSeconds}
              onSeek={seekTo}
              disabled={!currentSong}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.5rem",
                paddingTop: "0.25rem",
              }}
            >
              <button
                type="button"
                onClick={() => void skipPrev()}
                disabled={!canSkipPrev}
                aria-label="Previous track"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: "var(--bg-surface)",
                  color: canSkipPrev
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                  opacity: canSkipPrev ? 1 : 0.45,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canSkipPrev ? "pointer" : "default",
                }}
              >
                <SkipBack size={26} />
              </button>

              <button
                type="button"
                onClick={() => void togglePlayPause()}
                disabled={!currentSong}
                aria-label={isPlaying ? "Pause" : "Play"}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: currentSong
                    ? "var(--accent-gradient)"
                    : "var(--bg-surface-elevated)",
                  color: "var(--text-inverse)",
                  boxShadow: currentSong
                    ? "0 6px 24px var(--accent-glow)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: currentSong ? "pointer" : "default",
                }}
              >
                {isBuffering ? (
                  <Loader2 size={28} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" />
                )}
              </button>

              <button
                type="button"
                onClick={() => void skipNext()}
                disabled={!canSkipNext}
                aria-label="Next track"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: "var(--bg-surface)",
                  color: canSkipNext
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                  opacity: canSkipNext ? 1 : 0.45,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canSkipNext ? "pointer" : "default",
                }}
              >
                <SkipForward size={26} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

