import React from "react";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 32, label = "Searching YouTube Music..." }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "3rem 1rem",
        color: "var(--text-secondary)",
      }}
    >
      <Loader2
        size={size}
        className="animate-spin"
        style={{
          color: "var(--accent)",
        }}
      />
      {label && (
        <span
          style={{
            fontSize: "var(--font-size-sm)",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
