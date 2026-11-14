import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { M3Tokens } from "../../theme/tokens";
import { useThemeStore } from "../../store/themeStore";

interface TonalCardProps extends HTMLMotionProps<"div"> {
  level?: "lowest" | "low" | "standard" | "high" | "highest";
  rounded?: "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  interactive?: boolean;
  children: React.ReactNode;
}

export const TonalCard: React.FC<TonalCardProps> = ({
  level = "standard",
  rounded = "2xl",
  interactive = false,
  children,
  style,
  ...props
}) => {
  const { reducedMotion } = useThemeStore();

  const levelBackgrounds: Record<string, string> = {
    lowest: "var(--md-sys-color-surface-container-lowest, #06050a)",
    low: "var(--md-sys-color-surface-container-low, #17141f)",
    standard: "var(--md-sys-color-surface-container, #1e1b27)",
    high: "var(--md-sys-color-surface-container-high, #272332)",
    highest: "var(--md-sys-color-surface-container-highest, #322e3f)",
  };

  const roundedRadii: Record<string, string> = {
    md: M3Tokens.shape.cornerMedium,
    lg: M3Tokens.shape.cornerLarge,
    xl: "20px",
    "2xl": "24px",
    "3xl": M3Tokens.shape.cornerExtraLarge,
    full: M3Tokens.shape.cornerFull,
  };

  return (
    <motion.div
      whileHover={
        interactive && !reducedMotion ? { translateY: -3, scale: 1.01 } : undefined
      }
      transition={M3Tokens.motion.expressiveSpring}
      style={{
        background: levelBackgrounds[level],
        borderRadius: roundedRadii[rounded],
        border: "1px solid var(--md-sys-color-outline-variant, rgba(255, 255, 255, 0.06))",
        boxShadow: interactive ? M3Tokens.elevation.level1 : M3Tokens.elevation.level0,
        color: "var(--md-sys-color-on-surface, #e6e0ea)",
        transition: "background 0.3s cubic-bezier(0.2, 0, 0, 1), border-color 0.3s ease, box-shadow 0.2s ease",
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
