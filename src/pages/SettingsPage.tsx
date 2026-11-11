import React from "react";
import { Settings } from "lucide-react";

export const SettingsPage: React.FC = () => {
  return (
    <div
      className="animate-fade-in"
      style={{
        width: "100%",
        maxWidth: "860px",
        margin: "0 auto",
        padding: "2.5rem 1.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <Settings size={24} color="var(--accent-violet)" />
        <h1
          style={{
            fontSize: "var(--font-size-xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Settings
        </h1>
      </div>

      <div
        style={{
          padding: "1.5rem",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
          fontSize: "var(--font-size-sm)",
          lineHeight: 1.6,
        }}
      >
        Authentication credential management (`headers.json`, `po_token.txt`) and
        playback preferences are scheduled for Sprint 4.
      </div>
    </div>
  );
};
