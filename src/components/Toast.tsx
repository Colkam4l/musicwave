import React, { useCallback, useEffect } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ToastItem, ToastVariant, useToastStore } from "../store/toastStore";

export const useToast = () => {
  const addToast = useToastStore((s) => s.addToast);
  const dismissToast = useToastStore((s) => s.dismissToast);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs = 4000) =>
      addToast(message, variant, durationMs),
    [addToast]
  );

  return { showToast, dismissToast };
};

const VARIANT_COLORS: Record<ToastVariant, { border: string; iconColor: string }> = {
  info: {
    border: "var(--border-glass)",
    iconColor: "var(--accent-blue)",
  },
  success: {
    border: "var(--border-focus)",
    iconColor: "var(--accent-rose)",
  },
  warning: {
    border: "var(--border-focus)",
    iconColor: "var(--accent-rose)",
  },
  error: {
    border: "var(--error-border)",
    iconColor: "var(--error-text)",
  },
};

const ToastIcon: React.FC<{ variant: ToastVariant; color: string }> = ({
  variant,
  color,
}) => {
  switch (variant) {
    case "success":
      return <CheckCircle2 size={18} color={color} style={{ flexShrink: 0 }} />;
    case "warning":
      return <AlertTriangle size={18} color={color} style={{ flexShrink: 0 }} />;
    case "error":
      return <AlertCircle size={18} color={color} style={{ flexShrink: 0 }} />;
    default:
      return <Info size={18} color={color} style={{ flexShrink: 0 }} />;
  }
};

const ToastBanner: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (toast.durationMs <= 0) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.durationMs, onDismiss]);

  const colors = VARIANT_COLORS[toast.variant];

  return (
    <div
      className="animate-fade-in"
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1.15rem",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-glass)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: `1px solid ${colors.border}`,
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.55)",
        color: "var(--text-primary)",
        fontSize: "var(--font-size-sm)",
        maxWidth: "460px",
        pointerEvents: "auto",
      }}
    >
      <ToastIcon variant={toast.variant} color={colors.iconColor} />
      <span style={{ flex: 1, lineHeight: 1.35 }}>{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        title="Dismiss"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          borderRadius: "var(--radius-sm)",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        right: "1.5rem",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastBanner key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};
