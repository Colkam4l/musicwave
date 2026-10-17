# Sprint 4 — Polish, Settings & System Integration

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-4-polish-settings` |
| **Depends On** | Sprint 3 complete and merged to `main` |
| **Status** | ⏳ Not Started |
| **Scope** | ~2 focused sessions |

> **Related docs:** [CLAUDE.md](../CLAUDE.md) · [decisions.md](../decisions.md) · [SETUP.md](../SETUP.md) · [Sprint Index](./README.md)

---

## 1. Context

By the end of Sprint 3, MusicWave has functional search, playback, queue, and library. This sprint transforms it from a functional prototype into a **polished desktop application** that feels native on Linux:

1. **Settings page** — so users can configure authentication without editing files manually.
2. **System tray** — so the app stays accessible when the window is closed.
3. **MPRIS D-Bus integration** — so media keys (play/pause, next, prev) work globally.
4. **Animations and micro-interactions** — so the app feels premium and alive.
5. **Keyboard shortcuts** — so power users can navigate without a mouse.

---

## 2. Deliverables

### 2.1 Files to Create / Modify

```
src-tauri/src/
├── mpris.rs            # CREATE — MPRIS D-Bus media player interface
├── tray.rs             # CREATE — system tray icon and context menu
├── settings.rs         # CREATE — read/write settings.json (auth config, preferences)
└── commands.rs         # MODIFY — add settings commands, tray commands

src/
├── pages/
│   └── SettingsPage.tsx         # CREATE — auth config + app preferences UI
├── components/
│   ├── KeyboardShortcuts.tsx    # CREATE — modal overlay showing all shortcuts
│   └── AnimatedLayout.tsx       # CREATE — Framer Motion page transition wrapper
├── hooks/
│   └── useKeyboardShortcuts.ts  # CREATE — global keyboard shortcut handler
└── index.css                    # MODIFY — add transition classes, refined animations
```

### 2.2 Tasks

#### Settings Backend
- [ ] **T4-1:** Create `settings.rs`. Define a `Settings` struct:
  ```rust
  #[derive(Serialize, Deserialize, Default)]
  struct Settings {
      cookie: Option<String>,
      user_agent: Option<String>,
      po_token: Option<String>,
  }
  ```
- [ ] **T4-2:** Implement `load_settings()` — reads from `~/.local/share/musicwave/settings.json`. Falls back to reading `headers.json` and `po_token.txt` from the working directory for backward compatibility (with a deprecation notice in the log).
- [ ] **T4-3:** Implement `save_settings(settings: Settings)` — atomic write.
- [ ] **T4-4:** Expose Tauri commands: `get_settings() -> Settings`, `save_settings(settings: Settings)`.
- [ ] **T4-5:** Refactor `load_auth_config()` in `stream.rs` to call `settings::load_settings()` instead of reading raw files directly.

#### MPRIS D-Bus Integration
- [ ] **T4-6:** Add `zbus` crate to `Cargo.toml` in `src-tauri/`:
  ```toml
  zbus = { version = "4", optional = true }
  ```
  Gate it behind `[features] mpris = ["dep:zbus"]` so it only compiles on Linux.
- [ ] **T4-7:** Create `mpris.rs` implementing the `org.mpris.MediaPlayer2.Player` D-Bus interface. Required properties/methods:
  - `PlaybackStatus` — "Playing" | "Paused" | "Stopped"
  - `Metadata` — `xesam:title`, `xesam:artist`, `mpris:artUrl`
  - `Play()`, `Pause()`, `PlayPause()`, `Next()`, `Previous()`, `Stop()`
- [ ] **T4-8:** Spawn the MPRIS service in `lib.rs` on app startup (Linux only, wrapped in `#[cfg(target_os = "linux")]`).
- [ ] **T4-9:** Keep MPRIS state in sync: when `playerStore` updates (via the `player://progress` event), update the MPRIS `PlaybackStatus` and `Metadata`.

#### System Tray
- [ ] **T4-10:** Create `tray.rs`. Set up a Tauri system tray icon with a context menu:
  - **Now Playing:** _(song title or "Nothing Playing")_ — disabled label
  - **Play / Pause**
  - **Next**
  - **Open MusicWave**
  - **Quit**
- [ ] **T4-11:** The window must minimize to tray (not exit) when the user clicks the window close button. Use Tauri's `on_window_event` to intercept the close event.
- [ ] **T4-12:** Update tray "Now Playing" label when the track changes (listen for `player://track-changed` event in the tray handler).

#### Settings Page
- [ ] **T4-13:** Build `SettingsPage.tsx` with two sections:
  - **Authentication** — Three fields: Cookie, User-Agent, PO Token (textarea for Cookie, text input for the rest). Save button calls `invoke('save_settings', { settings })`. Shows a success toast on save.
  - **About** — App version (`__APP_VERSION__` injected from `vite.config.ts` via `define`), GitHub link.
- [ ] **T4-14:** On the Settings page, add a "Test Connection" button that calls `invoke('search_songs', { query: 'test' })` and shows a success or error toast depending on the result.

#### Keyboard Shortcuts
- [ ] **T4-15:** Create `useKeyboardShortcuts.ts` — a global `useEffect` with a `keydown` listener. Supported shortcuts:
  | Shortcut | Action |
  |---|---|
  | `Space` | Play / Pause |
  | `→` (ArrowRight) | Seek +10 seconds |
  | `←` (ArrowLeft) | Seek -10 seconds |
  | `N` | Next track |
  | `P` | Previous track |
  | `/` | Focus search bar |
  | `Q` | Toggle queue panel |
  | `?` | Toggle keyboard shortcuts modal |
  | `Ctrl+,` | Open Settings |
- [ ] **T4-16:** Build `KeyboardShortcuts.tsx` — a centered modal overlay triggered by `?`. Lists all shortcuts in a two-column table. Closes on `Esc` or clicking outside.

#### Animations (Framer Motion)
- [ ] **T4-17:** Install `framer-motion`:
  ```bash
  npm install framer-motion
  ```
- [ ] **T4-18:** Create `AnimatedLayout.tsx` — wraps each page with a `motion.div` that fades in/slides up when mounted:
  ```tsx
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
  ```
- [ ] **T4-19:** Wrap `SongCard` hover state with a `motion.div` for a subtle scale effect (`scale: 1.01` on hover).
- [ ] **T4-20:** Animate the Queue Panel slide-in from the right using `AnimatePresence` + `motion.aside`.

---

## 3. Implementation Notes

### MPRIS on Linux Only
The MPRIS implementation uses `zbus` which only makes sense on Linux. Use conditional compilation:
```rust
#[cfg(target_os = "linux")]
mod mpris;
```
On Windows/macOS, media key integration can be a future enhancement.

### Tray Icon Asset
Create a minimal SVG icon for the tray (`src-tauri/icons/tray.png`, 32×32 or 16×16). Use the same icon as the app window icon if no dedicated tray design is available.

### Settings Migration
The `load_settings()` function must gracefully migrate users who previously had `headers.json` and `po_token.txt`:
1. If `settings.json` does not exist, check for `headers.json`.
2. If `headers.json` exists, read it, save its values into `settings.json`, and log: `"Migrated auth from headers.json to settings.json. You can delete headers.json."`.

### Keyboard Shortcut Conflict Guard
The `Space` shortcut must only fire when no input element is focused. Check `document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'` before dispatching.

### Code Style (from CLAUDE.md)
- Conventional commits: `feat: add mpris dbus integration`, `feat: add settings page`, `feat: add keyboard shortcuts`
- All new Rust modules must pass `cargo clippy -- -D warnings`

---

## 4. Definition of Done

- [ ] Settings page saves and loads auth credentials (Cookie, User-Agent, PO Token)
- [ ] After saving settings, a new play attempt uses the saved credentials (no restart needed)
- [ ] "Test Connection" button on Settings page works
- [ ] System tray icon appears; clicking it opens the app window
- [ ] Window close button minimizes to tray, not quit; Quit option in tray menu exits
- [ ] Media keys (play/pause, next) on the keyboard trigger the correct action (Linux)
- [ ] `?` key opens the keyboard shortcuts modal
- [ ] `Space` bar toggles play/pause when no input is focused
- [ ] Page transitions are animated (fade + slide)
- [ ] `cargo clippy -- -D warnings` passes
- [ ] `npm run build` compiles with zero TypeScript errors
- [ ] End-of-Sprint Report section below is filled in

---

## 5. End-of-Sprint Report

> ⚠️ **This section is filled in by the implementing agent after completion.**

### Date Completed
_TBD_

### What Was Built
_Describe each file created and its role._

### How to Test

```bash
npm run tauri dev

# Settings test:
# 1. Navigate to Settings (/settings)
# 2. Paste your Cookie and User-Agent from browser dev tools
# 3. Click Save → success toast appears
# 4. Search and play a song → audio plays (using saved credentials)
# 5. Click Test Connection → success toast

# Tray test:
# 1. Click window close button → app disappears from taskbar but tray icon remains
# 2. Click tray icon → window reappears
# 3. Right-click tray → click Quit → app exits fully

# Media keys test (Linux):
# 1. Play a song
# 2. Press the keyboard Play/Pause media key → audio pauses
# 3. Press Next media key → next queued song plays

# Keyboard shortcuts test:
# 1. Press ? → shortcuts modal appears
# 2. Press Esc → modal closes
# 3. Press Space while a song plays → pauses
# 4. Press / → search bar is focused
```

### Known Issues / Notes for Sprint 5
_Any caveats or tech debt._
