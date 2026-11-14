import React, { useEffect, useRef } from "react";
import { useLyrics } from "../hooks/useLyrics";
import { usePlayer } from "../hooks/usePlayer";
import { Spinner } from "./Spinner";

interface LyricsSheetProps {
  onClose?: () => void;
}

export const LyricsSheet: React.FC<LyricsSheetProps> = () => {
  const { lyrics, isLoading, activeLyricIndex, hasSyncedLyrics, hasPlainLyrics } =
    useLyrics();
  const { seekTo, currentSong } = usePlayer();
  const activeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active lyric line to center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLyricIndex]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "280px",
          color: "rgba(255,255,255,0.6)",
          gap: "12px",
        }}
      >
        <Spinner size={32} />
        <span>Loading lyrics...</span>
      </div>
    );
  }

  if (!hasSyncedLyrics && !hasPlainLyrics) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "280px",
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
          padding: "24px",
          gap: "8px",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <p style={{ margin: 0, fontSize: "16px", fontWeight: 500 }}>
          No lyrics available for this track
        </p>
        <span style={{ fontSize: "13px", opacity: 0.7 }}>
          {currentSong ? `"${currentSong.title}" by ${currentSong.artist}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "24px 16px",
        maxHeight: "100%",
        overflowY: "auto",
        scrollBehavior: "smooth",
        maskImage:
          "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
      }}
    >
      {hasSyncedLyrics && lyrics?.syncedLyrics ? (
        lyrics.syncedLyrics.map((line, idx) => {
          const isActive = idx === activeLyricIndex;
          const isPassed = activeLyricIndex > idx;

          return (
            <div
              key={`${line.time}-${idx}`}
              ref={isActive ? activeLineRef : undefined}
              onClick={() => seekTo(line.time)}
              style={{
                fontSize: isActive ? "22px" : "18px",
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? "#ffffff"
                  : isPassed
                  ? "rgba(255, 255, 255, 0.45)"
                  : "rgba(255, 255, 255, 0.25)",
                transform: isActive ? "scale(1.02)" : "scale(1)",
                transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: isActive
                  ? "rgba(255, 255, 255, 0.08)"
                  : "transparent",
                lineHeight: 1.4,
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = isPassed
                    ? "rgba(255, 255, 255, 0.45)"
                    : "rgba(255, 255, 255, 0.25)";
                }
              }}
            >
              {line.text || "♪"}
            </div>
          );
        })
      ) : (
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: "17px",
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.85)",
            padding: "8px 16px",
          }}
        >
          {lyrics?.plainLyrics}
        </div>
      )}

      {lyrics?.source && (
        <div
          style={{
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.35)",
            textAlign: "center",
            marginTop: "24px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Lyrics sourced from {lyrics.source.toUpperCase()}
        </div>
      )}
    </div>
  );
};

