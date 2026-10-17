import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export const Placeholder: React.FC = () => {
  const [pingStatus, setPingStatus] = useState<string>("Checking Rust IPC...");
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    async function testIpc() {
      try {
        const res = await invoke<string>("ping");
        setPingStatus(`Connected: Rust IPC returned "${res}"`);
        setIsReady(true);
      } catch (err) {
        setPingStatus(`IPC Notice: Running in browser or IPC initializing (${String(err)})`);
      }
    }
    testIpc();
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "2rem",
      textAlign: "center",
      background: "radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)",
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: "20px",
        background: "var(--accent-gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 12px 32px rgba(99, 102, 241, 0.35)",
        marginBottom: "1.5rem",
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>

      <h1 style={{
        fontSize: "2.75rem",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        marginBottom: "0.75rem",
        background: "var(--accent-gradient)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        MusicWave
      </h1>

      <p style={{
        color: "var(--text-secondary)",
        fontSize: "1.1rem",
        maxWidth: "500px",
        lineHeight: 1.6,
        marginBottom: "2rem",
      }}>
        Desktop YouTube Music client powered by Tauri v2, React, and native Rust audio streaming.
      </p>

      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.6rem 1.25rem",
        borderRadius: "9999px",
        background: "var(--bg-surface-elevated)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
      }}>
        <span style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: isReady ? "#22c55e" : "#f59e0b",
          boxShadow: isReady ? "0 0 8px #22c55e" : "0 0 8px #f59e0b",
        }} />
        <span style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 500 }}>
          {pingStatus}
        </span>
      </div>

      <div style={{
        marginTop: "3rem",
        padding: "1rem 1.5rem",
        borderRadius: "var(--radius-md)",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--border-subtle)",
        maxWidth: "460px",
        fontSize: "0.85rem",
        color: "var(--text-muted)",
      }}>
        <strong>Sprint 0 Scaffolding Complete:</strong> Tauri v2 window loaded, React 19 + TypeScript active, Rust IPC commands registered.
      </div>
    </div>
  );
};
