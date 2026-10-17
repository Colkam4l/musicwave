import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { SearchPage } from "./pages/SearchPage";

export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
