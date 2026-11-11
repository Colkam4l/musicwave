import { useMemo } from "react";
import { platform } from "@tauri-apps/plugin-os";

export interface PlatformInfo {
  platformName: string;
  isMobile: boolean;
}

const detectPlatform = (): PlatformInfo => {
  try {
    const p = platform();
    return {
      platformName: p,
      isMobile: p === "android" || p === "ios",
    };
  } catch {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const mobileUa = /Android|iPhone|iPad|iPod/i.test(ua);
    return {
      platformName: mobileUa ? "mobile-web" : "desktop-web",
      isMobile: mobileUa,
    };
  }
};

/**
 * Detects whether MusicWave is running on a mobile target (`android` or `ios`).
 */
export const usePlatform = (): PlatformInfo => {
  return useMemo(() => detectPlatform(), []);
};

