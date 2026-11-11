import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { SearchPage } from "./pages/SearchPage";
import { LibraryPage } from "./pages/LibraryPage";
import { ArtistPage } from "./pages/ArtistPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Sidebar } from "./components/Sidebar";
import { QueuePanel } from "./components/QueuePanel";
import { PlayerBar } from "./components/PlayerBar";
import { ToastContainer } from "./components/Toast";
import { usePlayerEvents } from "./hooks/usePlayer";
import { useQueueSync } from "./hooks/useQueue";
import { useLibrarySync } from "./hooks/useLibrary";

export const App: React.FC = () => {
  usePlayerEvents();
  useQueueSync();
  useLibrarySync();

  return (
    <HashRouter>
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
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <QueuePanel />
      <PlayerBar />
    </HashRouter>
  );
};

export default App;
