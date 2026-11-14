import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Settings as SettingsIcon,
  KeyRound,
  CheckCircle2,
  Save,
  Loader2,
  Info,
  ExternalLink,
  User,
  Cloud,
  RefreshCw,
  HardDriveDownload,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "../components/Toast";
import { usePlatform } from "../hooks/usePlatform";
import { useAuth } from "../hooks/useAuth";
import { useSync } from "../hooks/useSync";
import { useCache } from "../hooks/useCache";

interface AppSettings {
  cookie: string | null;
  userAgent: string | null;
  poToken: string | null;
}

const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0";

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.4rem",
  color: "var(--text-primary)",
  fontSize: "var(--font-size-sm)",
  fontWeight: 600,
};

const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 0.875rem",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: "var(--font-size-sm)",
  fontFamily: "var(--font-family)",
  outline: "none",
  boxSizing: "border-box",
};

/**
 * Settings view for YouTube Music authentication credentials, connection verification, and app metadata.
 */
export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const { isMobile } = usePlatform();
  const { activeProfile, openAuthModal, disconnectYoutubeAccount } = useAuth();
  const { syncLibrary, isSyncing } = useSync();
  const { stats, clearCache } = useCache();

  const [cookie, setCookie] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [poToken, setPoToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    let active = true;
    invoke<AppSettings>("get_settings")
      .then((loaded) => {
        if (!active) return;
        setCookie(loaded.cookie ?? "");
        setUserAgent(loaded.userAgent ?? "");
        setPoToken(loaded.poToken ?? "");
      })
      .catch((err) => {
        if (active) {
          showToast(`Failed loading settings: ${String(err)}`, "error");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const saved = await invoke<AppSettings>("save_settings", {
        settings: {
          cookie: cookie.trim() || null,
          userAgent: userAgent.trim() || null,
          poToken: poToken.trim() || null,
        },
      });
      setCookie(saved.cookie ?? "");
      setUserAgent(saved.userAgent ?? "");
      setPoToken(saved.poToken ?? "");
      showToast("Settings saved. Active immediately.", "success");
    } catch (err) {
      showToast(`Failed saving settings: ${String(err)}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const results = await invoke<unknown[]>("search_songs", { query: "test" });
      showToast(
        `Connection OK (${results.length} results returned).`,
        "success"
      );
    } catch (err) {
      showToast(`Connection failed: ${String(err)}`, "error", 5000);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "780px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.75rem",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-inverse)",
            boxShadow: "0 4px 14px var(--accent-glow)",
          }}
        >
          <SettingsIcon size={20} />
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--font-size-xl)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Settings
          </h1>
          <p
            style={{
              margin: "0.15rem 0 0",
              color: "var(--text-secondary)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Configure authentication headers and inspect application details
          </p>
        </div>
      </header>

      {/* Profile & Account Sync Section (Bitchord Model) */}
      <section
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={18} style={{ color: "var(--accent)" }} />
            <h2
              style={{
                margin: 0,
                fontSize: "var(--font-size-md)",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Account & Profile
            </h2>
          </div>

          <button
            type="button"
            onClick={openAuthModal}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-surface-elevated)",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Switch / Add Profile
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background:
                  activeProfile?.avatarUrl ||
                  "linear-gradient(135deg, #7c3aed, #ec4899)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              }}
            >
              {(activeProfile?.displayName || "L").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>
                {activeProfile?.displayName || "Local User"}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: activeProfile?.linkedAccount
                    ? "#10b981"
                    : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "2px",
                }}
              >
                {activeProfile?.linkedAccount ? (
                  <>
                    <Cloud size={13} /> Linked with YouTube Music
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} /> Local Guest Mode (Offline Ready)
                  </>
                )}
              </div>
            </div>
          </div>

          {activeProfile?.linkedAccount ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => void syncLibrary()}
                disabled={isSyncing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "16px",
                  border: "none",
                  background: "var(--accent-gradient)",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: isSyncing ? "not-allowed" : "pointer",
                }}
              >
                <RefreshCw
                  size={13}
                  style={{
                    animation: isSyncing ? "spin 1s linear infinite" : "none",
                  }}
                />
                <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
              </button>
              <button
                type="button"
                onClick={() => void disconnectYoutubeAccount()}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#f87171",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "16px",
                border: "none",
                background: "var(--accent-gradient)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Cloud size={13} />
              <span>Link Account</span>
            </button>
          )}
        </div>
      </section>

      {/* Offline Storage & Disk Cache Section */}
      <section
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HardDriveDownload size={18} style={{ color: "var(--accent)" }} />
            <h2
              style={{
                margin: 0,
                fontSize: "var(--font-size-md)",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Offline Audio Cache
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void clearCache()}
            disabled={stats.trackCount === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.1)",
              color: stats.trackCount === 0 ? "var(--text-muted)" : "#f87171",
              fontSize: "13px",
              fontWeight: 600,
              cursor: stats.trackCount === 0 ? "not-allowed" : "pointer",
              opacity: stats.trackCount === 0 ? 0.5 : 1,
            }}
          >
            <Trash2 size={13} /> Clear Cache
          </button>
        </div>

        <p
          style={{
            margin: "0 0 1rem",
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          Downloaded or cached songs are stored on your local disk for instant, offline playback without media server buffering.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Cached Storage Used
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
              {(stats.totalBytes / (1024 * 1024)).toFixed(1)} MB
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Offline Tracks Available
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>
              {stats.trackCount} {stats.trackCount === 1 ? "track" : "tracks"}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <KeyRound size={18} style={{ color: "var(--accent)" }} />
          <h2
            style={{
              margin: 0,
              fontSize: "var(--font-size-md)",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            YouTube Music Authentication
          </h2>
        </div>

        <p
          style={{
            margin: "0 0 1.25rem",
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-sm)",
            lineHeight: 1.55,
          }}
        >
          Optional credentials for age-restricted or rate-limited streams. Changes
          take effect on the next played track without restarting MusicWave.
        </p>

        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--text-muted)",
              padding: "1rem 0",
              fontSize: "var(--font-size-sm)",
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span>Loading saved settings...</span>
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label htmlFor="settings-cookie" style={fieldLabelStyle}>
                Cookie
              </label>
              {isMobile ? (
                <input
                  id="settings-cookie"
                  type="password"
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="Paste your YouTube Music Cookie header"
                  style={fieldInputStyle}
                />
              ) : (
                <textarea
                  id="settings-cookie"
                  rows={4}
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="Paste your YouTube Music Cookie header (e.g. VISITOR_INFO1_LIVE=...; SID=...)"
                  style={{
                    ...fieldInputStyle,
                    resize: "vertical",
                    minHeight: "96px",
                  }}
                />
              )}
            </div>

            <div>
              <label htmlFor="settings-user-agent" style={fieldLabelStyle}>
                User-Agent
              </label>
              <input
                id="settings-user-agent"
                type="text"
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                placeholder="Optional custom User-Agent string"
                style={fieldInputStyle}
              />
            </div>

            <div>
              <label htmlFor="settings-po-token" style={fieldLabelStyle}>
                PO Token
              </label>
              <input
                id="settings-po-token"
                type="text"
                value={poToken}
                onChange={(e) => setPoToken(e.target.value)}
                placeholder="Optional Proof-of-Origin (PO) token"
                style={fieldInputStyle}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginTop: "0.25rem",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.625rem 1.25rem",
                  background: "var(--accent-gradient)",
                  color: "var(--text-inverse)",
                  border: "none",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 600,
                  cursor: isSaving ? "wait" : "pointer",
                  opacity: isSaving ? 0.75 : 1,
                }}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{isSaving ? "Saving..." : "Save Settings"}</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.625rem 1.125rem",
                  background: "var(--bg-surface-hover)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 600,
                  cursor: isTesting ? "wait" : "pointer",
                  opacity: isTesting ? 0.75 : 1,
                }}
              >
                {isTesting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
                )}
                <span>{isTesting ? "Testing..." : "Test Connection"}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      <section
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <Info size={18} style={{ color: "var(--accent)" }} />
          <h2
            style={{
              margin: 0,
              fontSize: "var(--font-size-md)",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            About MusicWave
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            color: "var(--text-secondary)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          <div>
            Version:{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              v{APP_VERSION}
            </strong>
          </div>
          <div>
            YouTube Music desktop player built with Tauri, Rust audio streaming,
            and React. Press{" "}
            <kbd
              style={{
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "var(--font-size-xs)",
              }}
            >
              ?
            </kbd>{" "}
            anywhere to view keyboard shortcuts.
          </div>
          <div style={{ marginTop: "0.25rem" }}>
            <a
              href="https://github.com/Colkam4l/musicwave"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                void openUrl("https://github.com/Colkam4l/musicwave").catch(
                  () => {
                    window.open(
                      "https://github.com/Colkam4l/musicwave",
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }
                );
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <span>GitHub Repository</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
