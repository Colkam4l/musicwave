import React, { useState, useRef, useEffect } from "react";
import {
  User,
  ChevronDown,
  RefreshCw,
  Plus,
  Check,
  Settings,
  WifiOff,
  Cloud,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSync } from "../hooks/useSync";
import { useCache } from "../hooks/useCache";
import { useNavigate } from "react-router-dom";

export const ProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const { activeProfile, profiles, switchProfile, openAuthModal } = useAuth();
  const { syncLibrary, isSyncing } = useSync();
  const { isOffline } = useCache();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSyncNow = async () => {
    try {
      await syncLibrary();
    } catch {
      // toast is handled in useSync
    }
  };

  const displayName = activeProfile?.displayName || "Local User";
  const avatarStyle = activeProfile?.avatarUrl || "linear-gradient(135deg, #7c3aed, #ec4899)";
  const isLinked = Boolean(activeProfile?.linkedAccount);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      {/* Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 10px",
          borderRadius: "var(--radius-full, 9999px)",
          background: "var(--bg-surface-elevated, #27272a)",
          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
          color: "var(--text-primary, #ffffff)",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          transition: "var(--transition-fast, all 0.2s)",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: avatarStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "0.75rem",
            color: "#ffffff",
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        <span
          style={{
            maxWidth: 100,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </span>

        {isOffline ? (
          <span title="Offline Mode" style={{ display: "inline-flex" }}>
            <WifiOff size={13} color="#f59e0b" />
          </span>
        ) : isLinked ? (
          <span title="Synced with YouTube Music" style={{ display: "inline-flex" }}>
            <Cloud size={13} color="#10b981" />
          </span>
        ) : null}

        <ChevronDown size={14} color="var(--text-muted, #a1a1aa)" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            width: 250,
            background: "var(--bg-surface-elevated, #18181b)",
            border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
            borderRadius: "var(--radius-md, 12px)",
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.5)",
            padding: "0.75rem",
            zIndex: 1000,
            color: "var(--text-primary, #ffffff)",
          }}
        >
          {/* Header Info */}
          <div
            style={{
              paddingBottom: "0.6rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{displayName}</div>
            <div
              style={{
                fontSize: "0.74rem",
                color: isOffline
                  ? "#f59e0b"
                  : isLinked
                  ? "#10b981"
                  : "var(--text-muted, #a1a1aa)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "2px",
              }}
            >
              {isOffline ? (
                <>
                  <WifiOff size={12} /> Offline Mode
                </>
              ) : isLinked ? (
                <>
                  <Cloud size={12} /> Synced with YouTube
                </>
              ) : (
                <>
                  <User size={12} /> Local Profile Only
                </>
              )}
            </div>
          </div>

          {/* Sync Button (if linked) */}
          {isLinked && (
            <button
              onClick={() => {
                handleSyncNow();
                setIsOpen(false);
              }}
              disabled={isSyncing}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.5rem 0.6rem",
                borderRadius: "var(--radius-sm, 6px)",
                border: "none",
                background: "rgba(124, 58, 237, 0.15)",
                color: "var(--accent-rose, #ec4899)",
                cursor: isSyncing ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: isSyncing ? "spin 1s linear infinite" : "none",
                }}
              />
              <span>{isSyncing ? "Syncing..." : "Sync Cloud Library"}</span>
            </button>
          )}

          {/* Profiles Switcher Header */}
          <div
            style={{
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted, #a1a1aa)",
              fontWeight: 700,
              padding: "0.2rem 0.4rem",
            }}
          >
            Switch Profile
          </div>

          <div style={{ maxHeight: 120, overflowY: "auto", margin: "0.2rem 0" }}>
            {profiles.map((p) => {
              const active = p.id === activeProfile?.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    switchProfile(p.id);
                    setIsOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.45rem 0.5rem",
                    borderRadius: "var(--radius-sm, 6px)",
                    border: "none",
                    background: active
                      ? "rgba(255, 255, 255, 0.08)"
                      : "transparent",
                    color: active ? "#ffffff" : "var(--text-secondary, #d4d4d8)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background:
                          p.avatarUrl || "linear-gradient(135deg, #7c3aed, #ec4899)",
                        fontSize: "0.65rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      {p.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span>{p.displayName}</span>
                  </div>
                  {active && <Check size={14} color="#10b981" />}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: "0.4rem",
              marginTop: "0.4rem",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                openAuthModal();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.45rem 0.5rem",
                borderRadius: "var(--radius-sm, 6px)",
                border: "none",
                background: "transparent",
                color: "var(--text-secondary, #d4d4d8)",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              <Plus size={14} />
              <span>Create / Link Account</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/settings");
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.45rem 0.5rem",
                borderRadius: "var(--radius-sm, 6px)",
                border: "none",
                background: "transparent",
                color: "var(--text-secondary, #d4d4d8)",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              <Settings size={14} />
              <span>Settings & Cache</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
