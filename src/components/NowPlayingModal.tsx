import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music } from "lucide-react";
import { usePlayer } from "../hooks/usePlayer";
import { useQueue } from "../hooks/useQueue";
import { useRecommendations } from "../hooks/useRecommendations";
import { useLibrary } from "../hooks/useLibrary";
import { LyricsSheet } from "./LyricsSheet";
import { PlaybackControls } from "./PlaybackControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"lyrics" | "queue" | "related">("lyrics");
  const {
    currentSong,
    isPlaying,
    isBuffering,
    elapsedSeconds,
    totalSeconds,
    volume,
    repeatMode,
    togglePlayPause,
    cycleRepeat,
    seekTo,
    changeVolume,
  } = usePlayer();
  const { queue, skipNext, skipPrev, canSkipNext, canSkipPrev, removeFromQueue, shuffleQueue } =
    useQueue();
  const { recommendations, fetchRecommendations, startRadio, isLoading: isRecsLoading } =
    useRecommendations();
  const { isLiked, toggleLike } = useLibrary();

  // Fetch recommendations when switching to "related" tab
  React.useEffect(() => {
    if (activeTab === "related" && currentSong) {
      void fetchRecommendations(currentSong.videoId);
    }
  }, [activeTab, currentSong?.videoId, fetchRecommendations]);

  if (!isOpen || !currentSong) return null;

  const liked = isLiked(currentSong.videoId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          backgroundColor: "var(--md-sys-color-surface, #0d0e12)",
          backgroundImage: currentSong.thumbnailUrl
            ? `radial-gradient(ellipse 90% 65% at 50% 10%, var(--accent-glow, rgba(124, 58, 237, 0.35)) 0%, var(--md-sys-color-surface, #0a0b0e) 80%)`
            : undefined,
          display: "flex",
          flexDirection: "column",
          color: "var(--md-sys-color-on-surface, #ffffff)",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#ffffff",
              padding: "8px 14px",
              borderRadius: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 500,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Minimize
          </button>

          {/* Tab Switcher */}
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              borderRadius: "24px",
              padding: "4px",
              gap: "4px",
            }}
          >
            {(["lyrics", "queue", "related"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? "rgba(255, 255, 255, 0.15)" : "transparent",
                  border: "none",
                  color: activeTab === tab ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
                  padding: "6px 18px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s",
                }}
              >
                {tab === "related" ? "Similar & Radio" : tab}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => toggleLike(currentSong)}
              title={liked ? "Unlike" : "Like"}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: liked ? "#ff4081" : "rgba(255, 255, 255, 0.7)",
                display: "flex",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button
              onClick={() => void startRadio(currentSong)}
              title="Start Song Radio"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M12 12h.01" />
                <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" />
              </svg>
              Start Radio
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: "32px",
            padding: "24px 48px",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Left: Artwork & Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "min(340px, 80%)",
                aspectRatio: "1",
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 50px rgba(100, 150, 255, 0.15)",
              }}
            >
              {currentSong.thumbnailUrl ? (
                <img
                  src={currentSong.thumbnailUrl}
                  alt={currentSong.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <Music size={80} color="rgba(255, 255, 255, 0.3)" />
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", maxWidth: "380px" }}>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: "24px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentSong.title}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  color: "rgba(255, 255, 255, 0.65)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentSong.artist}
                {currentSong.album ? ` • ${currentSong.album}` : ""}
              </p>
            </div>
          </div>

          {/* Right: Tab Content */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              padding: "16px",
            }}
          >
            {activeTab === "lyrics" && <LyricsSheet />}

            {activeTab === "queue" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflowY: "auto",
                  padding: "8px",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "8px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>
                    Up Next ({queue.length})
                  </span>
                  <button
                    onClick={() => void shuffleQueue()}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "none",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Shuffle
                  </button>
                </div>
                {queue.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "200px",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    Queue is empty. Auto-Queue will keep music playing!
                  </div>
                ) : (
                  queue.map((item, idx) => (
                    <div
                      key={`${item.videoId}-${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span style={{ width: "20px", fontSize: "12px", opacity: 0.5 }}>
                        {idx + 1}
                      </span>
                      {item.thumbnailUrl && (
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          style={{ width: "36px", height: "36px", borderRadius: "6px" }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.6)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.artist}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromQueue(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "rgba(255,255,255,0.4)",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "related" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  overflowY: "auto",
                  padding: "8px",
                  gap: "8px",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                  Recommended Radio Tracks
                </div>
                {isRecsLoading ? (
                  <div style={{ padding: "32px", textAlign: "center", opacity: 0.6 }}>
                    Finding similar songs...
                  </div>
                ) : (
                  recommendations.map((song) => (
                    <div
                      key={song.videoId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        cursor: "pointer",
                      }}
                      onClick={() => void startRadio(song)}
                    >
                      {song.thumbnailUrl && (
                        <img
                          src={song.thumbnailUrl}
                          alt=""
                          style={{ width: "40px", height: "40px", borderRadius: "8px" }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {song.title}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.6)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {song.artist}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", opacity: 0.5 }}>
                        {song.duration || ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Progress & Controls */}
        <div
          style={{
            padding: "16px 48px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
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
              justifyContent: "space-between",
            }}
          >
            <div style={{ width: "160px" }} />
            <PlaybackControls
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              canSkipNext={canSkipNext}
              canSkipPrev={canSkipPrev}
              onTogglePlayPause={togglePlayPause}
              onSkipNext={skipNext}
              onSkipPrev={skipPrev}
              repeatMode={repeatMode}
              onCycleRepeat={cycleRepeat}
            />
            <div style={{ width: "160px", display: "flex", justifyContent: "flex-end" }}>
              <VolumeControl volume={volume} onVolumeChange={changeVolume} />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
