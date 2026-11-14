/**
 * Material 3 Expressive Design Tokens for MusicWave.
 * Follows Google M3 Expressive specifications:
 * - Dynamic color roles
 * - Curved expressive geometries (rounded-3xl, rounded-full)
 * - Tonal elevation surfaces (eliminates heavy GPU backdrop blurs)
 * - Tactile spring physics
 */

export const M3Tokens = {
  shape: {
    cornerFull: "9999px",
    cornerExtraLarge: "28px",
    cornerLarge: "16px",
    cornerMedium: "12px",
    cornerSmall: "8px",
  },
  elevation: {
    level0: "none",
    level1: "0px 1px 3px 1px rgba(0, 0, 0, 0.25), 0px 1px 2px 0px rgba(0, 0, 0, 0.4)",
    level2: "0px 2px 6px 2px rgba(0, 0, 0, 0.28), 0px 1px 2px 0px rgba(0, 0, 0, 0.45)",
    level3: "0px 4px 12px 3px rgba(0, 0, 0, 0.35), 0px 1px 3px 0px rgba(0, 0, 0, 0.5)",
    level4: "0px 8px 24px 4px rgba(0, 0, 0, 0.4), 0px 2px 4px 0px rgba(0, 0, 0, 0.6)",
  },
  motion: {
    expressiveSpring: {
      type: "spring" as const,
      stiffness: 380,
      damping: 26,
      mass: 0.9,
    },
    tactilePress: {
      type: "spring" as const,
      stiffness: 500,
      damping: 18,
    },
    gentleFade: {
      type: "spring" as const,
      stiffness: 240,
      damping: 28,
    },
  },
} as const;
