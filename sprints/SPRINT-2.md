# Sprint 2 — Audio Playback & Player Bar

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-2-player-bar` |
| **Depends On** | Sprint 1 complete and merged to `main` |
| **Status** | ✅ Completed |
| **Scope** | ~2 focused sessions |

> **Related docs:** [CLAUDE.md](../CLAUDE.md) · [decisions.md](../decisions.md) · [SETUP.md](../SETUP.md) · [Sprint Index](./README.md)

---

## 1. Context

Sprint 1 produced a search page that lists songs. This sprint turns MusicWave into a real music player — clicking a song must begin streaming audio and display a **persistent bottom Player Bar** showing now-playing information, playback controls, and a scrubable progress bar.

This sprint involves the deepest Tauri IPC work: bi-directional communication where Rust emits real-time progress events to the React frontend, not just one-off command responses.

See **ADR 2** in [`decisions.md`](../decisions.md) for the audio stack rationale (rodio + stream-download + rusty_ytdl).

### Design Direction (CONFIRMED — Sprint 2 Onwards)

The player bar is the **primary showpiece** for the confirmed visual identity:

> **Hybrid: Glassmorphism Player Bar + Premium Dark Content**
>
> - Content zone (search, song list): deep `#0d0d0d` background, `#161616` surfaces, subtle hover lifts
> - **Player Bar**: full glassmorphism — `backdrop-filter: blur(28px) saturate(180%)`, semi-transparent dark glass, luminous `rgba(255,255,255,0.13)` border
> - **Accent**: iridescent gradient `rose #e91e8c → violet #7c3aed → blue #3b82f6` on the play button, progress bar fill, and glow ring around album art

The full design token spec is in **[CLAUDE.md § UI Styling — Design System](../CLAUDE.md)**.

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
│   ├── PlayerBar.tsx             # CREATE — persistent bottom glassmorphism bar (always visible)
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
- [x] **T2-1:** In `stream.rs`, implement `resolve_stream_url(video_id: &str, cookie: Option<String>, po_token: Option<String>) -> Result<String>` that uses `rusty_ytdl` + `load_auth_config()` to return a direct HTTP stream URL.
- [x] **T2-2:** In `audio.rs`, implement a global audio state manager using `tokio::sync::Mutex<Option<PlayerState>>` where `PlayerState` holds the active `rodio::Player` handle.
- [x] **T2-3:** Implement the following functions in `audio.rs`:
  - `play(stream_url: String, app_handle: AppHandle)` — starts playback, emits `player://progress` events every 500ms
  - `pause()` — pauses the active player
  - `resume()` — resumes the active player
  - `stop()` — stops and drops the active player
  - `seek(position_seconds: f64)` — seeks to position (if supported by the stream format)
- [x] **T2-4:** In `commands.rs`, wrap each audio function as a `#[tauri::command]`:
  - `play_song(video_id: String, app_handle: tauri::AppHandle)`
  - `pause_playback()`
  - `resume_playback()`
  - `stop_playback()`
  - `seek_to(position_seconds: f64)`
- [x] **T2-5:** Emit Tauri events from the `play` function on the Rust side:
  ```rust
  // Event name: "player://progress"
  // Payload: { elapsed_seconds: f64, total_seconds: f64, is_playing: bool }
  app_handle.emit("player://progress", payload)?;

  // Event name: "player://ended"
  // Payload: {}
  app_handle.emit("player://ended", ())?;
  ```

#### Frontend
- [x] **T2-6:** Define `playerStore.ts` with Zustand state:
  ```ts
  interface PlayerState {
    currentSong: Song | null;
    isPlaying: boolean;
    elapsedSeconds: number;
    totalSeconds: number;
    volume: number; // 0.0–1.0
  }
  ```
- [x] **T2-7:** In `usePlayer.ts`, set up `listen('player://progress', ...)` and `listen('player://ended', ...)` from `@tauri-apps/api/event` to keep `playerStore` in sync.
- [x] **T2-8:** In `SongCard.tsx` (from Sprint 1), wire `onClick` to call `invoke('play_song', { videoId: song.videoId })` and update `playerStore.currentSong`.
- [x] **T2-9:** Build `NowPlaying.tsx` — shows the current song's thumbnail (40×40 with iridescent glow ring), title (truncated), and artist name. Only visible when `currentSong !== null`.
- [x] **T2-10:** Build `PlaybackControls.tsx` — play/pause toggle button (uses iridescent gradient fill when playing), previous and next buttons (stubs until Sprint 3 queue).
- [x] **T2-11:** Build `ProgressBar.tsx` — a range input styled as a seek bar using the iridescent gradient for the filled portion, showing `elapsedSeconds / totalSeconds`. Dragging calls `invoke('seek_to', { positionSeconds })`.
- [x] **T2-12:** Build `VolumeControl.tsx` — a range input (0–100). Changes call `invoke('set_volume', { volume })` (add this command in `commands.rs`).
- [x] **T2-13:** Assemble `PlayerBar.tsx` — `[NowPlaying] [PlaybackControls] [ProgressBar] [VolumeControl]` in a single row, fixed to the bottom of the window with **glassmorphism styling**.
- [x] **T2-14:** In `App.tsx`, render `<PlayerBar>` outside the router so it persists across all pages. Also add bottom padding (`padding-bottom: 88px`) to page content to prevent the player bar from overlapping content.

#### Auth Integration
- [x] **T2-15:** Before resolving the stream URL, `play_song` must call `load_auth_config()`. If no auth file is found, emit a `player://auth-required` event so the frontend can display a setup prompt.

---

## 3. Implementation Notes

### Player Bar Visual Spec (CRITICAL)

The player bar must match the confirmed design direction. Do NOT use a plain dark bar — use the full glassmorphism recipe:

```css
/* PlayerBar container */
position: fixed;
bottom: 0;
left: 0;
right: 0;
height: 80px;
z-index: 100;

/* Glassmorphism */
background: rgba(12, 12, 12, 0.72);
backdrop-filter: blur(28px) saturate(180%);
-webkit-backdrop-filter: blur(28px) saturate(180%);
border-top: 1px solid rgba(255, 255, 255, 0.13);
box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.6);
```

**Album art glow ring** (NowPlaying thumbnail):
```css
/* Wrap the 40×40 thumbnail in a div */
border-radius: 8px;
box-shadow:
  0 0 0 2px rgba(255, 255, 255, 0.06),
  0 0 20px rgba(124, 58, 237, 0.40); /* var(--accent-glow) */
```

**Play button** (PlaybackControls):
```css
background: var(--accent-gradient); /* linear-gradient(135deg, #e91e8c, #7c3aed, #3b82f6) */
border-radius: 50%;
width: 44px;
height: 44px;
box-shadow: 0 4px 16px rgba(124, 58, 237, 0.40);
```

**Progress bar fill**:
```css
/* Use accent-gradient for the filled track */
accent-color: var(--accent-violet); /* fallback for range inputs */
/* Custom track fill via CSS custom properties or a div overlay */
```

### Player Bar Layout
```
┌─────────────────────────────────────────────────────────┐
│ [glow-thumb] Title · Artist  │ ⏮  ◉  ⏭ │ ━━━━●━━━━ 1:23/3:45 │ 🔊──● │
└─────────────────────────────────────────────────────────┘
```
- Height: 80px fixed (increased from 72px for touch targets on Android)
- `z-index: 100` to sit above page content
- Content area adds `padding-bottom: 88px` to prevent overlap

### Progress Bar Behaviour
- The seek bar should update smoothly every 500ms from the Rust progress event
- While the user is dragging, freeze the automatic updates (use a `isDragging` flag)
- Only call `invoke('seek_to')` on mouse-up, not on every drag tick

### Known YouTube Seek Limitation
YouTube streams via `stream-download` may not support arbitrary seeking — the `seek_to` command can be a no-op stub in this sprint with a `// TODO: Sprint 4` comment. The progress bar drag should still update the UI display even if the audio position does not change.

### Auth Error Flow
If `player://auth-required` is emitted:
- Display a non-blocking toast/snackbar at the top of the screen: *"Authentication required. Please set up your credentials in Settings."*
- The Settings page is built in Sprint 4; for now, the toast is sufficient.

### Code Style (from CLAUDE.md)
- Rust: use `tokio::sync::Mutex` for shared player state, `mpsc` channels for inter-thread communication
- Conventional commits: `feat: add play_song tauri command`, `feat: build glassmorphism player bar`

---

## 4. Definition of Done

- [x] Clicking a song from search results starts audio playback
- [x] The Player Bar appears at the bottom with the song title, artist, and thumbnail — using full glassmorphism styling
- [x] The play button uses the iridescent gradient fill
- [x] The progress bar advances in real time
- [x] Play/Pause button toggles correctly
- [x] The app does not crash when a song ends naturally
- [x] If `headers.json` is missing, a toast message appears instead of a crash
- [x] `cargo clippy -- -D warnings` passes
- [x] `cargo fmt --check` passes
- [x] `npm run build` compiles with zero TypeScript errors
- [x] End-of-Sprint Report section below is filled in

---

## 5. End-of-Sprint Report

### Date Completed
October 17, 2026

### What Was Built
- **`src-tauri/src/stream.rs`**: Updated `resolve_stream_url` to support optional cookies and po_token, returning the resolved HTTP stream URL, track duration in seconds, and configured reqwest playback client.
- **`src-tauri/src/audio.rs`**: Built global audio state manager `AUDIO_STATE` (`tokio::sync::Mutex<Option<PlayerState>>`), with `play`, `pause`, `resume`, `stop`, `seek`, and `set_volume`. Configured background task ticking every 500ms emitting `player://progress` and emitting `player://ended` when playback finishes.
- **`src-tauri/src/commands.rs`**: Added Tauri command handlers `play_song`, `pause_playback`, `resume_playback`, `stop_playback`, `seek_to`, `set_volume` with auth verification that emits `player://auth-required` when `headers.json` is missing.
- **`src-tauri/src/lib.rs`**: Registered all audio and playback commands with Tauri builder.
- **`src/index.css`**: Updated design tokens with iridescent gradient (`rose #e91e8c → violet #7c3aed → blue #3b82f6`) and glassmorphism recipe tokens.
- **`src/store/playerStore.ts`**: Created Zustand store managing `currentSong`, `isPlaying`, `elapsedSeconds`, `totalSeconds`, `volume`, and `authRequiredToast`.
- **`src/hooks/usePlayer.ts`**: Custom hook managing bidirectional IPC (`player://progress`, `player://ended`, `player://auth-required`) and playback control actions (`playSong`, `togglePlayPause`, `seekTo`, `changeVolume`).
- **`src/components/NowPlaying.tsx`**: Left-side metadata component displaying 40×40 thumbnail wrapped in violet glow ring with truncated song title and artist.
- **`src/components/PlaybackControls.tsx`**: Center playback controls featuring iridescent circular play/pause toggle (44×44px touch target) and stub previous/next buttons.
- **`src/components/ProgressBar.tsx`**: Real-time scrubbing progress bar with iridescent gradient fill track, elapsed/total timestamps, and pointer capture drag handling.
- **`src/components/VolumeControl.tsx`**: Volume control with mute/unmute toggle and interactive 0–100 slider.
- **`src/components/PlayerBar.tsx`**: Bottom persistent glassmorphism container (`backdrop-filter: blur(28px) saturate(180%)`, height 80px, z-index 100).
- **`src/components/AuthToast.tsx`**: Non-blocking toast notification displayed when YouTube auth credentials are required.
- **`src/components/SongCard.tsx`**: Wired click event to invoke audio playback, added active playing indicator.
- **`src/App.tsx`**: Rendered `<PlayerBar />` persistently outside routes, added `padding-bottom: 88px` on main layout.

### How to Test

```bash
npm run tauri dev

# In the app:
# 1. Search "Daft Punk Get Lucky" → results appear
# 2. Click a result → glassmorphism Player Bar appears at bottom, audio plays
# 3. The play button shows iridescent gradient; album art has a violet glow ring
# 4. Click Pause → audio pauses, button becomes Play
# 5. Click Play → audio resumes
# 6. Wait for song to end → Player Bar stays visible but is_playing = false
# 7. Rename headers.json to headers.json.bak and restart → toast appears on play
```

### Known Issues / Notes for Sprint 3
- Seeking on live HTTP mp4 streams via `stream-download` is stubbed (`seek_to` no-op) per ADR and Sprint 2 plan; will be finalized in Sprint 4.
- Previous and Next buttons are visual stubs ready to connect to the in-memory play queue in Sprint 3.
