import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Music, ListMusic, Plus, Cloud, User, CheckCircle2, HardDriveDownload } from "lucide-react";
import { useLibrary } from "../hooks/useLibrary";
import { useCache } from "../hooks/useCache";
import { SongCard } from "../components/SongCard";
import { Spinner } from "../components/Spinner";

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { likedSongs, recentPlays, playlists, isLoading, createPlaylist } = useLibrary();
  const { stats } = useCache();

  const [activeTab, setActiveTab] = useState<"playlists" | "liked" | "recents" | "offline">("playlists");
  const [playlistFilter, setPlaylistFilter] = useState<"all" | "local" | "cloud">("all");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDesc, setPlaylistDesc] = useState("");

  // Gather all songs that are cached locally on disk
  const downloadedSongs = useMemo(() => {
    const songMap = new Map();
    // Check liked songs
    for (const s of likedSongs) {
      if (stats.cachedVideoIds.includes(s.videoId)) {
        songMap.set(s.videoId, s);
      }
    }
    // Check recent plays
    for (const s of recentPlays) {
      if (stats.cachedVideoIds.includes(s.videoId) && !songMap.has(s.videoId)) {
        songMap.set(s.videoId, s);
      }
    }
    // Check playlists
    for (const pl of playlists) {
      for (const s of pl.tracks) {
        if (stats.cachedVideoIds.includes(s.videoId) && !songMap.has(s.videoId)) {
          songMap.set(s.videoId, s);
        }
      }
    }
    return Array.from(songMap.values());
  }, [likedSongs, recentPlays, playlists, stats.cachedVideoIds]);

  const filteredPlaylists = useMemo(() => {
    if (playlistFilter === "local") {
      return playlists.filter((p) => !p.isCloud);
    }
    if (playlistFilter === "cloud") {
      return playlists.filter((p) => Boolean(p.isCloud));
    }
    return playlists;
  }, [playlists, playlistFilter]);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;
    const pl = await createPlaylist(playlistName.trim(), playlistDesc.trim() || undefined);
    setPlaylistName("");
    setPlaylistDesc("");
    setIsCreatingPlaylist(false);
    navigate(`/playlist/${pl.id}`);
  };

  if (isLoading && likedSongs.length === 0 && recentPlays.length === 0 && playlists.length === 0) {
    return (
      <div style={{ padding: "4rem 1.5rem" }}>
        <Spinner label="Loading your library..." />
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        width: "100%",
        maxWidth: "960px",
        margin: "0 auto",
        padding: "2rem 1.75rem 4rem 1.75rem",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "var(--font-size-xl)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: "0.35rem",
          }}
        >
          Your Library
        </h1>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
          Custom playlists, liked tracks, and listening history saved locally.
        </p>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "1.25rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "8px",
          }}
        >
          <button
            onClick={() => setActiveTab("playlists")}
            style={{
              background: activeTab === "playlists" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "playlists" ? "var(--accent-rose)" : "var(--text-secondary)",
              border: "none",
              padding: "6px 16px",
              borderRadius: "16px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Playlists ({playlists.length})
          </button>
          <button
            onClick={() => setActiveTab("liked")}
            style={{
              background: activeTab === "liked" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "liked" ? "var(--accent-rose)" : "var(--text-secondary)",
              border: "none",
              padding: "6px 16px",
              borderRadius: "16px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Liked Songs ({likedSongs.length})
          </button>
          <button
            onClick={() => setActiveTab("recents")}
            style={{
              background: activeTab === "recents" ? "rgba(124, 58, 237, 0.2)" : "transparent",
              color: activeTab === "recents" ? "var(--accent-rose)" : "var(--text-secondary)",
              border: "none",
              padding: "6px 16px",
              borderRadius: "16px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Recently Played ({recentPlays.length})
          </button>
          <button
            onClick={() => setActiveTab("offline")}
            style={{
              background: activeTab === "offline" ? "rgba(16, 185, 129, 0.2)" : "transparent",
              color: activeTab === "offline" ? "#10b981" : "var(--text-secondary)",
              border: "none",
              padding: "6px 16px",
              borderRadius: "16px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={15} color={activeTab === "offline" ? "#10b981" : "currentColor"} />
            <span>Downloaded ({stats.trackCount})</span>
          </button>
        </div>
      </header>

      {/* Playlists Tab */}
      {activeTab === "playlists" && (
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <ListMusic size={18} color="var(--accent-rose)" />
                <h2 style={{ fontSize: "var(--font-size-md)", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Playlists
                </h2>
              </div>

              {/* Source Filters */}
              <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.05)", padding: "2px", borderRadius: "12px" }}>
                <button
                  onClick={() => setPlaylistFilter("all")}
                  style={{
                    border: "none",
                    background: playlistFilter === "all" ? "rgba(255,255,255,0.12)" : "transparent",
                    color: playlistFilter === "all" ? "#fff" : "var(--text-muted)",
                    padding: "3px 10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  All ({playlists.length})
                </button>
                <button
                  onClick={() => setPlaylistFilter("local")}
                  style={{
                    border: "none",
                    background: playlistFilter === "local" ? "rgba(255,255,255,0.12)" : "transparent",
                    color: playlistFilter === "local" ? "#fff" : "var(--text-muted)",
                    padding: "3px 10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <User size={11} /> Local
                </button>
                <button
                  onClick={() => setPlaylistFilter("cloud")}
                  style={{
                    border: "none",
                    background: playlistFilter === "cloud" ? "rgba(16, 185, 129, 0.2)" : "transparent",
                    color: playlistFilter === "cloud" ? "#10b981" : "var(--text-muted)",
                    padding: "3px 10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Cloud size={11} /> Cloud
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsCreatingPlaylist(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--accent-gradient)",
                border: "none",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(124, 58, 237, 0.3)",
              }}
            >
              <Plus size={16} /> New Playlist
            </button>
          </div>

          {/* Create Modal / Form */}
          {isCreatingPlaylist && (
            <form
              onSubmit={(e) => void handleCreatePlaylist(e)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>Create New Playlist</h3>
              <input
                type="text"
                placeholder="Playlist name (required)"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                autoFocus
                required
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={playlistDesc}
                onChange={(e) => setPlaylistDesc(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  fontSize: "14px",
                }}
              />
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(false)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "6px 16px",
                    borderRadius: "8px",
                    background: "var(--accent-gradient)",
                    border: "none",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {filteredPlaylists.length === 0 ? (
            <div
              style={{
                padding: "3rem 1.5rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px dashed var(--border-subtle)",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              No playlists found in this view. Click "+ New Playlist" to create one!
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {filteredPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => navigate(`/playlist/${pl.id}`)}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "16px",
                    padding: "16px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      marginBottom: "12px",
                      boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
                      position: "relative",
                    }}
                  >
                    {pl.tracks[0]?.thumbnailUrl ? (
                      <img
                        src={pl.tracks[0].thumbnailUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Music size={36} color="rgba(255,255,255,0.3)" />
                    )}

                    {/* Source Pill */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        background: pl.isCloud ? "rgba(16, 185, 129, 0.85)" : "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(4px)",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {pl.isCloud ? (
                        <>
                          <Cloud size={11} /> Synced
                        </>
                      ) : (
                        <>
                          <User size={11} /> Local
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {pl.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                    {pl.tracks.length} tracks
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Liked Songs Tab */}
      {activeTab === "liked" && (
        <section>
          {likedSongs.length === 0 ? (
            <div
              style={{
                padding: "3rem 1.5rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px dashed var(--border-subtle)",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              No liked songs yet. Click the heart icon on any track to save it here.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {likedSongs.map((song, index) => (
                <SongCard key={song.videoId} song={song} index={index} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recently Played Tab */}
      {activeTab === "recents" && (
        <section>
          {recentPlays.length === 0 ? (
            <div
              style={{
                padding: "3rem 1.5rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px dashed var(--border-subtle)",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              No recently played history yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {recentPlays.map((song, index) => (
                <SongCard key={`${song.videoId}-${index}`} song={song} index={index} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Downloaded Offline Tab */}
      {activeTab === "offline" && (
        <section>
          {downloadedSongs.length === 0 ? (
            <div
              style={{
                padding: "3rem 1.5rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px dashed var(--border-subtle)",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              <HardDriveDownload size={32} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
              <div>No downloaded tracks found in local cache.</div>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                Click the download icon next to any song to cache it for offline listening.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {downloadedSongs.map((song, index) => (
                <SongCard key={`offline-${song.videoId}-${index}`} song={song} index={index} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

