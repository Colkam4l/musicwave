# Sprint 0 — Tauri Project Scaffolding

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-0-tauri-scaffold` |
| **Depends On** | Nothing — this is the foundation sprint |
| **Status** | ✅ Complete |
| **Scope** | ~1 focused session |

> **Related docs:** [CLAUDE.md](../CLAUDE.md) · [decisions.md](../decisions.md) · [SETUP.md](../SETUP.md) · [Sprint Index](./README.md)

---

## 1. Context

The project currently has a working Rust CLI audio engine in `src/main.rs` that can:
- Query YouTube Music via `ytmapi-rs`
- Resolve audio stream URLs via `youtui-vendored-rusty_ytdl`
- Buffer and stream audio via `stream-download`
- Output audio to speakers via `rodio`

This sprint pivots the project from a raw CLI tool to a **Tauri v2 desktop app** with a React + TypeScript + Vite frontend. The Rust audio engine is preserved and refactored into Tauri commands.

See **ADR 3** in [`decisions.md`](../decisions.md) for the rationale behind choosing Tauri + React over the originally planned Slint GUI.

---

## 2. Deliverables

### 2.1 New Directory Structure (target state after this sprint)

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
│   ├── Cargo.toml               # Updated with tauri dependency
│   └── tauri.conf.json          # Tauri app configuration
├── src/                         # React + TypeScript frontend (Vite)
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root app component + router setup
│   ├── index.css                # Global design tokens (CSS variables, reset)
│   └── components/
│       └── Placeholder.tsx      # Minimal placeholder proving the window renders
├── index.html                   # Vite HTML entry point
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config
├── package.json                 # Frontend dependencies
├── CLAUDE.md                    # Updated to reflect Tauri stack
├── current-state.md             # Updated to reflect Sprint 0 complete
├── decisions.md                 # ADR 3 added
├── SETUP.md                     # Updated with Tauri dev prerequisites
├── sprints/                     # This directory
│   ├── README.md
│   ├── SPRINT-0.md              (this file)
│   ├── SPRINT-1.md
│   ├── SPRINT-2.md
│   ├── SPRINT-3.md
│   ├── SPRINT-4.md
│   └── SPRINT-5.md
├── .gitignore                   # Updated to include node_modules, dist
└── Cargo.toml                   # Workspace Cargo.toml (wraps src-tauri)
```

### 2.2 Tasks

- [x] **T0-1:** Run `cargo tauri init` (or `npm create tauri-app`) to scaffold the Tauri v2 project around the existing repo
- [x] **T0-2:** Move existing Rust source from `src/` to `src-tauri/src/`
- [x] **T0-3:** Refactor `src-tauri/src/main.rs` into modules: `audio.rs`, `search.rs`, `stream.rs`, `commands.rs`
- [x] **T0-4:** Register at least one smoke-test Tauri command: `#[tauri::command] async fn ping() -> String`
- [x] **T0-5:** Initialize the Vite + React + TypeScript frontend in `src/`
- [x] **T0-6:** Verify `cargo tauri dev` launches a Tauri window displaying the React app
- [x] **T0-7:** Update `.gitignore` to exclude `node_modules/`, `dist/`, `src-tauri/target/`
- [x] **T0-8:** Update `CLAUDE.md` — replace Slint UI styling section with Tauri/React section
- [x] **T0-9:** Update `current-state.md` — new directory layout, new active deps, new commands
- [x] **T0-10:** Add ADR 3 to `decisions.md` documenting the Slint → Tauri pivot decision

---

## 3. Implementation Notes

### Tauri Version
Use **Tauri v2** (not v1). The `cargo tauri` CLI command is from `@tauri-apps/cli` v2.

```bash
npm install --save-dev @tauri-apps/cli@next
npx tauri init
```

Or bootstrap from scratch:
```bash
npm create tauri-app@latest . -- --template react-ts --manager npm
```

### Rust Workspace
The root `Cargo.toml` must become a workspace manifest pointing to `src-tauri`:

```toml
[workspace]
members = ["src-tauri"]
```

### Refactoring `main.rs`
The existing `main.rs` audio engine code must be split into:
- `search.rs` — `YtMusic` initialization and `search_songs(query: &str)` function
- `stream.rs` — Stream URL resolution, `load_auth_config()`, `resolve_stream_url(video_id)` function
- `audio.rs` — `DeviceSink`, `Player` setup and `play_stream(url)` function
- `commands.rs` — Tauri `#[tauri::command]` wrappers that call into the above modules
- `lib.rs` — Registers all commands with the Tauri builder

### Frontend Scaffold
The React frontend must use:
- **TypeScript** (strict mode)
- **Vite** as the bundler (`vite.config.ts` must set `base: "./"`)
- **CSS Modules** or a single `index.css` global file — no Tailwind in Sprint 0

### Code Style Rules (from CLAUDE.md)
- Rust: use `anyhow` for error handling, `tokio` async runtime, group imports std → external → crate
- Conventional commits: `feat: scaffold tauri project`, `refactor: split main.rs into modules`

---

## 4. Definition of Done

All of the following must be true before this sprint is merged to `main`:

- [x] `cargo tauri dev` runs without errors and opens a desktop window
- [x] The desktop window displays a React component (even if just "MusicWave is loading...")
- [x] `cargo clippy -- -D warnings` passes with zero warnings in `src-tauri/`
- [x] `cargo fmt --check` passes in `src-tauri/`
- [x] `node_modules/`, `dist/`, and build artifacts are excluded from git
- [x] `current-state.md` reflects the new directory structure
- [x] ADR 3 has been added to `decisions.md`
- [x] `CLAUDE.md` Section 2 (commands) updated with `npm run tauri dev` and frontend commands
- [x] End-of-Sprint Report section below is filled in

---

## 5. End-of-Sprint Report

### Date Completed
2026-10-17

### What Was Built
1. **Tauri v2 Workspace**:
   - Converted root into a Cargo workspace containing `src-tauri`.
   - Initialized Tauri v2 desktop shell with `tauri.conf.json`, `capabilities/default.json`, build scripts, and window configuration.
2. **Modular Rust Audio & Search Engine** (`src-tauri/src/`):
   - `search.rs`: Unauthenticated YouTube Music search via `ytmapi-rs`.
   - `stream.rs`: Stream URL resolution via `youtui-vendored-rusty_ytdl` with `headers.json` and `po_token.txt` auth handling.
   - `audio.rs`: `AudioPlayer` thread-safe struct managing `rodio` (v0.22) and `stream-download` for gapless HTTP buffering.
   - `commands.rs`: Registered IPC handlers: `ping`, `search`, `play`, `pause`, `resume`, `stop`.
   - `lib.rs` & `main.rs`: Tauri builder, state management (`SharedAudioPlayer`), plugin initialization (`tauri-plugin-opener`), and desktop entry point.
3. **React 19 + TypeScript Frontend** (`src/`):
   - Vite 8 bundler configuration with `base: "./"`, strict ports, and Tauri HMR integration.
   - Global design system in `src/index.css` (custom properties, dark mode tokens, typography).
   - `src/components/Placeholder.tsx` confirming window rendering and IPC connectivity (`ping` returning `"pong"`).
4. **Code Quality**:
   - `cargo fmt --check`: Passed (clean formatting across backend).
   - `cargo clippy -- -D warnings`: Passed with zero warnings.
   - `npm run build`: Passed (TypeScript check and Vite client bundling in 176ms).
   - `npx tauri build --debug`: Built native executable `/home/colkam/coding/ytmusicclient/target/debug/musicwave`.

### Commands to Test

```bash
# Start the dev app (desktop window with hot reloading)
npm run tauri dev

# Type check and build frontend bundle
npm run build

# Check Rust backend formatting and lints
cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings
```

### Known Issues / Notes for Sprint 1
- Sprint 1 will build the full Search UI (search input with debouncing, search results grid with album art, and Zustand store integration).
- The `ping` smoke test verified IPC communication; Sprint 1 will wire `invoke('search')` to the interactive search results view.
