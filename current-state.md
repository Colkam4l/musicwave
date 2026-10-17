# Current State — System Snapshot

> **Sprint planning:** [`sprints/README.md`](./sprints/README.md) | **Operating manual:** [`CLAUDE.md`](./CLAUDE.md)

---

## 1. Project Overview & Status

MusicWave is a native, multiplatform YouTube Music client built on a **Tauri v2 + React 19 + TypeScript** stack (see ADR 3 in [`decisions.md`](./decisions.md)).

### Completed Work
*   **CLI Audio Engine (Pre-Sprint 0):** YouTube Music search, YouTube signature cipher bypass, HTTP stream buffering, and CLI audio playback verified in Rust.
*   **Sprint 0 — Tauri Project Scaffolding:** Tauri v2 project initialized, Rust audio engine refactored into modular crates (`audio.rs`, `search.rs`, `stream.rs`, `commands.rs`), React + TypeScript + Vite frontend configured, IPC commands registered, and build verified.
*   **Sprint 1 — Core Search UI:** Full YouTube Music search interface implemented with `SearchBar`, `SongList`, `SongCard`, `Spinner`, Zustand `searchStore`, `useSearch` hook, design system in `index.css`, React Router navigation in `App.tsx`, and backend metadata serialization (`videoId`, `title`, `artist`, `album`, `duration`, `durationSeconds`, `thumbnailUrl`).
*   **Sprint 2 — Audio Playback & Player Bar:** Rust audio playback engine implemented with rodio + stream-download (`play`, `pause`, `resume`, `stop`, `seek`, `set_volume`), real-time progress events (`player://progress`, `player://ended`, `player://auth-required`), persistent bottom glassmorphism Player Bar with album art glow ring, iridescent play/pause toggle button, scrubable progress bar, volume control, and non-blocking auth toast.

### Active Sprint
*   **Sprint 3 — Queue, Library & Navigation:** ⏳ Next to start.

### Sprints Overview
| Sprint | Name | Status |
|---|---|---|
| [0](./sprints/SPRINT-0.md) | Tauri Project Scaffolding | ✅ Complete |
| [1](./sprints/SPRINT-1.md) | Core Search UI | ✅ Complete |
| [2](./sprints/SPRINT-2.md) | Audio Playback & Player Bar | ✅ Complete |
| [3](./sprints/SPRINT-3.md) | Queue, Library & Navigation | ⏳ Next |
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
│   │   ├── search.rs            # YouTube Music search (ytmapi-rs) + unit tests
│   │   ├── stream.rs            # Stream URL resolution (rusty_ytdl)
│   │   └── commands.rs          # All #[tauri::command] functions (IPC bridge)
│   ├── Cargo.toml               # Tauri backend dependencies
│   ├── tauri.conf.json          # Tauri application configuration
│   ├── capabilities/            # Window capabilities & permissions
│   └── icons/                   # Application icons
├── src/                         # React + TypeScript frontend (Vite)
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root app component + React Router + PlayerBar
│   ├── index.css                # Global design tokens (iridescent gradient, glassmorphism, reset)
│   ├── pages/
│   │   └── SearchPage.tsx       # Main search screen
│   ├── components/
│   │   ├── AuthToast.tsx        # Non-blocking authentication prompt toast
│   │   ├── NowPlaying.tsx       # Thumbnail with glow ring + song title & artist
│   │   ├── PlaybackControls.tsx # Iridescent play/pause button, prev/next stubs
│   │   ├── PlayerBar.tsx        # Bottom glassmorphism container
│   │   ├── ProgressBar.tsx      # Scrubable progress bar with gradient fill
│   │   ├── SearchBar.tsx        # Styled input with clear button and loading state
│   │   ├── SongCard.tsx         # Result row with thumbnail, metadata, duration, click-to-play
│   │   ├── SongList.tsx         # Container with states (empty, loading, results, error)
│   │   ├── Spinner.tsx          # Loading indicator
│   │   └── VolumeControl.tsx    # Volume slider & mute toggle
│   ├── hooks/
│   │   ├── usePlayer.ts         # Audio playback IPC & event listeners
│   │   └── useSearch.ts         # Search IPC invocation & store integration
│   ├── store/
│   │   ├── playerStore.ts       # Zustand store for playback & now-playing state
│   │   └── searchStore.ts       # Zustand store for query and results
│   └── types/
│       └── music.ts             # Song & SearchState interfaces
├── public/                      # Static assets
├── index.html                   # Vite HTML entry point
├── vite.config.ts               # Vite configuration (base: "./")
├── tsconfig.json                # TypeScript config
├── tsconfig.node.json           # TypeScript config for node/vite
├── package.json                 # Frontend dependencies (Zustand, React Router, Lucide)
├── CLAUDE.md                    # Operating manual and code standards
├── current-state.md             # Live system snapshot (this file)
├── decisions.md                 # Architectural Decision Records (ADRs)
├── SETUP.md                     # Environment and authentication setup guide
├── sprints/
│   ├── README.md                # Sprint index and conventions
│   ├── SPRINT-0.md              # Sprint 0 details & report (Complete)
│   ├── SPRINT-1.md              # Sprint 1 details & report (Complete)
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
*   **reqwest:** HTTP client for custom authenticated requests.
*   **serde / serde_json:** Serialization for API responses and config files.

### Frontend
*   **Tauri v2:** Desktop app shell and IPC bridge (`@tauri-apps/api`, `@tauri-apps/plugin-opener`).
*   **React 19 + TypeScript + Vite:** Frontend framework and bundler.
*   **Zustand:** Lightweight global state management for search.
*   **React Router DOM:** Client-side routing.
*   **Lucide React:** Icons.

---

## 4. Endpoints & Integrations

*   **YouTubei API (Unofficial):** Search query and song metadata resolution (`search_songs` command).
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
