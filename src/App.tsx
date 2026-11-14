import React, { useEffect, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/SearchPage";
import { PlaylistPage } from "./pages/PlaylistPage";
import { LibraryPage } from "./pages/LibraryPage";
import { ArtistPage } from "./pages/ArtistPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Sidebar } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { QueuePanel } from "./components/QueuePanel";
import { PlayerBar } from "./components/PlayerBar";
import { MobilePlayerBar } from "./components/MobilePlayerBar";
import { FullScreenPlayer } from "./components/FullScreenPlayer";
import { ToastContainer } from "./components/Toast";
import { AnimatedLayout } from "./components/AnimatedLayout";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { AuthModal } from "./components/AuthModal";
import { usePlayerEvents } from "./hooks/usePlayer";
import { useQueue, useQueueSync } from "./hooks/useQueue";
import { useLibrarySync } from "./hooks/useLibrary";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePlatform } from "./hooks/usePlatform";

const AppShell: React.FC = () => {
  const location = useLocation();
  const { isMobile } = usePlatform();
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const { isHelpOpen, closeHelp } = useKeyboardShortcuts({
    enabled: !isMobile,
  });
  const { skipPrev } = useQueue();

  useEffect(() => {
    let cancelled = false;
    let unlistenFn: (() => void) | undefined;

    listen("player://previous-requested", () => {
      void skipPrev();
    }).then((unlisten) => {
      if (cancelled) {
        unlisten();
      } else {
        unlistenFn = unlisten;
      }
    });

    return () => {
      cancelled = true;
      if (unlistenFn) unlistenFn();
    };
  }, [skipPrev]);

  return (
    <div className={isMobile ? "mobile-layout" : undefined}>
      <ToastContainer />
      <AuthModal />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          paddingBottom: isMobile
            ? "calc(112px + env(safe-area-inset-bottom, 0px))"
            : "80px",
        }}
      >
        {!isMobile && <Sidebar />}
        <main style={{ flex: 1, minWidth: 0 }}>
          <AnimatedLayout>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatedLayout>
        </main>
      </div>
      <QueuePanel />
      {isMobile ? (
        <>
          <MobilePlayerBar
            onOpenFullScreen={() => setIsFullPlayerOpen(true)}
          />
          <BottomNav
            isPlayerOpen={isFullPlayerOpen}
            onOpenNowPlaying={() => setIsFullPlayerOpen(true)}
          />
          <FullScreenPlayer
            isOpen={isFullPlayerOpen}
            onClose={() => setIsFullPlayerOpen(false)}
          />
        </>
      ) : (
        <>
          <PlayerBar />
          <KeyboardShortcuts isOpen={isHelpOpen} onClose={closeHelp} />
        </>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  usePlayerEvents();
  useQueueSync();
  useLibrarySync();

  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
};

export default App;
