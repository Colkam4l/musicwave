import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Flame, Sparkles, Compass, Radio } from "lucide-react";
import { HomeShelves } from "../types/music";
import { useLibrary } from "../hooks/useLibrary";
import { usePlayer } from "../hooks/usePlayer";
import { useRecommendations } from "../hooks/useRecommendations";
import { Spinner } from "../components/Spinner";
import { ExpressiveChip } from "../components/common/ExpressiveChip";
import { ExpressiveButton } from "../components/common/ExpressiveButton";
import { TonalCard } from "../components/common/TonalCard";
import { M3Tokens } from "../theme/tokens";

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
              <ExpressiveChip
                key={`${mood.title}-${idx}`}
                label={mood.title}
                onClick={() => navigate(`/search?q=${encodeURIComponent(mood.title)}`)}
              />
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
                  <TonalCard
                    key={song.videoId}
                    level="low"
                    rounded="xl"
                    interactive
                    onClick={() => playSong(song)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "56px",
                        height: "56px",
                        borderRadius: "10px",
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
                          color: "var(--md-sys-color-on-surface, #e6e0ea)",
                        }}
                      >
                        {song.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--md-sys-color-on-surface-variant, #cac4d0)",
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
                        color: "var(--md-sys-color-on-surface-variant, rgba(255,255,255,0.5))",
                        cursor: "pointer",
                        padding: "6px",
                        display: "flex",
                      }}
                    >
                      <Radio size={16} />
                    </button>
                  </TonalCard>
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
                  <TonalCard
                    key={song.videoId}
                    level="low"
                    rounded="xl"
                    interactive
                    onClick={() => playSong(song)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      padding: "12px",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1",
                        borderRadius: "14px",
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
                          background: "var(--md-sys-color-surface-container-highest, rgba(0, 0, 0, 0.75))",
                          color: "var(--md-sys-color-primary, #d0bcff)",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: M3Tokens.shape.cornerFull,
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
                        color: "var(--md-sys-color-on-surface, #e6e0ea)",
                      }}
                      title={song.title}
                    >
                      {song.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--md-sys-color-on-surface-variant, #cac4d0)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={song.artist}
                    >
                      {song.artist}
                    </div>
                  </TonalCard>
                ))}
              </div>
            </section>
          )}

          {/* Explore More Banner */}
          <section
            style={{
              padding: "28px 36px",
              borderRadius: M3Tokens.shape.cornerExtraLarge,
              background: "var(--md-sys-color-surface-container-high, #272332)",
              border: "1px solid var(--md-sys-color-outline-variant, rgba(255, 255, 255, 0.1))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: M3Tokens.elevation.level2,
            }}
          >
            <div>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--md-sys-color-on-surface, #e6e0ea)",
                }}
              >
                Looking for something specific?
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "var(--md-sys-color-on-surface-variant, #cac4d0)",
                }}
              >
                Search millions of songs, albums, artists, and live performances.
              </p>
            </div>
            <ExpressiveButton
              variant="filled"
              size="md"
              onClick={() => navigate("/search")}
              icon={<Compass size={16} />}
            >
              Explore Search
            </ExpressiveButton>
          </section>
        </>
      )}
    </div>
  );
};
