import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Heart, ListMusic, Search, Settings } from "lucide-react";
import { useQueue } from "../hooks/useQueue";
import { ProfileMenu } from "./ProfileMenu";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search, end: false },
  { to: "/library", label: "Library", icon: Heart, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

export const Sidebar: React.FC = () => {
  const { queue, isQueueOpen, toggleQueueOpen } = useQueue();

  return (
    <aside
      className="sidebar"
      style={{
        width: 220,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "calc(100vh - 80px)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "1.5rem 1rem",
      }}
    >
      <div>
        {/* Brand Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0 0.5rem 1.75rem 0.5rem",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px var(--accent-glow)",
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--font-size-md)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
            >
              MusicWave
            </div>
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--text-muted)",
              }}
            >
              YouTube Music
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.7rem 0.85rem",
                minHeight: 44,
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                fontSize: "var(--font-size-sm)",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--text-inverse)" : "var(--text-secondary)",
                background: isActive
                  ? "rgba(124, 58, 237, 0.18)"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(124, 58, 237, 0.35)"
                  : "1px solid transparent",
                boxShadow: isActive ? "0 0 18px rgba(124, 58, 237, 0.15)" : "none",
                transition: "var(--transition-fast)",
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    color={isActive ? "var(--accent-rose)" : "currentColor"}
                    style={{ flexShrink: 0 }}
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <ProfileMenu />

        {/* Queue Drawer Toggle */}
        <button
          type="button"
          onClick={toggleQueueOpen}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          minHeight: 44,
          padding: "0.7rem 0.85rem",
          borderRadius: "var(--radius-md)",
          border: isQueueOpen
            ? "1px solid rgba(233, 30, 140, 0.4)"
            : "1px solid var(--border-subtle)",
          background: isQueueOpen
            ? "rgba(233, 30, 140, 0.14)"
            : "var(--bg-surface-elevated)",
          color: isQueueOpen ? "var(--text-inverse)" : "var(--text-secondary)",
          cursor: "pointer",
          fontSize: "var(--font-size-sm)",
          fontWeight: 600,
          transition: "var(--transition-fast)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <ListMusic
            size={18}
            color={isQueueOpen ? "var(--accent-rose)" : "currentColor"}
          />
          <span>Queue</span>
        </span>
        {queue.length > 0 && (
          <span
            style={{
              minWidth: 22,
              height: 22,
              padding: "0 6px",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-gradient)",
              color: "#ffffff",
              fontSize: "0.7rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {queue.length}
          </span>
        )}
      </button>
      </div>
    </aside>
  );
};

