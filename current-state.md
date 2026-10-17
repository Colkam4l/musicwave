# Current State — System Snapshot

> **Sprint planning:** [`sprints/README.md`](./sprints/README.md) | **Operating manual:** [`CLAUDE.md`](./CLAUDE.md)

---

## 1. Project Overview & Status

MusicWave is a native, multiplatform YouTube Music client. The project has pivoted from a Slint GUI to a **Tauri v2 + React + TypeScript** stack (see ADR 3 in [`decisions.md`](./decisions.md)).

### Completed Work
*   **CLI Audio Engine (Pre-Sprint 0):** YouTube Music search, YouTube signature cipher bypass, HTTP stream buffering, and CLI audio playback verified in Rust.
*   **Sprint 0 — Tauri Project Scaffolding:** Tauri v2 project initialized, Rust audio engine refactored into modular crates (`audio.rs`, `search.rs`, `stream.rs`, `commands.rs`), React + TypeScript + Vite frontend configured, IPC commands registered (`ping`, `search`, `play`, `pause`, `resume`, `stop`), and build verified.

### Active Sprint
*   **Sprint 1 — Core Search UI:** ⏳ Next to start.

### Sprints Overview
| Sprint | Name | Status |
|---|---|---|
| [0](./sprints/SPRINT-0.md) | Tauri Project Scaffolding | ✅ Complete |
| [1](./sprints/SPRINT-1.md) | Core Search UI | ⏳ Next |
| [2](./sprints/SPRINT-2.md) | Audio Playback & Player Bar | ⏳ Not Started |
| [3](./sprints/SPRINT-3.md) | Queue, Library & Navigation | ⏳ Not Started |
| [4](./sprints/SPRINT-4.md) | Polish, Settings & Auth UX | ⏳ Not Started |
| [5](./sprints/SPRINT-5.md) | Android Port (Tauri Mobile) | ⏳ Not Started |

---

## 2. Current Directory Layout

```
musicwave/
├── src-tauri/                   # Rust backend (Tauri app)
│   ├── src/
│   │   ├── main.rs              # Tauri app entry point
│   │   ├── lib.rs               # Tauri builder and command registration
│   │   ├── audio.rs             # Audio engine (rodio + stream-download)
│   │   ├── search.rs            # YouTube Music search (ytmapi-rs)
│   │   ├── stream.rs            # Stream URL resolution (rusty_ytdl)
│   │   └── commands.rs          # All #[tauri::command] functions (IPC bridge)
│   ├── Cargo.toml               # Tauri backend dependencies
│   ├── tauri.conf.json          # Tauri application configuration
│   ├── capabilities/            # Window capabilities & permissions
│   └── icons/                   # Application icons
├── src/                         # React + TypeScript frontend (Vite)
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root app component
│   ├── index.css                # Global design tokens (CSS variables, reset)
│   └── components/
│       └── Placeholder.tsx      # Minimal placeholder proving window renders & IPC connects
├── public/                      # Static assets
├── index.html                   # Vite HTML entry point
├── vite.config.ts               # Vite configuration (base: "./")
├── tsconfig.json                # TypeScript config
├── tsconfig.node.json           # TypeScript config for node/vite
├── package.json                 # Frontend dependencies and scripts
├── CLAUDE.md                    # Operating manual and code standards
├── current-state.md             # Live system snapshot (this file)
├── decisions.md                 # Architectural Decision Records (ADRs)
├── SETUP.md                     # Environment and authentication setup guide
├── sprints/
│   ├── README.md                # Sprint index and conventions
│   ├── SPRINT-0.md              # Sprint 0 details & report
│   ├── SPRINT-1.md              # Search UI plan
│   ├── SPRINT-2.md              # Player bar plan
│   ├── SPRINT-3.md              # Queue and library plan
│   ├── SPRINT-4.md              # Polish and settings plan
│   └── SPRINT-5.md              # Android port plan
├── .gitignore                   # Excludes target, node_modules, dist, secrets
└── Cargo.toml                   # Workspace Cargo.toml (wraps src-tauri)
```

---

## 3. Active External Dependencies & Services

### Rust Backend
*   **tauri (v2):** Native application shell and IPC runtime.
*   **tokio:** Async runtime (multi-threaded).
*   **ytmapi-rs:** Unofficial YouTube Music API client — search and metadata.
*   **youtui-vendored-rusty_ytdl:** YouTube signature cipher and audio format resolver.
*   **stream-download:** HTTP range request streaming and local cache buffering.
*   **rodio:** Audio decoding and output to system soundcard.
*   **reqwest:** HTTP client (with JSON support) for custom authenticated requests.
*   **serde / serde_json:** Serialization for API responses and config files.

### Frontend
*   **Tauri v2:** Desktop app shell and IPC bridge (`@tauri-apps/api`, `@tauri-apps/plugin-opener`).
*   **React 19 + TypeScript + Vite:** Frontend framework and bundler.
*   **Zustand:** Lightweight global state management (to be integrated in Sprint 1).

---

## 4. Endpoints & Integrations

*   **YouTubei API (Unofficial):** Search query and song metadata resolution.
*   **YouTube Stream URLs:** Direct audio stream extraction via `rusty_ytdl`.
*   **D-Bus MPRIS:** System media key integration — Sprint 4, Linux only.
*   **Android AAudio:** Audio output on Android — Sprint 5.

---

## 5. Authentication

Two auth methods are supported (see [`SETUP.md`](./SETUP.md) for setup instructions):

| Method | File | Use Case |
|---|---|---|
| Browser cookies | `headers.json` (legacy) / `settings.json` (Sprint 4+) | Authenticated playback, private library |
| PO Token | `po_token.txt` (legacy) / `settings.json` (Sprint 4+) | Guest mode public streams |
