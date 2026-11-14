import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { M3Tokens } from "../../theme/tokens";
import { useThemeStore } from "../../store/themeStore";

export type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "fab";

interface ExpressiveButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const ExpressiveButton: React.FC<ExpressiveButtonProps> = ({
  variant = "filled",
  size = "md",
  children,
  icon,
  style,
  disabled,
  ...props
}) => {
  const { reducedMotion } = useThemeStore();

  const sizeStyles: Record<"sm" | "md" | "lg", React.CSSProperties> = {
    sm: {
      padding: "6px 14px",
      fontSize: "0.8rem",
      borderRadius: M3Tokens.shape.cornerFull,
      gap: "6px",
      minHeight: 32,
    },
    md: {
      padding: "9px 20px",
      fontSize: "0.875rem",
      borderRadius: M3Tokens.shape.cornerFull,
      gap: "8px",
      minHeight: 40,
    },
    lg: {
      padding: "12px 28px",
      fontSize: "0.95rem",
      borderRadius: M3Tokens.shape.cornerFull,
      gap: "10px",
      minHeight: 48,
    },
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    filled: {
      background: "var(--md-sys-color-primary, #d0bcff)",
      color: "var(--md-sys-color-on-primary, #381e72)",
      border: "none",
      boxShadow: M3Tokens.elevation.level1,
    },
    tonal: {
      background: "var(--md-sys-color-secondary-container, #4a4458)",
      color: "var(--md-sys-color-on-secondary-container, #e8def8)",
      border: "none",
    },
    outlined: {
      background: "transparent",
      color: "var(--md-sys-color-primary, #d0bcff)",
      border: "1px solid var(--md-sys-color-outline, rgba(255, 255, 255, 0.12))",
    },
    text: {
      background: "transparent",
      color: "var(--md-sys-color-primary, #d0bcff)",
      border: "none",
    },
    fab: {
      background: "var(--accent-gradient)",
      color: "#ffffff",
      border: "none",
      boxShadow: M3Tokens.elevation.level2,
    },
  };

  return (
    <motion.button
      whileHover={
        disabled || reducedMotion ? undefined : { scale: 1.025, translateY: -1 }
      }
      whileTap={
        disabled || reducedMotion ? undefined : { scale: 0.94 }
      }
      transition={M3Tokens.motion.tactilePress}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        userSelect: "none",
        outline: "none",
        letterSpacing: "0.01em",
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      {children}
    </motion.button>
  );
};
