import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayer } from "./usePlayer";
import { useQueue } from "./useQueue";

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
};

const focusSearchInput = () => {
  const input = document.getElementById("musicwave-search-input");
  if (input instanceof HTMLInputElement) {
    input.focus();
    input.select();
  }
};

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

/**
 * Registers global keyboard shortcuts for playback, queue, navigation, and help modal.
 */
export const useKeyboardShortcuts = ({
  enabled = true,
}: UseKeyboardShortcutsOptions = {}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { togglePlayPause, seekTo, elapsedSeconds, totalSeconds, currentSong } =
    usePlayer();
  const { skipNext, skipPrev, toggleQueueOpen } = useQueue();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setIsHelpOpen(false);
        navigate("/settings");
        return;
      }

      if (e.key === "Escape" && isHelpOpen) {
        e.preventDefault();
        setIsHelpOpen(false);
        return;
      }

      if (isEditableTarget(e.target)) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          void togglePlayPause();
          break;
        case "ArrowRight":
          if (currentSong) {
            e.preventDefault();
            const target =
              totalSeconds > 0
                ? Math.min(totalSeconds, elapsedSeconds + 10)
                : elapsedSeconds + 10;
            void seekTo(target);
          }
          break;
        case "ArrowLeft":
          if (currentSong) {
            e.preventDefault();
            void seekTo(Math.max(0, elapsedSeconds - 10));
          }
          break;
        case "n":
        case "N":
          e.preventDefault();
          void skipNext();
          break;
        case "p":
        case "P":
          e.preventDefault();
          void skipPrev();
          break;
        case "/":
          e.preventDefault();
          if (location.pathname !== "/") {
            navigate("/");
            window.setTimeout(focusSearchInput, 60);
          } else {
            focusSearchInput();
          }
          break;
        case "q":
        case "Q":
          e.preventDefault();
          toggleQueueOpen();
          break;
        case "?":
          e.preventDefault();
          setIsHelpOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    isHelpOpen,
    navigate,
    location.pathname,
    togglePlayPause,
    seekTo,
    elapsedSeconds,
    totalSeconds,
    currentSong,
    skipNext,
    skipPrev,
    toggleQueueOpen,
  ]);

  return {
    isHelpOpen,
    openHelp: () => setIsHelpOpen(true),
    closeHelp: () => setIsHelpOpen(false),
  };
};

