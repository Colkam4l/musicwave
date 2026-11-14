export interface M3TonalPalette {
  name: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  surface: string;
  surfaceDim: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;

  accentGradient: string;
  accentGlow: string;
}

export type PresetThemeName =
  | "violet"
  | "sapphire"
  | "emerald"
  | "sunset"
  | "amber"
  | "monochrome";

export const PRESET_THEMES: Record<PresetThemeName, M3TonalPalette> = {
  violet: {
    name: "Violet Glow",
    primary: "#d0bcff",
    onPrimary: "#381e72",
    primaryContainer: "#4f378b",
    onPrimaryContainer: "#eaddff",
    secondary: "#ccc2dc",
    onSecondary: "#332d41",
    secondaryContainer: "#4a4458",
    onSecondaryContainer: "#e8def8",
    tertiary: "#efb8c8",
    onTertiary: "#492532",
    tertiaryContainer: "#633b48",
    onTertiaryContainer: "#ffd8e4",
    surface: "#100e17",
    surfaceDim: "#0b0a10",
    surfaceContainerLowest: "#06050a",
    surfaceContainerLow: "#17141f",
    surfaceContainer: "#1e1b27",
    surfaceContainerHigh: "#272332",
    surfaceContainerHighest: "#322e3f",
    onSurface: "#e6e0ea",
    onSurfaceVariant: "#cac4d0",
    outline: "rgba(255, 255, 255, 0.12)",
    outlineVariant: "rgba(255, 255, 255, 0.06)",
    accentGradient: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)",
    accentGlow: "rgba(168, 85, 247, 0.35)",
  },
  sapphire: {
    name: "Midnight Sapphire",
    primary: "#a8c8ff",
    onPrimary: "#003062",
    primaryContainer: "#00468a",
    onPrimaryContainer: "#d6e3ff",
    secondary: "#bec6dc",
    onSecondary: "#283141",
    secondaryContainer: "#3e4758",
    onSecondaryContainer: "#dae2f9",
    tertiary: "#debcdf",
    onTertiary: "#402843",
    tertiaryContainer: "#583e5b",
    onTertiaryContainer: "#fbd7fc",
    surface: "#0d1117",
    surfaceDim: "#080c11",
    surfaceContainerLowest: "#04070a",
    surfaceContainerLow: "#121720",
    surfaceContainer: "#181f2a",
    surfaceContainerHigh: "#222a38",
    surfaceContainerHighest: "#2d3647",
    onSurface: "#e2e6f0",
    onSurfaceVariant: "#c2c7d4",
    outline: "rgba(168, 200, 255, 0.14)",
    outlineVariant: "rgba(168, 200, 255, 0.06)",
    accentGradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
    accentGlow: "rgba(59, 130, 246, 0.35)",
  },
  emerald: {
    name: "Emerald Grove",
    primary: "#85d7aa",
    onPrimary: "#003822",
    primaryContainer: "#005234",
    onPrimaryContainer: "#a1f4c5",
    secondary: "#b5ccbb",
    onSecondary: "#213529",
    secondaryContainer: "#374b3f",
    onSecondaryContainer: "#d1e8d7",
    tertiary: "#a3cddc",
    onTertiary: "#043542",
    tertiaryContainer: "#224c59",
    onTertiaryContainer: "#bfe9f9",
    surface: "#0c1510",
    surfaceDim: "#080e0a",
    surfaceContainerLowest: "#040705",
    surfaceContainerLow: "#111b15",
    surfaceContainer: "#16231c",
    surfaceContainerHigh: "#1f2f26",
    surfaceContainerHighest: "#293c31",
    onSurface: "#e0e7e2",
    onSurfaceVariant: "#bfc9c1",
    outline: "rgba(133, 215, 170, 0.14)",
    outlineVariant: "rgba(133, 215, 170, 0.06)",
    accentGradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
    accentGlow: "rgba(16, 185, 129, 0.35)",
  },
  sunset: {
    name: "Sunset Coral",
    primary: "#ffb4ab",
    onPrimary: "#690005",
    primaryContainer: "#93000a",
    onPrimaryContainer: "#ffdad6",
    secondary: "#e7bdb8",
    onSecondary: "#442926",
    secondaryContainer: "#5d3f3b",
    onSecondaryContainer: "#ffdad6",
    tertiary: "#e4c28c",
    onTertiary: "#422c05",
    tertiaryContainer: "#5b4219",
    onTertiaryContainer: "#ffdea7",
    surface: "#170f0f",
    surfaceDim: "#100909",
    surfaceContainerLowest: "#090505",
    surfaceContainerLow: "#201414",
    surfaceContainer: "#291a1a",
    surfaceContainerHigh: "#352323",
    surfaceContainerHighest: "#432d2d",
    onSurface: "#ece0df",
    onSurfaceVariant: "#d8c2c0",
    outline: "rgba(255, 180, 171, 0.14)",
    outlineVariant: "rgba(255, 180, 171, 0.06)",
    accentGradient: "linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #facc15 100%)",
    accentGlow: "rgba(244, 63, 94, 0.35)",
  },
  amber: {
    name: "Golden Hour",
    primary: "#ffba38",
    onPrimary: "#432c00",
    primaryContainer: "#604100",
    onPrimaryContainer: "#ffdeaa",
    secondary: "#d9c3a3",
    onSecondary: "#3b2e17",
    secondaryContainer: "#53442c",
    onSecondaryContainer: "#f6dfbe",
    tertiary: "#b6cea8",
    onTertiary: "#23361b",
    tertiaryContainer: "#394d30",
    onTertiaryContainer: "#d2eac3",
    surface: "#16130b",
    surfaceDim: "#0e0c07",
    surfaceContainerLowest: "#080603",
    surfaceContainerLow: "#1e1910",
    surfaceContainer: "#262115",
    surfaceContainerHigh: "#322b1c",
    surfaceContainerHighest: "#3e3725",
    onSurface: "#ebe4d7",
    onSurfaceVariant: "#cdc5b7",
    outline: "rgba(255, 186, 56, 0.14)",
    outlineVariant: "rgba(255, 186, 56, 0.06)",
    accentGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
    accentGlow: "rgba(245, 158, 11, 0.35)",
  },
  monochrome: {
    name: "Monochrome OLED",
    primary: "#ffffff",
    onPrimary: "#000000",
    primaryContainer: "#2a2a2a",
    onPrimaryContainer: "#f0f0f0",
    secondary: "#cccccc",
    onSecondary: "#1a1a1a",
    secondaryContainer: "#333333",
    onSecondaryContainer: "#e0e0e0",
    tertiary: "#aaaaaa",
    onTertiary: "#111111",
    tertiaryContainer: "#2e2e2e",
    onTertiaryContainer: "#dddddd",
    surface: "#080808",
    surfaceDim: "#000000",
    surfaceContainerLowest: "#000000",
    surfaceContainerLow: "#121212",
    surfaceContainer: "#181818",
    surfaceContainerHigh: "#222222",
    surfaceContainerHighest: "#2c2c2c",
    onSurface: "#f0f0f0",
    onSurfaceVariant: "#aaaaaa",
    outline: "rgba(255, 255, 255, 0.14)",
    outlineVariant: "rgba(255, 255, 255, 0.06)",
    accentGradient: "linear-gradient(135deg, #ffffff 0%, #aaaaaa 50%, #666666 100%)",
    accentGlow: "rgba(255, 255, 255, 0.2)",
  },
};

// Helper: RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${Math.max(0, Math.min(100, s))}%, ${Math.max(0, Math.min(100, l))}%)`;
}

/**
 * Builds a full M3 tonal palette from an extracted dominant HSL color.
 */
export function generateM3FromHsl(h: number, s: number): M3TonalPalette {
  const sat = Math.max(35, Math.min(85, s));
  const compH = (h + 30) % 360;
  const tertH = (h + 60) % 360;

  return {
    name: "Dynamic Theme",
    primary: hsl(h, sat, 80),
    onPrimary: hsl(h, sat, 20),
    primaryContainer: hsl(h, sat, 32),
    onPrimaryContainer: hsl(h, sat, 90),

    secondary: hsl(compH, Math.round(sat * 0.6), 75),
    onSecondary: hsl(compH, Math.round(sat * 0.6), 20),
    secondaryContainer: hsl(compH, Math.round(sat * 0.6), 30),
    onSecondaryContainer: hsl(compH, Math.round(sat * 0.6), 90),

    tertiary: hsl(tertH, Math.round(sat * 0.8), 75),
    onTertiary: hsl(tertH, Math.round(sat * 0.8), 20),
    tertiaryContainer: hsl(tertH, Math.round(sat * 0.8), 30),
    onTertiaryContainer: hsl(tertH, Math.round(sat * 0.8), 90),

    surface: hsl(h, 15, 6),
    surfaceDim: hsl(h, 15, 4),
    surfaceContainerLowest: hsl(h, 15, 2),
    surfaceContainerLow: hsl(h, 12, 10),
    surfaceContainer: hsl(h, 12, 14),
    surfaceContainerHigh: hsl(h, 12, 18),
    surfaceContainerHighest: hsl(h, 12, 23),

    onSurface: hsl(h, 15, 92),
    onSurfaceVariant: hsl(h, 12, 75),
    outline: `hsla(${h}, ${sat}%, 80%, 0.15)`,
    outlineVariant: `hsla(${h}, ${sat}%, 80%, 0.08)`,

    accentGradient: `linear-gradient(135deg, ${hsl(h, sat, 70)} 0%, ${hsl(compH, sat, 60)} 50%, ${hsl(tertH, sat, 65)} 100%)`,
    accentGlow: `hsla(${h}, ${sat}%, 60%, 0.35)`,
  };
}

const PALETTE_CACHE = new Map<string, M3TonalPalette>();

/**
 * Extracts dominant color from image URL using downsampled canvas quantization.
 * Returns an M3TonalPalette.
 */
export async function extractPaletteFromImageUrl(
  imageUrl: string
): Promise<M3TonalPalette> {
  if (PALETTE_CACHE.has(imageUrl)) {
    return PALETTE_CACHE.get(imageUrl)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(PRESET_THEMES.violet);
          return;
        }

        const size = 32;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let count = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near-black/near-white pixels
          if (a < 128) continue;
          const brightness = (r + g + b) / 3;
          if (brightness < 20 || brightness > 240) continue;

          totalR += r;
          totalG += g;
          totalB += b;
          count++;
        }

        if (count === 0) {
          resolve(PRESET_THEMES.violet);
          return;
        }

        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);

        const [h, s] = rgbToHsl(avgR, avgG, avgB);
        const palette = generateM3FromHsl(h, Math.max(30, s));
        PALETTE_CACHE.set(imageUrl, palette);
        resolve(palette);
      } catch (err) {
        console.warn("[palette] Canvas color extraction error:", err);
        resolve(PRESET_THEMES.violet);
      }
    };

    img.onerror = () => {
      resolve(PRESET_THEMES.violet);
    };

    img.src = imageUrl;
  });
}
