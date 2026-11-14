import React from "react";
import { motion } from "framer-motion";
import { M3Tokens } from "../../theme/tokens";
import { useThemeStore } from "../../store/themeStore";

interface ExpressiveChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

export const ExpressiveChip: React.FC<ExpressiveChipProps> = ({
  label,
  selected = false,
  onClick,
  icon,
  style,
}) => {
  const { reducedMotion } = useThemeStore();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reducedMotion ? undefined : { scale: 1.04, translateY: -1 }}
      whileTap={reducedMotion ? undefined : { scale: 0.94 }}
      transition={M3Tokens.motion.tactilePress}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: M3Tokens.shape.cornerFull,
        border: selected
          ? "1px solid transparent"
          : "1px solid var(--md-sys-color-outline, rgba(255, 255, 255, 0.1))",
        background: selected
          ? "var(--md-sys-color-secondary-container, #4a4458)"
          : "var(--md-sys-color-surface-container, #1e1b27)",
        color: selected
          ? "var(--md-sys-color-on-secondary-container, #e8def8)"
          : "var(--md-sys-color-on-surface-variant, #cac4d0)",
        fontSize: "0.82rem",
        fontWeight: selected ? 700 : 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        userSelect: "none",
        outline: "none",
        boxShadow: selected ? M3Tokens.elevation.level1 : "none",
        transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
        ...style,
      }}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      <span>{label}</span>
    </motion.button>
  );
};
