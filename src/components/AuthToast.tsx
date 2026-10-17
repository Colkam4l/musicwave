import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { usePlayerStore } from "../store/playerStore";

export const AuthToast: React.FC = () => {
  const { authRequiredToast, setAuthRequiredToast } = usePlayerStore();

  if (!authRequiredToast) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        top: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1.25rem",
        borderRadius: "var(--radius-md)",
        background: "rgba(24, 24, 27, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(245, 158, 11, 0.35)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
        color: "var(--text-primary)",
        fontSize: "var(--font-size-sm)",
        maxWidth: "90vw",
      }}
    >
      <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
      <span>Authentication required. Please set up your credentials in Settings.</span>
      <button
        type="button"
        onClick={() => setAuthRequiredToast(false)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: "0.5rem",
          padding: 2,
        }}
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};
