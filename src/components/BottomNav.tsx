import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Heart, PlayCircle, Search, Settings } from "lucide-react";
import { M3Tokens } from "../theme/tokens";
import { useThemeStore } from "../store/themeStore";

interface BottomNavProps {
  isPlayerOpen: boolean;
  onOpenNowPlaying: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  isPlayerOpen,
  onOpenNowPlaying,
}) => {
  const { reducedMotion } = useThemeStore();

  const NAV_ITEMS = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/search", label: "Search", icon: Search, end: false },
    { to: "/library", label: "Library", icon: Heart, end: false },
    { to: "/settings", label: "Settings", icon: Settings, end: false },
  ];

  return (
    <nav
      className="bottom-nav"
      aria-label="Mobile navigation"
      style={{
        background: "var(--md-sys-color-surface-container, #1e1b27)",
        borderTop:
          "1px solid var(--md-sys-color-outline-variant, rgba(255, 255, 255, 0.08))",
        boxShadow: M3Tokens.elevation.level2,
      }}
    >
      {NAV_ITEMS.slice(0, 3).map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="bottom-nav-item"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            textDecoration: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "4px 0",
            position: "relative",
          }}
        >
          {({ isActive }) => {
            const active = isActive && !isPlayerOpen;
            return (
              <>
                <div
                  style={{
                    position: "relative",
                    width: 56,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="m3-bottom-active"
                      transition={
                        reducedMotion ? { duration: 0 } : M3Tokens.motion.expressiveSpring
                      }
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: M3Tokens.shape.cornerFull,
                        background:
                          "var(--md-sys-color-secondary-container, rgba(124, 58, 237, 0.25))",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <Icon
                    size={20}
                    color={
                      active
                        ? "var(--md-sys-color-on-secondary-container, #ffffff)"
                        : "var(--md-sys-color-on-surface-variant, #cac4d0)"
                    }
                    style={{ position: "relative", zIndex: 1 }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: active ? 700 : 500,
                    color: active
                      ? "var(--md-sys-color-on-surface, #ffffff)"
                      : "var(--md-sys-color-on-surface-variant, #cac4d0)",
                  }}
                >
                  {label}
                </span>
              </>
            );
          }}
        </NavLink>
      ))}

      {/* Playing Tab Button */}
      <button
        type="button"
        onClick={onOpenNowPlaying}
        className="bottom-nav-item"
        aria-label="Open full-screen player"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "4px 0",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 56,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPlayerOpen && (
            <motion.div
              layoutId="m3-bottom-active"
              transition={
                reducedMotion ? { duration: 0 } : M3Tokens.motion.expressiveSpring
              }
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: M3Tokens.shape.cornerFull,
                background:
                  "var(--md-sys-color-secondary-container, rgba(124, 58, 237, 0.25))",
                zIndex: 0,
              }}
            />
          )}
          <PlayCircle
            size={20}
            color={
              isPlayerOpen
                ? "var(--md-sys-color-on-secondary-container, #ffffff)"
                : "var(--md-sys-color-on-surface-variant, #cac4d0)"
            }
            style={{ position: "relative", zIndex: 1 }}
          />
        </div>
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: isPlayerOpen ? 700 : 500,
            color: isPlayerOpen
              ? "var(--md-sys-color-on-surface, #ffffff)"
              : "var(--md-sys-color-on-surface-variant, #cac4d0)",
          }}
        >
          Playing
        </span>
      </button>

      {/* Settings Nav Item */}
      <NavLink
        to="/settings"
        className="bottom-nav-item"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          textDecoration: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "4px 0",
          position: "relative",
        }}
      >
        {({ isActive }) => {
          const active = isActive && !isPlayerOpen;
          return (
            <>
              <div
                style={{
                  position: "relative",
                  width: 56,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="m3-bottom-active"
                    transition={
                      reducedMotion ? { duration: 0 } : M3Tokens.motion.expressiveSpring
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: M3Tokens.shape.cornerFull,
                      background:
                        "var(--md-sys-color-secondary-container, rgba(124, 58, 237, 0.25))",
                      zIndex: 0,
                    }}
                  />
                )}
                <Settings
                  size={20}
                  color={
                    active
                      ? "var(--md-sys-color-on-secondary-container, #ffffff)"
                      : "var(--md-sys-color-on-surface-variant, #cac4d0)"
                  }
                  style={{ position: "relative", zIndex: 1 }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: active ? 700 : 500,
                  color: active
                    ? "var(--md-sys-color-on-surface, #ffffff)"
                    : "var(--md-sys-color-on-surface-variant, #cac4d0)",
                }}
              >
                Settings
              </span>
            </>
          );
        }}
      </NavLink>
    </nav>
  );
};
