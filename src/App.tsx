import React, { useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import { SearchPage } from "./pages/SearchPage";
import { LibraryPage } from "./pages/LibraryPage";
import { ArtistPage } from "./pages/ArtistPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Sidebar } from "./components/Sidebar";
import { QueuePanel } from "./components/QueuePanel";
import { PlayerBar } from "./components/PlayerBar";
import { ToastContainer } from "./components/Toast";
import { AnimatedLayout } from "./components/AnimatedLayout";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { usePlayerEvents } from "./hooks/usePlayer";
import { useQueue, useQueueSync } from "./hooks/useQueue";
import { useLibrarySync } from "./hooks/useLibrary";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const AppShell: React.FC = () => {
  const location = useLocation();
  const { isHelpOpen, closeHelp } = useKeyboardShortcuts();
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
    <>
      <ToastContainer />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          paddingBottom: "80px",
        }}
      >
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0 }}>
          <AnimatedLayout>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatedLayout>
        </main>
      </div>
      <QueuePanel />
      <PlayerBar />
      <KeyboardShortcuts isOpen={isHelpOpen} onClose={closeHelp} />
    </>
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
