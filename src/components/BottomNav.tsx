import React from "react";
import { NavLink } from "react-router-dom";
import { Heart, PlayCircle, Search, Settings } from "lucide-react";

interface BottomNavProps {
  isPlayerOpen: boolean;
  onOpenNowPlaying: () => void;
}

const navItemStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  minWidth: 44,
  minHeight: 44,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.2rem",
  textDecoration: "none",
  border: "none",
  background: "transparent",
  color: active ? "var(--accent-rose)" : "var(--text-secondary)",
  fontSize: "0.7rem",
  fontWeight: active ? 700 : 500,
  cursor: "pointer",
  padding: "0.25rem",
});

/**
 * Mobile bottom navigation bar replacing the desktop Sidebar.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  isPlayerOpen,
  onOpenNowPlaying,
}) => {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <NavLink
        to="/"
        end
        className="bottom-nav-item"
        style={({ isActive }) => navItemStyle(isActive && !isPlayerOpen)}
      >
        <Search size={20} />
        <span>Search</span>
      </NavLink>

      <NavLink
        to="/library"
        className="bottom-nav-item"
        style={({ isActive }) => navItemStyle(isActive && !isPlayerOpen)}
      >
        <Heart size={20} />
        <span>Library</span>
      </NavLink>

      <button
        type="button"
        onClick={onOpenNowPlaying}
        className="bottom-nav-item"
        style={navItemStyle(isPlayerOpen)}
        aria-label="Open full-screen player"
      >
        <PlayCircle size={20} />
        <span>Now Playing</span>
      </button>

      <NavLink
        to="/settings"
        className="bottom-nav-item"
        style={({ isActive }) => navItemStyle(isActive && !isPlayerOpen)}
      >
        <Settings size={20} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
};

