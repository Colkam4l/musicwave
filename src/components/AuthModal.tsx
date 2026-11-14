import React, { useState } from "react";
import {
  X,
  User,
  Sparkles,
  CloudUpload,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSync } from "../hooks/useSync";
import { useToast } from "./Toast";

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
  } = useAuth();
  const { syncLibrary } = useSync();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"local" | "cloud">("local");
  const [localName, setLocalName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_COLORS[0]);
  const [cookieInput, setCookieInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Trigger background sync
      syncLibrary().catch(console.error);
    } catch (err) {
      showToast(`Failed linking account: ${String(err)}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          maxWidth: 480,
          background: "var(--bg-surface-elevated, #18181b)",
          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
          borderRadius: "var(--radius-lg, 16px)",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.6)",
          padding: "2rem",
          color: "var(--text-primary, #ffffff)",
          position: "relative",
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
            Use MusicWave completely offline as a local guest, or sync your YouTube Music playlists.
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
            <span>YouTube Sync</span>
          </button>
        </div>

        {mode === "local" ? (
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
                placeholder="e.g. Audiophile, Gym Tracks, Night Mode..."
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
        ) : (
          /* YOUTUBE CLOUD SYNC FORM */
          <form onSubmit={handleLinkYoutube}>
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
                YouTube Music Cookie / Session
              </label>
              <textarea
                rows={4}
                placeholder="Paste your YouTube Music Cookie string here..."
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 0.85rem",
                  borderRadius: "var(--radius-sm, 8px)",
                  background: "var(--bg-primary, #09090b)",
                  border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  fontFamily: "monospace",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted, #a1a1aa)",
                  marginTop: "0.35rem",
                  lineHeight: 1.4,
                }}
              >
                Log in to <code>music.youtube.com</code> in any browser, copy your <code>Cookie</code> request header from DevTools Network tab, and paste it here.
              </p>
            </div>

            {activeProfile?.linkedAccount ? (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "var(--radius-sm, 8px)",
                  padding: "0.75rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Currently Connected</span>
                </div>
                <button
                  type="button"
                  onClick={() => disconnectYoutubeAccount()}
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#f87171",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Disconnect
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !cookieInput.trim()}
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
                opacity: isSubmitting || !cookieInput.trim() ? 0.6 : 1,
                boxShadow: "0 4px 14px var(--accent-glow)",
              }}
            >
              {isSubmitting ? "Connecting..." : "Connect & Sync Library"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
