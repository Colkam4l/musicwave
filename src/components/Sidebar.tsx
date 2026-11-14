import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Heart, ListMusic, Search, Settings } from "lucide-react";
import { useQueue } from "../hooks/useQueue";
import { ProfileMenu } from "./ProfileMenu";
import { M3Tokens } from "../theme/tokens";
import { useThemeStore } from "../store/themeStore";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search, end: false },
  { to: "/library", label: "Library", icon: Heart, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

export const Sidebar: React.FC = () => {
  const { queue, isQueueOpen, toggleQueueOpen } = useQueue();
  const { reducedMotion } = useThemeStore();

  return (
    <aside
      className="sidebar"
      style={{
        width: 220,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "calc(100vh - 80px)",
        background: "var(--md-sys-color-surface-container-low, var(--bg-surface))",
        borderRight: "1px solid var(--md-sys-color-outline-variant, var(--border-subtle))",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "1.5rem 0.85rem",
        transition: "background 0.3s cubic-bezier(0.2, 0, 0, 1)",
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
              width: 38,
              height: 38,
              borderRadius: M3Tokens.shape.cornerMedium,
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
                fontSize: "1rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--md-sys-color-on-surface, var(--text-primary))",
                lineHeight: 1.2,
              }}
            >
              MusicWave
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--md-sys-color-on-surface-variant, var(--text-muted))",
                fontWeight: 500,
              }}
            >
              Expressive Edition
            </div>
          </div>
        </div>

        {/* Navigation Links with M3 Expressive Floating Active Pill */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                padding: "0.65rem 1rem",
                minHeight: 44,
                borderRadius: M3Tokens.shape.cornerFull,
                textDecoration: "none",
                fontSize: "0.875rem",
                outline: "none",
                transition: "color 0.2s ease",
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="m3-sidebar-active"
                      transition={
                        reducedMotion ? { duration: 0 } : M3Tokens.motion.expressiveSpring
                      }
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: M3Tokens.shape.cornerFull,
                        background:
                          "var(--md-sys-color-secondary-container, rgba(124, 58, 237, 0.2))",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive
                        ? "var(--md-sys-color-on-secondary-container, #ffffff)"
                        : "var(--md-sys-color-on-surface-variant, var(--text-secondary))",
                    }}
                  >
                    <Icon
                      size={18}
                      color={
                        isActive
                          ? "var(--md-sys-color-primary, var(--accent-rose))"
                          : "currentColor"
                      }
                      style={{ flexShrink: 0 }}
                    />
                    <span>{label}</span>
                  </span>
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
            padding: "0.7rem 1rem",
            borderRadius: M3Tokens.shape.cornerFull,
            border: isQueueOpen
              ? "1px solid var(--md-sys-color-primary, rgba(233, 30, 140, 0.4))"
              : "1px solid var(--md-sys-color-outline-variant, var(--border-subtle))",
            background: isQueueOpen
              ? "var(--md-sys-color-primary-container, rgba(233, 30, 140, 0.14))"
              : "var(--md-sys-color-surface-container, var(--bg-surface-elevated))",
            color: isQueueOpen
              ? "var(--md-sys-color-on-primary-container, var(--text-inverse))"
              : "var(--md-sys-color-on-surface-variant, var(--text-secondary))",
            cursor: "pointer",
            fontSize: "0.84rem",
            fontWeight: 600,
            transition: "var(--transition-fast)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <ListMusic
              size={18}
              color={
                isQueueOpen
                  ? "var(--md-sys-color-primary, var(--accent-rose))"
                  : "currentColor"
              }
            />
            <span>Queue</span>
          </span>
          {queue.length > 0 && (
            <span
              style={{
                minWidth: 22,
                height: 22,
                padding: "0 6px",
                borderRadius: M3Tokens.shape.cornerFull,
                background:
                  "var(--md-sys-color-primary, var(--accent-gradient))",
                color: "var(--md-sys-color-on-primary, #ffffff)",
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
