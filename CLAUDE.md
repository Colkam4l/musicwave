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

### UI Styling — Design System

#### Visual Direction: Hybrid Glassmorphism + Premium Dark
The app uses a two-zone visual system:

- **Content zone** (search results, song lists, pages): Deep dark surfaces with subtle hover lifts.
- **Player bar** (persistent bottom shell): Full glassmorphism — `backdrop-filter: blur(28px)`, semi-transparent dark glass surface, thin luminous border.
- **Overlays/Modals** (Sprint 3+): Glassmorphism matching the player bar.

#### Accent: Iridescent Gradient
The accent system shifts across `rose → violet → blue`. Never use a single flat accent colour — always use the gradient or a stop from it:
```css
--accent-gradient: linear-gradient(135deg, #e91e8c 0%, #7c3aed 50%, #3b82f6 100%);
--accent-rose:   #e91e8c;
--accent-violet: #7c3aed;
--accent-blue:   #3b82f6;
```

This gradient is used on:
- Play button fill and glow ring
- Active/focused states (search bar focus, selected song row)
- Progress bar fill
- Album art glow ring in the player bar (Sprint 2)
- Eventually reacts to dominant album art color (Sprint 4)

#### Token Reference (must live in `src/index.css`)
```css
/* Backgrounds */
--bg-primary:          #0d0d0d;   /* page background */
--bg-surface:          #161616;   /* card / input surface */
--bg-surface-hover:    #222222;   /* hovered card */
--bg-surface-elevated: #282828;   /* dropdown / elevated card */
--bg-glass:            rgba(18, 18, 18, 0.72); /* glassmorphism base */

/* Borders */
--border-subtle:  rgba(255, 255, 255, 0.08);
--border-glass:   rgba(255, 255, 255, 0.13);
--border-focus:   #7c3aed;  /* violet stop of accent gradient */

/* Accents (always use gradient or a single stop — no custom hex) */
--accent-gradient: linear-gradient(135deg, #e91e8c 0%, #7c3aed 50%, #3b82f6 100%);
--accent-rose:   #e91e8c;
--accent-violet: #7c3aed;
--accent-blue:   #3b82f6;
--accent-glow:   rgba(124, 58, 237, 0.32);  /* violet at 32% — used for box-shadow glow */

/* Text */
--text-primary:   #f5f5f7;
--text-secondary: #a1a1aa;
--text-muted:     #71717a;

/* Typography */
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-size-xs:   0.75rem;
--font-size-sm:   0.875rem;
--font-size-base: 0.875rem;
--font-size-md:   1rem;
--font-size-lg:   1.25rem;
--font-size-xl:   1.75rem;

/* Radii */
--radius-sm:   6px;
--radius-md:   10px;
--radius-lg:   16px;
--radius-full: 9999px;

/* Transitions */
--transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 220ms cubic-bezier(0.4, 0, 0.2, 1);
```

#### Glassmorphism Recipe (for Player Bar + Modals)
```css
background: var(--bg-glass);
backdrop-filter: blur(28px) saturate(180%);
-webkit-backdrop-filter: blur(28px) saturate(180%);
border-top: 1px solid var(--border-glass);
box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.6);
```

#### Rules
*   **CSS variables only** — no hardcoded hex values in component files. Every color must reference a CSS variable.
*   **Font:** Inter (imported from Google Fonts) at 14px base.
*   **Animations:** Use **Framer Motion** for page transitions and component mount/unmount (Sprint 4). Use CSS transitions for hover/focus states (150–220ms).
*   **Mobile:** Touch targets ≥ 44×44px. Use `env(safe-area-inset-bottom)` for player bar padding on Android.
*   **No Tailwind** — global CSS variables + scoped inline styles in component files.


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
