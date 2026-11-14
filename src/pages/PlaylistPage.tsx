import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Shuffle, Trash2, Edit3, ArrowLeft, Music } from "lucide-react";
import { useLibrary } from "../hooks/useLibrary";
import { usePlayer } from "../hooks/usePlayer";
import { useQueue } from "../hooks/useQueue";
import { SongCard } from "../components/SongCard";

export const PlaylistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playlists, deletePlaylist, renamePlaylist, removeFromPlaylist } = useLibrary();
  const { playSong } = usePlayer();
  const { clearQueue, addToQueue } = useQueue();

  const playlist = useMemo(
    () => playlists.find((p) => p.id === id),
    [playlists, id]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const totalDuration = useMemo(() => {
    if (!playlist) return "0 mins";
    const totalSecs = playlist.tracks.reduce(
      (acc, t) => acc + (t.durationSeconds || 0),
      0
    );
    const mins = Math.floor(totalSecs / 60);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) {
      return `${hours} hr ${remMins} min`;
    }
    return `${mins} min`;
  }, [playlist]);

  if (!playlist) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#ffffff" }}>
        <h2>Playlist not found</h2>
        <button
          onClick={() => navigate("/library")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          Back to Library
        </button>
      </div>
    );
  }

  const handlePlayAll = async (shuffle = false) => {
    if (playlist.tracks.length === 0) return;
    const tracksToPlay = [...playlist.tracks];
    if (shuffle) {
      tracksToPlay.sort(() => Math.random() - 0.5);
    }
    await clearQueue();
    const first = tracksToPlay[0];
    await playSong(first);
    for (let i = 1; i < tracksToPlay.length; i++) {
      await addToQueue(tracksToPlay[i]);
    }
  };

  const handleStartEdit = () => {
    setEditName(playlist.name);
    setEditDesc(playlist.description || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    await renamePlaylist(playlist.id, editName.trim(), editDesc.trim() || undefined);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
      await deletePlaylist(playlist.id);
      navigate("/library");
    }
  };

  return (
    <div style={{ padding: "32px 40px", color: "#ffffff", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          fontSize: "14px",
          cursor: "pointer",
          marginBottom: "24px",
          padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Playlist Header Banner */}
      <div
        style={{
          display: "flex",
          gap: "28px",
          alignItems: "flex-end",
          marginBottom: "32px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
          padding: "24px",
          borderRadius: "20px",
        }}
      >
        {/* Cover Art / Collage */}
        <div
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.05)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {playlist.tracks[0]?.thumbnailUrl ? (
            <img
              src={playlist.tracks[0].thumbnailUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Music size={48} color="rgba(255,255,255,0.3)" />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6 }}>
            Playlist
          </span>
          {!isEditing ? (
            <>
              <h1
                style={{
                  margin: "6px 0 8px",
                  fontSize: "36px",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {playlist.name}
              </h1>
              {playlist.description && (
                <p style={{ margin: "0 0 12px", fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
                  {playlist.description}
                </p>
              )}
            </>
          ) : (
            <form onSubmit={(e) => void handleSaveEdit(e)} style={{ margin: "8px 0" }}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  fontSize: "24px",
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#fff",
                  marginBottom: "8px",
                }}
              />
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description"
                style={{
                  display: "block",
                  width: "100%",
                  fontSize: "14px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#fff",
                  marginBottom: "8px",
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="submit"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "var(--accent-gradient)",
                    border: "none",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
            {playlist.tracks.length} tracks • {totalDuration}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "28px" }}>
        <button
          onClick={() => void handlePlayAll(false)}
          disabled={playlist.tracks.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--accent-gradient)",
            border: "none",
            color: "#ffffff",
            padding: "12px 28px",
            borderRadius: "24px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: playlist.tracks.length === 0 ? "not-allowed" : "pointer",
            opacity: playlist.tracks.length === 0 ? 0.5 : 1,
            boxShadow: "0 4px 16px rgba(124, 58, 237, 0.4)",
          }}
        >
          <Play size={18} fill="#ffffff" /> Play
        </button>

        <button
          onClick={() => void handlePlayAll(true)}
          disabled={playlist.tracks.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "24px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: playlist.tracks.length === 0 ? "not-allowed" : "pointer",
            opacity: playlist.tracks.length === 0 ? 0.5 : 1,
          }}
        >
          <Shuffle size={16} /> Shuffle
        </button>

        <button
          onClick={handleStartEdit}
          title="Edit Playlist"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "none",
            color: "rgba(255,255,255,0.7)",
            padding: "10px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Edit3 size={18} />
        </button>

        <button
          onClick={() => void handleDelete()}
          title="Delete Playlist"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "none",
            color: "rgba(255,255,255,0.7)",
            padding: "10px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Tracks List */}
      {playlist.tracks.length === 0 ? (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: "15px",
          }}
        >
          This playlist is empty. Add songs by clicking the "+ playlist" icon on any song!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {playlist.tracks.map((song, index) => (
            <div key={`${song.videoId}-${index}`} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <SongCard song={song} index={index} />
              </div>
              <button
                onClick={() => void removeFromPlaylist(playlist.id, song.videoId)}
                title="Remove from playlist"
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  padding: "8px 12px",
                  fontSize: "18px",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
