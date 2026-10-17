import React from "react";
import { SearchBar } from "../components/SearchBar";
import { SongList } from "../components/SongList";
import { useSearch } from "../hooks/useSearch";
import { Song } from "../types/music";

export const SearchPage: React.FC = () => {
  const {
    query,
    results,
    isLoading,
    error,
    hasSearched,
    search,
    clearSearch,
  } = useSearch();

  const handleSelectSong = (song: Song) => {
    // In Sprint 1, song selection logs / toasts (Sprint 2 will wire audio playback)
    console.log("Selected song for playback (Sprint 2):", song);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        padding: "2rem 1.5rem 4rem 1.5rem",
      }}
    >
      {/* Search Header */}
      <header
        style={{
          width: "100%",
          maxWidth: "860px",
          margin: "0 auto 2.5rem auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "var(--radius-sm)",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px var(--accent-glow)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontSize: "var(--font-size-lg)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                }}
              >
                MusicWave
              </h1>
              <span
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--text-muted)",
                }}
              >
                YouTube Music Client
              </span>
            </div>
          </div>
        </div>

        <SearchBar
          initialQuery={query}
          isLoading={isLoading}
          onSearch={(q) => search(q)}
          onClear={clearSearch}
        />
      </header>

      {/* Results Content */}
      <main style={{ flex: 1 }}>
        <SongList
          songs={results}
          isLoading={isLoading}
          error={error}
          hasSearched={hasSearched}
          query={query}
          onSelectSong={handleSelectSong}
        />
      </main>
    </div>
  );
};
