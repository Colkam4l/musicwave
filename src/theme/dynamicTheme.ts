import { M3TonalPalette } from "./palette";

export function applyM3Theme(palette: M3TonalPalette): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Material 3 Expressive System Roles
  root.style.setProperty("--md-sys-color-primary", palette.primary);
  root.style.setProperty("--md-sys-color-on-primary", palette.onPrimary);
  root.style.setProperty(
    "--md-sys-color-primary-container",
    palette.primaryContainer
  );
  root.style.setProperty(
    "--md-sys-color-on-primary-container",
    palette.onPrimaryContainer
  );

  root.style.setProperty("--md-sys-color-secondary", palette.secondary);
  root.style.setProperty("--md-sys-color-on-secondary", palette.onSecondary);
  root.style.setProperty(
    "--md-sys-color-secondary-container",
    palette.secondaryContainer
  );
  root.style.setProperty(
    "--md-sys-color-on-secondary-container",
    palette.onSecondaryContainer
  );

  root.style.setProperty("--md-sys-color-tertiary", palette.tertiary);
  root.style.setProperty("--md-sys-color-on-tertiary", palette.onTertiary);
  root.style.setProperty(
    "--md-sys-color-tertiary-container",
    palette.tertiaryContainer
  );
  root.style.setProperty(
    "--md-sys-color-on-tertiary-container",
    palette.onTertiaryContainer
  );

  root.style.setProperty("--md-sys-color-surface", palette.surface);
  root.style.setProperty("--md-sys-color-surface-dim", palette.surfaceDim);
  root.style.setProperty(
    "--md-sys-color-surface-container-lowest",
    palette.surfaceContainerLowest
  );
  root.style.setProperty(
    "--md-sys-color-surface-container-low",
    palette.surfaceContainerLow
  );
  root.style.setProperty(
    "--md-sys-color-surface-container",
    palette.surfaceContainer
  );
  root.style.setProperty(
    "--md-sys-color-surface-container-high",
    palette.surfaceContainerHigh
  );
  root.style.setProperty(
    "--md-sys-color-surface-container-highest",
    palette.surfaceContainerHighest
  );

  root.style.setProperty("--md-sys-color-on-surface", palette.onSurface);
  root.style.setProperty(
    "--md-sys-color-on-surface-variant",
    palette.onSurfaceVariant
  );
  root.style.setProperty("--md-sys-color-outline", palette.outline);
  root.style.setProperty(
    "--md-sys-color-outline-variant",
    palette.outlineVariant
  );

  // Backward-Compatible CSS Aliases
  root.style.setProperty("--bg-primary", palette.surface);
  root.style.setProperty("--bg-surface", palette.surfaceContainer);
  root.style.setProperty(
    "--bg-surface-elevated",
    palette.surfaceContainerHigh
  );
  root.style.setProperty(
    "--bg-surface-hover",
    palette.surfaceContainerHighest
  );
  root.style.setProperty("--text-primary", palette.onSurface);
  root.style.setProperty("--text-secondary", palette.onSurfaceVariant);
  root.style.setProperty("--border-subtle", palette.outline);
  root.style.setProperty("--accent-gradient", palette.accentGradient);
  root.style.setProperty("--accent-glow", palette.accentGlow);
  root.style.setProperty("--accent", palette.primary);
  root.style.setProperty("--accent-rose", palette.primary);
}
