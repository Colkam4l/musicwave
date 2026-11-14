import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Flame, Sparkles, Compass, Radio } from "lucide-react";
import { HomeShelves } from "../types/music";
import { useLibrary } from "../hooks/useLibrary";
import { usePlayer } from "../hooks/usePlayer";
import { useRecommendations } from "../hooks/useRecommendations";
import { Spinner } from "../components/Spinner";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { recentPlays, likedSongs } = useLibrary();
  const { playSong } = usePlayer();
  const { startRadio } = useRecommendations();

  const [shelves, setShelves] = useState<HomeShelves | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    invoke<HomeShelves>("get_home_shelves")
      .then((data) => {
        if (!cancelled) {
          setShelves(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed fetching home shelves:", err);
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Combine local recents / liked for user quick picks
  const userQuickPicks = recentPlays.length > 0 ? recentPlays.slice(0, 10) : likedSongs.slice(0, 10);
  const displayedQuickPicks =
    userQuickPicks.length >= 4 ? userQuickPicks : shelves?.quickPicks.items ?? [];

  return (
    <div
      style={{
        padding: "32px 40px 100px",
        color: "#ffffff",
        maxWidth: "1380px",
        margin: "0 auto",
      }}
    >
      {/* Header Greeting */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: "34px",
            fontWeight: 800,
            background: "linear-gradient(135deg, #ffffff 40%, rgba(255, 255, 255, 0.6) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {greeting()}
        </h1>
        <p style={{ margin: 0, fontSize: "15px", color: "rgba(255, 255, 255, 0.6)" }}>
          Discover trending tracks, moods, and your personalized picks
        </p>
      </div>

      {/* Moods & Genres Quick Filter Chips */}
      {shelves?.moods && shelves.moods.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "none",
            }}
          >
            {shelves.moods.slice(0, 12).map((mood, idx) => (
              <button
                key={`${mood.title}-${idx}`}
                onClick={() => navigate(`/search?q=${encodeURIComponent(mood.title)}`)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  padding: "8px 18px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(124, 58, 237, 0.35)";
                  e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                }}
              >
                {mood.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && !shelves ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            gap: "12px",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <Spinner size={36} />
          <span>Loading recommendations...</span>
        </div>
      ) : (
        <>
          {/* Quick Picks / Listen Again */}
          {displayedQuickPicks.length > 0 && (
            <section style={{ marginBottom: "44px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={20} color="var(--accent-violet)" />
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
                    {recentPlays.length > 0 ? "Listen Again & Quick Picks" : "Quick Picks"}
                  </h2>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "12px",
                }}
              >
                {displayedQuickPicks.slice(0, 8).map((song) => (
                  <div
                    key={song.videoId}
                    onClick={() => playSong(song)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.09)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "56px",
                        height: "56px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {song.thumbnailUrl && (
                        <img
                          src={song.thumbnailUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: "3px",
                        }}
                      >
                        {song.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "rgba(255, 255, 255, 0.6)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {song.artist}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void startRadio(song);
                      }}
                      title="Start Radio"
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                        padding: "6px",
                        display: "flex",
                      }}
                    >
                      <Radio size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Trending Charts Shelf */}
          {shelves?.trending?.items && shelves.trending.items.length > 0 && (
            <section style={{ marginBottom: "44px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Flame size={20} color="#ff5722" />
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
                    Trending Charts
                  </h2>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "18px",
                }}
              >
                {shelves.trending.items.slice(0, 10).map((song, idx) => (
                  <div
                    key={song.videoId}
                    onClick={() => playSong(song)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "12px",
                      borderRadius: "16px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      cursor: "pointer",
                      transition: "all 0.25s cubic-bezier(0.2, 0, 0, 1)",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1",
                        borderRadius: "12px",
                        overflow: "hidden",
                        marginBottom: "12px",
                        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      {song.thumbnailUrl && (
                        <img
                          src={song.thumbnailUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          background: "rgba(0, 0, 0, 0.7)",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        #{idx + 1}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "4px",
                      }}
                      title={song.title}
                    >
                      {song.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.6)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={song.artist}
                    >
                      {song.artist}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Explore More Banner */}
          <section
            style={{
              padding: "28px 36px",
              borderRadius: "24px",
              background:
                "linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(236, 72, 153, 0.15) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 700 }}>
                Looking for something specific?
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>
                Search millions of songs, albums, artists, and live performances.
              </p>
            </div>
            <button
              onClick={() => navigate("/search")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                border: "none",
                color: "#0a0b0e",
                padding: "10px 22px",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              }}
            >
              <Compass size={16} /> Explore Search
            </button>
          </section>
        </>
      )}
    </div>
  );
};
