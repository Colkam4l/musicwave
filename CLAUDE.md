# CLAUDE.md — Operating Manual

Operating rules, commands, and code styling standards for the MusicWave project.

> **Sprint planning:** See [`sprints/README.md`](./sprints/README.md) for the full development roadmap.

---

## 1. Project Definition

MusicWave is a native, multiplatform YouTube Music client. The architecture is split into two layers:

- **Rust backend** (`src-tauri/`): handles all audio logic, YouTube Music API queries, stream URL resolution, and system integrations. Built on `tokio`, `ytmapi-rs`, `youtui-vendored-rusty_ytdl`, `stream-download`, and `rodio`.
- **React frontend** (`src/`): the user interface, built with React 18 + TypeScript + Vite. Communicates with the Rust backend exclusively through the Tauri IPC bridge (`invoke` calls and event listeners).

The desktop app is packaged with **Tauri v2**. The same codebase will be compiled to Android in Sprint 5 using Tauri's mobile build targets.

> **ADR note:** The project originally planned Slint as the GUI framework. This was replaced by Tauri + React — see ADR 3 in [`decisions.md`](./decisions.md) for the full rationale.

---

## 2. Core Execution Commands

### Rust Backend
*   **Compile backend only:** `cd src-tauri && cargo build`
*   **Lint backend:** `cd src-tauri && cargo clippy -- -D warnings`
*   **Format backend:** `cd src-tauri && cargo fmt`
*   **Test backend:** `cd src-tauri && cargo test`

### Full App (Tauri + Frontend)
*   **Start dev app:** `npm run tauri dev`
*   **Build production bundle:** `npm run tauri build`

### Frontend Only
*   **Start Vite dev server (no Tauri):** `npm run dev`
*   **Type-check:** `npm run typecheck` (or `npx tsc --noEmit`)
*   **Build frontend:** `npm run build`

### Android
*   **Start Android dev app:** `cargo tauri android dev`
*   **Build Android APK:** `cargo tauri android build --debug`

---

## 3. Code Style & Standards

### Rust Constraints
*   **Async Runtime:** Use [`tokio`](https://crates.io/crates/tokio) with multi-threaded features.
*   **Error Handling:** Use [`anyhow`](https://crates.io/crates/anyhow) for application-level errors. Use [`thiserror`](https://crates.io/crates/thiserror) for library-style error enums if a module needs typed errors.
*   **Imports Order:** Group standard library (`std::*`) first, then third-party crates, then internal modules (`crate::*`). Separate each group with a blank line.
*   **Concurrency:** Use `tokio::sync::Mutex` and `tokio::sync::mpsc` for shared state and inter-thread messaging between the audio thread and Tauri command handlers.
*   **Platform Guards:** Use `#[cfg(target_os = "linux")]` / `#[cfg(target_os = "android")]` for platform-specific code. Never use runtime OS detection when compile-time is available.

### React / TypeScript Constraints
*   **Components:** Functional components only. No class components.
*   **State:** Global state via **Zustand** stores (in `src/store/`). Local component state via `useState`/`useReducer`.
*   **Tauri IPC:** Always use `invoke` from `@tauri-apps/api/core` and `listen` from `@tauri-apps/api/event`. Never use `window.__TAURI__` directly.
*   **TypeScript:** Strict mode enabled. No `any` types. All Tauri command return shapes must have a matching TypeScript interface in `src/types/`.
*   **Imports:** Absolute imports via `@/` alias (configured in `vite.config.ts` and `tsconfig.json`).

### UI Styling
*   **CSS variables only** — all colours, spacing, radii, and font sizes must be defined as CSS custom properties in `src/index.css`. No hardcoded hex values or magic numbers in component files.
*   **Dark theme by default** — `--bg-primary: #0d0d0d`, `--bg-surface: #1a1a1a`, accent is a deep rose/music tone.
*   **Font:** Inter (imported from Google Fonts).
*   **Animations:** Use **Framer Motion** for page transitions and component mount/unmount animations. Keep durations under 200ms for interactive feedback.
*   **Mobile:** Touch targets must be >= 44x44px. Use `env(safe-area-inset-bottom)` for bottom navigation on Android.
*   **No Tailwind** — use CSS Modules or global CSS variables.

---

## 4. Module Structure (Rust)

```
src-tauri/src/
├── main.rs         # Tauri app entry point (minimal — delegates to lib.rs)
├── lib.rs          # Registers all Tauri commands and plugins, spawns background services
├── commands.rs     # All #[tauri::command] functions — thin wrappers that call into modules
├── search.rs       # YouTube Music search via ytmapi-rs
├── stream.rs       # Stream URL resolution via rusty_ytdl + auth config loading
├── audio.rs        # Audio playback engine (rodio + stream-download), global player state
├── queue.rs        # In-memory play queue (VecDeque<SongResult>)
├── library.rs      # Persistent liked songs and recently played (library.json)
├── settings.rs     # Persistent user settings (settings.json: auth credentials, prefs)
├── mpris.rs        # MPRIS D-Bus interface (Linux only)
└── tray.rs         # System tray icon and menu (desktop only)
```

---

## 5. Git & Branching Strategy

*   **Branch Naming:**
    *   `feature/sprint-<number>-<description>` for sprint tasks.
    *   `bugfix/<issue-id>-<description>` for bug fixes.
*   **Commit Message Convention:** Follow Conventional Commits:
    *   `feat: add play_song tauri command`
    *   `fix: handle missing headers.json gracefully`
    *   `refactor: split main.rs into audio and search modules`
    *   `docs: update current-state.md for sprint 2`
*   **PR Requirements:** PRs must include:
    1. Passing `cargo clippy -- -D warnings` output.
    2. Passing `npm run build` with zero TypeScript errors.
    3. The **End-of-Sprint Report** section filled in for the relevant sprint doc.
    4. Updated `current-state.md` reflecting the new state of the project.
