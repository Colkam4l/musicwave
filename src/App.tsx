import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { SearchPage } from "./pages/SearchPage";
import { PlayerBar } from "./components/PlayerBar";
import { AuthToast } from "./components/AuthToast";

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthToast />
      <div style={{ minHeight: "100vh", paddingBottom: "88px" }}>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <PlayerBar />
    </HashRouter>
  );
};

export default App;
