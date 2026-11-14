import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Play,
  ListPlus,
  Radio,
  Heart,
  User,
  Disc,
  FolderPlus,
  Download,
  Share2,
  Check,
  ChevronRight,
} from "lucide-react";
import { useContextMenuStore } from "../../store/contextMenuStore";
import { usePlayer } from "../../hooks/usePlayer";
import { useQueue } from "../../hooks/useQueue";
import { useLibrary } from "../../hooks/useLibrary";
import { useCache } from "../../hooks/useCache";
import { useToast } from "../Toast";

export const ContextMenu: React.FC = () => {
  const { isOpen, position, song, closeContextMenu } = useContextMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { playSong } = usePlayer();
  const { playNext, addToQueue } = useQueue();
  const { isLiked, toggleLike, playlists, addToPlaylist } = useLibrary();
  const { downloadTrack, stats } = useCache();
  const { showToast } = useToast();

  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const [adjustedPos, setAdjustedPos] = useState({ x: position.x, y: position.y });

  // Clamp within viewport
  useEffect(() => {
    if (!isOpen) {
      setShowPlaylistSubmenu(false);
      return;
    }

    const menuWidth = 240;
    const menuHeight = 360;
    const padding = 12;

    let x = position.x;
    let y = position.y;

    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }
    if (x < padding) x = padding;
    if (y < padding) y = padding;

    setAdjustedPos({ x, y });
  }, [isOpen, position]);

  // Click outside and keydown listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeContextMenu();
      }
    };

    const handleScroll = () => {
      closeContextMenu();
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, closeContextMenu]);

  if (!isOpen || !song) return null;

  const isCurrentLiked = isLiked(song.videoId);
  const isDownloaded = stats.cachedVideoIds.includes(song.videoId);

  const handlePlayNow = async () => {
    closeContextMenu();
    await playSong(song);
  };

  const handlePlayNext = async () => {
    closeContextMenu();
    await playNext(song);
  };

  const handleAddToQueue = async () => {
    closeContextMenu();
    await addToQueue(song);
  };

  const handleToggleLike = async () => {
    closeContextMenu();
    await toggleLike(song);
    showToast(
      isCurrentLiked
        ? `Removed "${song.title}" from Liked Songs`
        : `Added "${song.title}" to Liked Songs`,
      "info"
    );
  };

  const handleGoToArtist = () => {
    closeContextMenu();
    navigate(`/artist/${encodeURIComponent(song.artist)}`);
  };

  const handleGoToAlbum = () => {
    closeContextMenu();
    if (song.album) {
      navigate(`/search?q=${encodeURIComponent(song.album)}`);
    }
  };

  const handleAddToSpecificPlaylist = async (playlistId: string, playlistName: string) => {
    closeContextMenu();
    try {
      await addToPlaylist(playlistId, song);
      showToast(`Added to "${playlistName}"`, "success");
    } catch {
      showToast(`Failed to add to playlist`, "error");
    }
  };

  const handleDownload = async () => {
    closeContextMenu();
    await downloadTrack(song.videoId, song.title);
  };

  const handleCopyLink = async () => {
    closeContextMenu();
    const url = `https://music.youtube.com/watch?v=${song.videoId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", "success");
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    width: "100%",
    padding: "8px 14px",
    background: "transparent",
    border: "none",
    color: "var(--text-primary, #ffffff)",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: "8px",
    textAlign: "left",
    transition: "background 0.12s ease",
  };

  const itemHoverProps = {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = "var(--bg-surface-elevated, rgba(255, 255, 255, 0.08))";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = "transparent";
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: adjustedPos.y,
          left: adjustedPos.x,
          zIndex: 9999,
          width: 230,
          background: "var(--bg-surface, #1e1e1e)",
          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
          borderRadius: "16px",
          padding: "6px",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.55), 0 4px 12px rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(24px)",
          color: "var(--text-primary, #ffffff)",
        }}
      >
        {/* Track preview banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 10px 8px 10px",
            borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
            marginBottom: "4px",
          }}
        >
          {song.thumbnailUrl && (
            <img
              src={song.thumbnailUrl}
              alt=""
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "12px",
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
                color: "var(--text-muted, rgba(255, 255, 255, 0.55))",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {song.artist}
            </div>
          </div>
        </div>

        {/* Action items */}
        <button style={itemStyle} {...itemHoverProps} onClick={handlePlayNow}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Play size={16} />
            <span>Play Now</span>
          </div>
        </button>

        <button style={itemStyle} {...itemHoverProps} onClick={handlePlayNext}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Radio size={16} />
            <span>Play Next</span>
          </div>
        </button>

        <button style={itemStyle} {...itemHoverProps} onClick={handleAddToQueue}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ListPlus size={16} />
            <span>Add to Queue</span>
          </div>
        </button>

        <button style={itemStyle} {...itemHoverProps} onClick={handleToggleLike}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Heart
              size={16}
              fill={isCurrentLiked ? "var(--accent, #66bb6a)" : "none"}
              color={isCurrentLiked ? "var(--accent, #66bb6a)" : "currentColor"}
            />
            <span>{isCurrentLiked ? "Unlike" : "Like Song"}</span>
          </div>
        </button>

        <div
          style={{
            height: 1,
            background: "var(--border-subtle, rgba(255, 255, 255, 0.08))",
            margin: "4px 0",
          }}
        />

        <button style={itemStyle} {...itemHoverProps} onClick={handleGoToArtist}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <User size={16} />
            <span>Go to Artist</span>
          </div>
        </button>

        {song.album && (
          <button style={itemStyle} {...itemHoverProps} onClick={handleGoToAlbum}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Disc size={16} />
              <span>Go to Album</span>
            </div>
          </button>
        )}

        {/* Add to Playlist with submenu trigger */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setShowPlaylistSubmenu(true)}
          onMouseLeave={() => setShowPlaylistSubmenu(false)}
        >
          <button
            style={itemStyle}
            {...itemHoverProps}
            onClick={() => setShowPlaylistSubmenu((prev) => !prev)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FolderPlus size={16} />
              <span>Add to Playlist</span>
            </div>
            <ChevronRight size={14} opacity={0.6} />
          </button>

          {/* Submenu */}
          {showPlaylistSubmenu && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: "100%",
                marginLeft: 4,
                width: 200,
                background: "var(--bg-surface, #1e1e1e)",
                border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
                borderRadius: "14px",
                padding: "6px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.55)",
                maxHeight: "220px",
                overflowY: "auto",
                zIndex: 10000,
              }}
            >
              {playlists.length === 0 ? (
                <div
                  style={{
                    padding: "8px 12px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  No playlists created
                </div>
              ) : (
                playlists.map((pl) => (
                  <button
                    key={pl.id}
                    style={itemStyle}
                    {...itemHoverProps}
                    onClick={() => handleAddToSpecificPlaylist(pl.id, pl.name)}
                  >
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {pl.name}
                    </span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </div>

        <div
          style={{
            height: 1,
            background: "var(--border-subtle, rgba(255, 255, 255, 0.08))",
            margin: "4px 0",
          }}
        />

        <button style={itemStyle} {...itemHoverProps} onClick={handleDownload}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isDownloaded ? <Check size={16} color="var(--accent, #66bb6a)" /> : <Download size={16} />}
            <span>{isDownloaded ? "Downloaded" : "Download Offline"}</span>
          </div>
        </button>

        <button style={itemStyle} {...itemHoverProps} onClick={handleCopyLink}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Share2 size={16} />
            <span>Copy Link</span>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
