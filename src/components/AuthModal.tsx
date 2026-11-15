import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Sparkles,
  CloudUpload,
  CheckCircle2,
  ShieldCheck,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAuth } from "../hooks/useAuth";
import { useSync } from "../hooks/useSync";
import { useToast } from "./Toast";
import { DetectedBrowser } from "../types/auth";

const AVATAR_COLORS = [
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #2563eb, #06b6d4)",
  "linear-gradient(135deg, #059669, #10b981)",
  "linear-gradient(135deg, #d97706, #f59e0b)",
  "linear-gradient(135deg, #e11d48, #fb7185)",
];

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    activeProfile,
    createProfile,
    linkYoutubeAccount,
    disconnectYoutubeAccount,
    detectBrowsers,
    importBrowserCookies,
  } = useAuth();
  const { syncLibrary } = useSync();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"cloud" | "local">("cloud");
  const [localName, setLocalName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_COLORS[0]);
  const [cookieInput, setCookieInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Browser auto-detection state
  const [browsers, setBrowsers] = useState<DetectedBrowser[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [importingBrowserId, setImportingBrowserId] = useState<string | null>(null);
  const [showManualPaste, setShowManualPaste] = useState(false);

  // Load available browsers whenever modal is open and on cloud tab
  useEffect(() => {
    if (!isAuthModalOpen || mode !== "cloud") return;
    let active = true;
    setIsDetecting(true);
    detectBrowsers()
      .then((detected) => {
        if (active) {
          setBrowsers(detected);
        }
      })
      .catch((err) => {
        console.error("Failed to detect browsers:", err);
      })
      .finally(() => {
        if (active) setIsDetecting(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthModalOpen, mode, detectBrowsers]);

  if (!isAuthModalOpen) return null;

  const handleCreateLocalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localName.trim()) return;
    setIsSubmitting(true);
    try {
      await createProfile(localName.trim(), selectedAvatar);
      showToast(`Welcome, ${localName.trim()}! Local profile created.`, "success");
      setLocalName("");
      closeAuthModal();
    } catch (err) {
      showToast(`Failed creating profile: ${String(err)}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cookieInput.trim()) return;
    setIsSubmitting(true);
    try {
      await linkYoutubeAccount(cookieInput.trim());
      showToast("YouTube Music account linked! Starting library sync...", "success");
      setCookieInput("");
      closeAuthModal();
      syncLibrary().catch(console.error);
    } catch (err) {
      showToast(`Failed linking account: ${String(err)}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrowserImport = async (browserId: string, browserName: string) => {
    setImportingBrowserId(browserId);
    try {
      await importBrowserCookies(browserId);
      showToast(
        `Successfully linked YouTube Music from ${browserName}! Library sync initiated.`,
        "success"
      );
      closeAuthModal();
      syncLibrary().catch(console.error);
    } catch (err) {
      showToast(`Failed importing from ${browserName}: ${String(err)}`, "error");
    } finally {
      setImportingBrowserId(null);
    }
  };

  const handleOpenBrowserForLogin = async (browserName: string) => {
    try {
      await openUrl("https://music.youtube.com");
      showToast(
        `Opened YouTube Music in ${browserName}. Once signed in, return here and click "Import Session".`,
        "info"
      );
    } catch (err) {
      showToast(`Failed opening browser: ${String(err)}`, "error");
    }
  };

  const availableBrowsers = browsers.filter((b) => b.available);

  return (
    <div
      className="modal-overlay"
      onClick={closeAuthModal}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="modal-card animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--bg-surface-elevated, #18181b)",
          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.6)",
          padding: "2rem",
          color: "var(--text-primary, #ffffff)",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "transparent",
            border: "none",
            color: "var(--text-muted, #a1a1aa)",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "var(--radius-sm, 6px)",
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: "0 auto 1rem auto",
              borderRadius: "50%",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px var(--accent-glow)",
            }}
          >
            <Sparkles size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>
            Account & Synchronization
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted, #a1a1aa)",
              marginTop: "0.35rem",
            }}
          >
            Sign in with an existing browser session on this device, or use MusicWave offline as a local guest.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.05)",
            padding: "4px",
            borderRadius: "var(--radius-md, 10px)",
            marginBottom: "1.5rem",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => setMode("cloud")}
            style={{
              flex: 1,
              padding: "0.6rem 0.5rem",
              borderRadius: "var(--radius-sm, 8px)",
              border: "none",
              background: mode === "cloud" ? "var(--bg-surface, #27272a)" : "transparent",
              color: mode === "cloud" ? "#ffffff" : "var(--text-muted, #a1a1aa)",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <CloudUpload size={16} />
            <span>YouTube Music Sign-In</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("local")}
            style={{
              flex: 1,
              padding: "0.6rem 0.5rem",
              borderRadius: "var(--radius-sm, 8px)",
              border: "none",
              background: mode === "local" ? "var(--bg-surface, #27272a)" : "transparent",
              color: mode === "local" ? "#ffffff" : "var(--text-muted, #a1a1aa)",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <User size={16} />
            <span>Local Profile</span>
          </button>
        </div>

        {mode === "cloud" ? (
          <div>
            {/* Connected Account Banner if already linked */}
            {activeProfile?.linkedAccount ? (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "var(--radius-sm, 10px)",
                  padding: "0.85rem 1rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <CheckCircle2 size={20} color="#10b981" />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#10b981" }}>
                      Connected to YouTube Music
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #a1a1aa)" }}>
                      Full songs unlocked • Library & playlists synced
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => disconnectYoutubeAccount()}
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#f87171",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Disconnect
                </button>
              </div>
            ) : null}

            {/* Privacy & Zero-Credentials Guarantee Notice */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "var(--radius-sm, 10px)",
                padding: "0.85rem",
                marginBottom: "1.25rem",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                fontSize: "0.8rem",
                color: "#e2e8f0",
              }}
            >
              <Lock size={18} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ lineHeight: 1.45 }}>
                <strong style={{ color: "#ffffff" }}>100% Private — No Passwords Required:</strong>
                <span style={{ color: "var(--text-secondary, #d4d4d8)", display: "block", marginTop: "2px" }}>
                  MusicWave does not request or store your Google password. We import your active session directly from your installed browser, preventing 1:04 track cutoffs and loading your saved playlists.
                </span>
              </div>
            </div>

            {/* Browser Import Section */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-secondary, #d4d4d8)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Globe size={15} color="var(--accent-purple, #a855f7)" />
                  Sign In via Installed Browser
                </label>
                {isDetecting && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted, #a1a1aa)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Loader2 size={12} className="animate-spin" /> Scanning...
                  </span>
                )}
              </div>

              {availableBrowsers.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {availableBrowsers.map((b) => {
                    const isImporting = importingBrowserId === b.id;
                    return (
                      <div
                        key={b.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.75rem 1rem",
                          background: b.hasSession
                            ? "rgba(16, 185, 129, 0.05)"
                            : "var(--bg-primary, #09090b)",
                          border: b.hasSession
                            ? "1px solid rgba(16, 185, 129, 0.3)"
                            : "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                          borderRadius: "var(--radius-sm, 10px)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "8px",
                              background: "rgba(255, 255, 255, 0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              color: "#ffffff",
                            }}
                          >
                            {b.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#ffffff" }}>
                              {b.name}
                            </div>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: b.hasSession ? "#10b981" : "var(--text-muted, #a1a1aa)",
                                fontWeight: b.hasSession ? 600 : 400,
                              }}
                            >
                              {b.hasSession
                                ? "● Active Google/YouTube session detected"
                                : "No active session detected"}
                            </div>
                          </div>
                        </div>

                        {b.hasSession ? (
                          <button
                            type="button"
                            disabled={isImporting}
                            onClick={() => handleBrowserImport(b.id, b.name)}
                            style={{
                              padding: "0.45rem 0.9rem",
                              borderRadius: "var(--radius-sm, 8px)",
                              border: "none",
                              background: "var(--accent-gradient)",
                              color: "#ffffff",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 2px 8px var(--accent-glow)",
                              opacity: isImporting ? 0.6 : 1,
                            }}
                          >
                            {isImporting ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Importing...</span>
                              </>
                            ) : (
                              <span>Import Session</span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenBrowserForLogin(b.name)}
                            style={{
                              padding: "0.45rem 0.75rem",
                              borderRadius: "var(--radius-sm, 8px)",
                              border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))",
                              background: "rgba(255, 255, 255, 0.05)",
                              color: "var(--text-secondary, #d4d4d8)",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>Open & Sign In</span>
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    background: "var(--bg-primary, #09090b)",
                    borderRadius: "var(--radius-sm, 8px)",
                    fontSize: "0.8rem",
                    color: "var(--text-muted, #a1a1aa)",
                  }}
                >
                  {isDetecting
                    ? "Scanning for installed browsers..."
                    : "No desktop browser profiles detected on standard paths."}
                </div>
              )}
            </div>

            {/* Collapsible Manual Cookie Option */}
            <div
              style={{
                borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                paddingTop: "1rem",
              }}
            >
              <button
                type="button"
                onClick={() => setShowManualPaste(!showManualPaste)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted, #a1a1aa)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "4px 0",
                }}
              >
                <span>Manual Cookie Input (Advanced)</span>
                {showManualPaste ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showManualPaste && (
                <form onSubmit={handleLinkYoutube} style={{ marginTop: "0.75rem" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <textarea
                      rows={3}
                      placeholder="Paste raw Cookie header here..."
                      value={cookieInput}
                      onChange={(e) => setCookieInput(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        borderRadius: "var(--radius-sm, 8px)",
                        background: "var(--bg-primary, #09090b)",
                        border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        outline: "none",
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !cookieInput.trim()}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "var(--radius-sm, 8px)",
                      border: "none",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "#ffffff",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      opacity: isSubmitting || !cookieInput.trim() ? 0.5 : 1,
                    }}
                  >
                    {isSubmitting ? "Connecting..." : "Connect Pasted Cookie"}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* LOCAL PROFILE FORM */
          <form onSubmit={handleCreateLocalProfile}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "0.4rem",
                  color: "var(--text-secondary, #d4d4d8)",
                }}
              >
                Profile Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Audiophile, Workout, Chill..."
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 0.85rem",
                  borderRadius: "var(--radius-sm, 8px)",
                  background: "var(--bg-primary, #09090b)",
                  border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Avatar Theme Selector */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  color: "var(--text-secondary, #d4d4d8)",
                }}
              >
                Choose Color Style
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {AVATAR_COLORS.map((bg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(bg)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: bg,
                      border:
                        selectedAvatar === bg
                          ? "2px solid #ffffff"
                          : "2px solid transparent",
                      cursor: "pointer",
                      boxShadow:
                        selectedAvatar === bg
                          ? "0 0 10px rgba(255, 255, 255, 0.5)"
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                background: "rgba(124, 58, 237, 0.1)",
                border: "1px solid rgba(124, 58, 237, 0.25)",
                borderRadius: "var(--radius-sm, 8px)",
                padding: "0.75rem",
                marginBottom: "1.5rem",
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
                fontSize: "0.78rem",
                color: "#e2e8f0",
              }}
            >
              <ShieldCheck size={18} color="var(--accent-purple, #a855f7)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Zero Account Required:</strong> Local profiles are fully isolated and stored in your device's application directory with full playback and offline support.
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !localName.trim()}
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "var(--radius-sm, 8px)",
                border: "none",
                background: "var(--accent-gradient)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                opacity: isSubmitting || !localName.trim() ? 0.6 : 1,
                boxShadow: "0 4px 14px var(--accent-glow)",
              }}
            >
              {isSubmitting ? "Creating..." : "Create & Switch Profile"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
