# Current State — System Snapshot

> **Sprint planning:** [`sprints/README.md`](./sprints/README.md) | **Operating manual:** [`CLAUDE.md`](./CLAUDE.md)

---

## 1. Project Overview & Status

MusicWave is a native, multiplatform YouTube Music client built on a **Tauri v2 + React 19 + TypeScript** stack (see ADR 3 in [`decisions.md`](./decisions.md)).

### Completed Work
*   **CLI Audio Engine (Pre-Sprint 0):** YouTube Music search, YouTube signature cipher bypass, HTTP stream buffering, and CLI audio playback verified in Rust.
*   **Sprint 0 — Tauri Project Scaffolding:** Tauri v2 project initialized, Rust audio engine refactored into modular crates (`audio.rs`, `search.rs`, `stream.rs`, `commands.rs`), React + TypeScript + Vite frontend configured, IPC commands registered, and build verified.
*   **Sprint 1 — Core Search UI:** Full YouTube Music search interface implemented with `SearchBar`, `SongList`, `SongCard`, `Spinner`, Zustand `searchStore`, `useSearch` hook, design system in `index.css`, React Router navigation in `App.tsx`, and backend metadata serialization (`videoId`, `title`, `artist`, `album`, `duration`, `durationSeconds`, `thumbnailUrl`).
*   **Sprint 2 — Audio Playback & Player Bar:** Rust audio playback engine implemented with rodio + seekable HTTP range streaming (`play_track`, `pause`, `resume`, `stop`, `seek`, `set_volume`), real-time progress events (`player://progress`, `player://ended`, `player://auth-required`), and persistent bottom glassmorphism Player Bar.
*   **Sprint 3 — Queue, Library & Navigation:** Implemented Rust `queue.rs` (200-cap `VecDeque` play queue with auto-advance and `player://track-changed`) and `library.rs` (atomic `library.json` persistence for liked songs and max-50 recent plays), sidebar + routing (`/`, `/library`, `/artist/:id`, `/settings`), slide-out `QueuePanel`, `LibraryPage`, `ArtistPage`, clickable artist links, like/queue actions on `SongCard`, wired Previous/Next controls, and global `<ToastContainer />` notifications.
*   **Sprint 4 — Polish, Settings & Auth UX:** Implemented persistent `settings.rs` (`settings.json` with one-time legacy `headers.json` / `po_token.txt` migration and instant reload on playback), `SettingsPage` (auth credentials form, Test Connection, About + injected `__APP_VERSION__`), Linux `mpris.rs` (`zbus` D-Bus media player controls & metadata), `tray.rs` system tray icon + menu + close-to-tray, global keyboard shortcuts (`useKeyboardShortcuts` + `KeyboardShortcuts` modal), and Framer Motion transitions (`AnimatedLayout`, `SongCard` hover scale, `QueuePanel` slide-in).
*   **Sprint 5 — Android Port (Tauri Mobile):** Implemented mobile-responsive navigation (`BottomNav`, `MobilePlayerBar`, `FullScreenPlayer`, `mobile.css`), platform detection (`usePlatform.ts`), `tauri-plugin-os`, Android `minSdkVersion: 24`, and mobile conditional feature gating.
*   **Sprint 6 — Core Streaming Features & Discovery Experience:** Implemented Home discovery shelves (`/`) with Quick Picks, Trending Charts (#1–#10), and mood pill filters; dedicated Search page (`/search`); expandable `NowPlayingModal` and `FullScreenPlayer` lyrics sheet with LRCLIB timestamped synchronized lyrics; Auto-Queue recommendation engine via YouTube Music Watch Playlist radio; Repeat (`Off`, `All`, `One`) and Shuffle playback modes; custom user playlist creation, management, and track ordering (`library.json`).

### Active Sprint
*   **Sprint 6 complete; ready for Sprint 7 (Dual Authentication & Account Sync).**

### Sprints Overview
| Sprint | Name | Status |
|---|---|---|
| [0](./sprints/SPRINT-0.md) | Tauri Project Scaffolding | ✅ Complete |
| [1](./sprints/SPRINT-1.md) | Core Search UI | ✅ Complete |
| [2](./sprints/SPRINT-2.md) | Audio Playback & Player Bar | ✅ Complete |
| [3](./sprints/SPRINT-3.md) | Queue, Library & Navigation | ✅ Complete |
| [4](./sprints/SPRINT-4.md) | Polish, Settings & Auth UX | ✅ Complete |
| [5](./sprints/SPRINT-5.md) | Android Port (Tauri Mobile) | ✅ Complete (UI/Config) |
| [6](./sprints/SPRINT-6.md) | Core Streaming Features & Discovery | ✅ Complete |
| [7](./sprints/SPRINT-7.md) | Dual Authentication & Account Sync | ⏳ Planned |
| [8](./sprints/SPRINT-8.md) | Material Expressive Redesign | ⏳ Planned |

---

## 2. Current Directory Layout

```
musicwave/
├── src-tauri/                   # Rust backend (Tauri app)
│   ├── src/
│   │   ├── main.rs              # Tauri app entry point
│   │   ├── lib.rs               # Tauri builder, tray/MPRIS setup & IPC registration
│   │   ├── audio.rs             # Audio engine (rodio + HTTP range stream + tray/MPRIS sync)
│   │   ├── library.rs           # Liked songs & recent plays atomic JSON persistence
│   │   ├── mpris.rs             # Linux D-Bus MPRIS2 media keys & metadata (feature-gated)
│   │   ├── queue.rs             # Play queue (200-cap VecDeque) & auto-advance helpers
│   │   ├── search.rs            # YouTube Music search (ytmapi-rs) + unit tests
│   │   ├── settings.rs          # Persistent auth settings + legacy migration + cache
│   │   ├── stream.rs            # Stream URL resolution (rusty_ytdl) + HTTP range reader
│   │   ├── tray.rs              # Desktop system tray icon, menu & close-to-tray handler
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
*   **Framer Motion:** Route transitions, card hover animations, and slide-in queue drawer.
*   **Zustand:** Lightweight global state management (`searchStore`, `playerStore`, `queueStore`, `libraryStore`, `toastStore`).
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
