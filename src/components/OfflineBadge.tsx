import React from "react";
import { CheckCircle2 } from "lucide-react";

interface OfflineBadgeProps {
  isDownloaded?: boolean;
  size?: number;
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({
  isDownloaded = true,
  size = 14,
}) => {
  if (!isDownloaded) return null;

  return (
    <span
      title="Downloaded for offline playback"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 6px",
        borderRadius: "var(--radius-full)",
        background: "rgba(16, 185, 129, 0.15)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
        color: "#10b981",
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      <CheckCircle2 size={size} color="#10b981" />
      <span>Offline</span>
    </span>
  );
};
