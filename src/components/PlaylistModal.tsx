import React, { useState } from "react";
import { useLibrary } from "../hooks/useLibrary";
import { Song } from "../types/music";

interface PlaylistModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  song,
  isOpen,
  onClose,
}) => {
  const { playlists, createPlaylist, addToPlaylist } = useLibrary();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  if (!isOpen || !song) return null;

  const handleSelectPlaylist = async (playlistId: string) => {
    await addToPlaylist(playlistId, song);
    onClose();
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = await createPlaylist(newTitle.trim(), newDesc.trim() || undefined);
    await addToPlaylist(created.id, song);
    setIsCreating(false);
    setNewTitle("");
    setNewDesc("");
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#16181f",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "20px",
          padding: "24px",
          color: "#ffffff",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
            Add to Playlist
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <p
          style={{
            margin: "0 0 16px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.65)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Adding "{song.title}"
        </p>

        {!isCreating ? (
          <>
            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              {playlists.length === 0 ? (
                <div
                  style={{
                    padding: "24px 0",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "13px",
                  }}
                >
                  No playlists yet. Create one below!
                </div>
              ) : (
                playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => void handleSelectPlaylist(pl.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      color: "#ffffff",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.05)")
                    }
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>
                        {pl.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        {pl.tracks.length} tracks
                      </div>
                    </div>
                    <span style={{ fontSize: "16px", opacity: 0.7 }}>+</span>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setIsCreating(true)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "12px",
                border: "none",
                background: "var(--accent-gradient)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Create New Playlist
            </button>
          </>
        ) : (
          <form onSubmit={(e) => void handleCreateAndAdd(e)}>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "4px",
                }}
              >
                Playlist Name
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="My Awesome Playlist"
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "4px",
                }}
              >
                Description (Optional)
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Chill tracks for coding"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--accent-gradient)",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Create & Add
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
