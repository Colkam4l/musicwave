# Sprint 2 — Audio Playback & Player Bar

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-2-player-bar` |
| **Depends On** | Sprint 1 complete and merged to `main` |
| **Status** | ⏳ Not Started |
| **Scope** | ~2 focused sessions |

> **Related docs:** [CLAUDE.md](../CLAUDE.md) · [decisions.md](../decisions.md) · [SETUP.md](../SETUP.md) · [Sprint Index](./README.md)

---

## 1. Context

Sprint 1 produced a search page that lists songs. This sprint turns MusicWave into a real music player — clicking a song must begin streaming audio and display a **persistent bottom Player Bar** showing now-playing information, playback controls, and a scrubable progress bar.

This sprint involves the deepest Tauri IPC work: bi-directional communication where Rust emits real-time progress events to the React frontend, not just one-off command responses.

See **ADR 2** in [`decisions.md`](../decisions.md) for the audio stack rationale (rodio + stream-download + rusty_ytdl).

---

## 2. Deliverables

### 2.1 Files to Create / Modify

```
src-tauri/src/
├── audio.rs          # MODIFY — expose play, pause, resume, stop, seek as async fns
├── stream.rs         # MODIFY — expose resolve_stream_url(video_id, auth) as async fn
├── commands.rs       # MODIFY — add play_song, pause, resume, stop, seek Tauri commands
└── lib.rs            # MODIFY — register new commands + set up Tauri event emitter

src/
├── components/
│   ├── PlayerBar.tsx             # CREATE — persistent bottom bar (always visible)
│   ├── PlaybackControls.tsx      # CREATE — prev / play-pause / next buttons
│   ├── ProgressBar.tsx           # CREATE — scrubable seek bar with elapsed/total time
│   ├── VolumeControl.tsx         # CREATE — volume slider
│   └── NowPlaying.tsx            # CREATE — thumbnail + title + artist (left side of bar)
├── store/
│   └── playerStore.ts            # CREATE — Zustand store for player state
├── hooks/
│   └── usePlayer.ts              # CREATE — all player logic + Tauri event listeners
└── App.tsx                       # MODIFY — render <PlayerBar> persistently below all pages
```

### 2.2 Tasks

#### Rust Backend
- [ ] **T2-1:** In `stream.rs`, implement `resolve_stream_url(video_id: &str, cookie: Option<String>, po_token: Option<String>) -> Result<String>` that uses `rusty_ytdl` + `load_auth_config()` to return a direct HTTP stream URL.
- [ ] **T2-2:** In `audio.rs`, implement a global audio state manager using `tokio::sync::Mutex<Option<PlayerState>>` where `PlayerState` holds the active `rodio::Player` handle.
- [ ] **T2-3:** Implement the following functions in `audio.rs`:
  - `play(stream_url: String, app_handle: AppHandle)` — starts playback, emits `player://progress` events every 500ms
  - `pause()` — pauses the active player
  - `resume()` — resumes the active player
  - `stop()` — stops and drops the active player
  - `seek(position_seconds: f64)` — seeks to position (if supported by the stream format)
- [ ] **T2-4:** In `commands.rs`, wrap each audio function as a `#[tauri::command]`:
  - `play_song(video_id: String, app_handle: tauri::AppHandle)`
  - `pause_playback()`
  - `resume_playback()`
  - `stop_playback()`
  - `seek_to(position_seconds: f64)`
- [ ] **T2-5:** Emit Tauri events from the `play` function on the Rust side:
  ```rust
  // Event name: "player://progress"
  // Payload: { elapsed_seconds: f64, total_seconds: f64, is_playing: bool }
  app_handle.emit("player://progress", payload)?;
  
  // Event name: "player://ended"
  // Payload: {}
  app_handle.emit("player://ended", ())?;
  ```

#### Frontend
- [ ] **T2-6:** Define `playerStore.ts` with Zustand state:
  ```ts
  interface PlayerState {
    currentSong: Song | null;
    isPlaying: boolean;
    elapsedSeconds: number;
    totalSeconds: number;
    volume: number; // 0.0–1.0
  }
  ```
- [ ] **T2-7:** In `usePlayer.ts`, set up `listen('player://progress', ...)` and `listen('player://ended', ...)` from `@tauri-apps/api/event` to keep `playerStore` in sync.
- [ ] **T2-8:** In `SongCard.tsx` (from Sprint 1), wire `onClick` to call `invoke('play_song', { videoId: song.videoId })` and update `playerStore.currentSong`.
- [ ] **T2-9:** Build `NowPlaying.tsx` — shows the current song's thumbnail (40×40), title (truncated), and artist name. Only visible when `currentSong !== null`.
- [ ] **T2-10:** Build `PlaybackControls.tsx` — play/pause toggle button, previous and next buttons (previous/next are stub no-ops until Sprint 3 introduces the queue).
- [ ] **T2-11:** Build `ProgressBar.tsx` — a range input styled as a seek bar, showing `elapsedSeconds / totalSeconds`. Dragging calls `invoke('seek_to', { positionSeconds })`.
- [ ] **T2-12:** Build `VolumeControl.tsx` — a range input (0–100). Changes call `invoke('set_volume', { volume })` (add this command in `commands.rs`).
- [ ] **T2-13:** Assemble `PlayerBar.tsx` — `[NowPlaying] [PlaybackControls] [ProgressBar] [VolumeControl]` laid out in a single row, fixed to bottom of the window.
- [ ] **T2-14:** In `App.tsx`, render `<PlayerBar>` outside the router so it persists across all pages.

#### Auth Integration
- [ ] **T2-15:** Before resolving the stream URL, `play_song` must call `load_auth_config()`. If no auth file is found, emit a `player://auth-required` event so the frontend can display a setup prompt.

---

## 3. Implementation Notes

### Player Bar Layout
```
┌─────────────────────────────────────────────────────────┐
│ [thumb] Title · Artist  │ ⏮  ⏸  ⏭ │ ━━━━●━━━━ 1:23/3:45 │ 🔊──● │
└─────────────────────────────────────────────────────────┘
```
- Height: 72px fixed
- Background: `var(--bg-surface)` with a top border 1px solid `var(--border-subtle)`
- `z-index: 100` to sit above page content

### Progress Bar Behaviour
- The seek bar should update smoothly every 500ms from the Rust progress event
- While the user is dragging, freeze the automatic updates (use a `isDragging` flag)
- Only call `invoke('seek_to')` on mouse-up, not on every drag tick

### Known YouTube Seek Limitation
YouTube streams via `stream-download` may not support arbitrary seeking — the `seek_to` command can be a no-op stub in this sprint with a `// TODO: Sprint 4` comment. The progress bar drag should still update the UI display even if the audio position does not change.

### Auth Error Flow
If `player://auth-required` is emitted:
- Display a non-blocking toast/snackbar at the top of the screen: "Authentication required. Please set up your credentials in Settings."
- The Settings page is built in Sprint 4; for now, the toast is sufficient.

### Code Style (from CLAUDE.md)
- Rust: use `tokio::sync::Mutex` for shared player state, `mpsc` channels for inter-thread communication
- Conventional commits: `feat: add play_song tauri command`, `feat: build player bar component`

---

## 4. Definition of Done

- [ ] Clicking a song from search results starts audio playback
- [ ] The Player Bar appears at the bottom with the song title, artist, and thumbnail
- [ ] The progress bar advances in real time
- [ ] Play/Pause button toggles correctly
- [ ] The app does not crash when a song ends naturally
- [ ] If `headers.json` is missing, a toast message appears instead of a crash
- [ ] `cargo clippy -- -D warnings` passes
- [ ] `cargo fmt --check` passes
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

# In the app:
# 1. Search "Daft Punk Get Lucky" → results appear
# 2. Click a result → Player Bar appears at bottom, audio plays
# 3. Click Pause → audio pauses, button becomes Play
# 4. Click Play → audio resumes
# 5. Wait for song to end → Player Bar stays visible but is_playing = false
# 6. Rename headers.json to headers.json.bak and restart → toast appears on play
```

### Known Issues / Notes for Sprint 3
_Any caveats or tech debt._
