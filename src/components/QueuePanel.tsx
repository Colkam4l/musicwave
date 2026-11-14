import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ListMusic, Music, Trash2, X } from "lucide-react";
import { useQueue } from "../hooks/useQueue";
import { usePlayer } from "../hooks/usePlayer";
import { useContextMenuStore } from "../store/contextMenuStore";
import { Song } from "../types/music";

export const QueuePanel: React.FC = () => {
  const {
    queue,
    isQueueOpen,
    setQueueOpen,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    skipToQueueIndex,
  } = useQueue();
  const { currentSong } = usePlayer();
  const openContextMenu = useContextMenuStore((s) => s.openContextMenu);

  const handlePlayQueuedItem = async (_song: Song, index: number) => {
    await skipToQueueIndex(index);
  };

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <motion.aside
          className="queue-panel"
          initial={{ x: "100%", opacity: 0.92 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0.92 }}
          transition={{ type: "spring", stiffness: 360, damping: 34 }}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 80,
            width: 350,
            maxWidth: "90vw",
            zIndex: 90,
            background: "var(--bg-glass)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            borderLeft: "1px solid var(--border-glass)",
            boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.55)",
            display: "flex",
            flexDirection: "column",
          }}
        >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.1rem 1.25rem",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <ListMusic size={18} color="var(--accent-rose)" />
          <h2
            style={{
              fontSize: "var(--font-size-md)",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Play Queue
          </h2>
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--text-muted)",
            }}
          >
            ({queue.length})
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {queue.length > 0 && (
            <button
              type="button"
              onClick={clearQueue}
              title="Clear queue"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.35rem 0.6rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: "var(--font-size-xs)",
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setQueueOpen(false)}
            title="Close queue"
            style={{
              width: 34,
              height: 34,
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem" }}>
        {currentSong && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              Now Playing
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.6rem 0.75rem",
                borderRadius: "var(--radius-md)",
                background: "rgba(124, 58, 237, 0.14)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
              }}
            >
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
                {currentSong.thumbnailUrl ? (
                  <img
                    src={currentSong.thumbnailUrl}
                    alt={currentSong.title}
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Music size={16} color="var(--text-muted)" />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentSong.title}
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentSong.artist}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            fontSize: "var(--font-size-xs)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-muted)",
            marginBottom: "0.6rem",
          }}
        >
          Up Next
        </div>

        {queue.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1rem",
              color: "var(--text-muted)",
              fontSize: "var(--font-size-sm)",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--border-subtle)",
            }}
          >
            Your queue is empty. Right-click a song or click + to add tracks.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            {queue.map((song, idx) => (
              <div
                key={`${song.videoId}-${idx}`}
                onClick={() => handlePlayQueuedItem(song, idx)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openContextMenu({ x: e.clientX, y: e.clientY }, song);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handlePlayQueuedItem(song, idx);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    overflow: "hidden",
                    background: "var(--bg-surface-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {song.thumbnailUrl ? (
                    <img
                      src={song.thumbnailUrl}
                      alt={song.title}
                      referrerPolicy="no-referrer"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Music size={14} color="var(--text-muted)" />
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "var(--font-size-xs)",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={song.title}
                  >
                    {song.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {song.artist}
                    {song.duration ? ` • ${song.duration}` : ""}
                  </div>
                </div>

                {/* Reorder & Remove Actions */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => reorderQueue(idx, idx - 1)}
                    title="Move up"
                    style={{
                      width: 24,
                      height: 24,
                      border: "none",
                      background: "transparent",
                      color:
                        idx === 0 ? "var(--text-muted)" : "var(--text-secondary)",
                      opacity: idx === 0 ? 0.35 : 1,
                      cursor: idx === 0 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === queue.length - 1}
                    onClick={() => reorderQueue(idx, idx + 1)}
                    title="Move down"
                    style={{
                      width: 24,
                      height: 24,
                      border: "none",
                      background: "transparent",
                      color:
                        idx === queue.length - 1
                          ? "var(--text-muted)"
                          : "var(--text-secondary)",
                      opacity: idx === queue.length - 1 ? 0.35 : 1,
                      cursor:
                        idx === queue.length - 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromQueue(idx)}
                    title="Remove from queue"
                    style={{
                      width: 24,
                      height: 24,
                      border: "none",
                      background: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

