# Sprint 3 — Queue, Library & Navigation

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-3-queue-library` |
| **Depends On** | Sprint 2 complete and merged to `main` |
| **Status** | ⏳ Not Started |
| **Scope** | ~2–3 focused sessions |

> **Related docs:** [CLAUDE.md](../CLAUDE.md) · [decisions.md](../decisions.md) · [SETUP.md](../SETUP.md) · [Sprint Index](./README.md)

---

## 1. Context

After Sprint 2, the user can search for a song and hear it play. But MusicWave still lacks the features that make it feel like a real music app:

1. **A queue** — so playing one song automatically flows into the next.
2. **A sidebar** — so the user can navigate between Search, Library, and Settings without losing the playing song.
3. **A Library** — so liked songs and recently played tracks persist across restarts.
4. **Artist/Album pages** — so clicking an artist name reveals more of their catalogue.

All persistence in this sprint uses a **local JSON file** (no database). The file lives at `~/.local/share/musicwave/library.json` on Linux.

---

## 2. Deliverables

### 2.1 Files to Create / Modify

```
src-tauri/src/
├── library.rs          # CREATE — read/write library.json (liked songs, recents)
├── queue.rs            # CREATE — in-memory queue state management
└── commands.rs         # MODIFY — add queue and library Tauri commands

src/
├── components/
│   ├── Sidebar.tsx              # CREATE — left nav: Search / Library / Settings links
│   ├── QueuePanel.tsx           # CREATE — right-side slide-out queue drawer
│   └── Toast.tsx                # CREATE — generic toast/snackbar notification system
├── pages/
│   ├── LibraryPage.tsx          # CREATE — liked songs + recently played sections
│   └── ArtistPage.tsx           # CREATE — artist search results page (songs by artist)
├── store/
│   ├── queueStore.ts            # CREATE — Zustand queue state
│   └── libraryStore.ts          # CREATE — Zustand library state (liked, recents)
├── hooks/
│   ├── useQueue.ts              # CREATE — queue logic (add, skip, remove, auto-advance)
│   └── useLibrary.ts            # CREATE — library logic (like/unlike, add to recents)
└── App.tsx                      # MODIFY — add sidebar layout, routing for /library, /artist/:id
```

### 2.2 Tasks

#### Rust Backend — Queue
- [ ] **T3-1:** Create `queue.rs` with a `tokio::sync::Mutex<VecDeque<SongResult>>` as a global queue state.
- [ ] **T3-2:** Implement functions: `enqueue_next(song)`, `enqueue_last(song)`, `dequeue_front() -> Option<SongResult>`, `clear_queue()`, `get_queue() -> Vec<SongResult>`.
- [ ] **T3-3:** Modify `audio.rs`: when `player://ended` event fires, call `dequeue_front()` and if a song exists, automatically call `play()` with the next song. Emit `player://track-changed` event to the frontend.

#### Rust Backend — Library
- [ ] **T3-4:** Create `library.rs`. Define `Library` struct:
  ```rust
  #[derive(Serialize, Deserialize, Default)]
  struct Library {
      liked_songs: Vec<SongResult>,
      recent_plays: VecDeque<SongResult>, // max 50 entries
  }
  ```
- [ ] **T3-5:** Implement `load_library() -> Library` (reads from `~/.local/share/musicwave/library.json`, creates file if absent).
- [ ] **T3-6:** Implement `save_library(library: &Library)` (atomic write using a temp file + rename).
- [ ] **T3-7:** Expose Tauri commands: `like_song(song)`, `unlike_song(video_id)`, `get_liked_songs()`, `get_recent_plays()`.
- [ ] **T3-8:** In `audio.rs`, when a song begins playing, call `library::add_to_recents(song)`.

#### Frontend — Sidebar Layout
- [ ] **T3-9:** Build `Sidebar.tsx` — a fixed left column (220px wide) with navigation links:
  - 🔍 Search (`/`)
  - ❤️ Library (`/library`)
  - ⚙️ Settings (`/settings`) — page is placeholder for Sprint 4
  - A "Queue" icon button that opens `QueuePanel`
- [ ] **T3-10:** Update `App.tsx` layout to: `[Sidebar] | [Page Content]` side by side. Player Bar remains at the bottom spanning full width.

#### Frontend — Queue
- [ ] **T3-11:** Build `QueuePanel.tsx` — a slide-in drawer from the right showing the ordered list of queued songs. Each item has a remove (×) button and can be drag-reordered (use `@dnd-kit/core` or simple index swap, not drag-and-drop if too complex).
- [ ] **T3-12:** Add "Add to Queue" context action on each `SongCard` (right-click or a `+` icon on hover).
- [ ] **T3-13:** Wire `useQueue.ts` to listen for `player://ended` and auto-advance.
- [ ] **T3-14:** Wire `PlaybackControls.tsx` Previous/Next buttons (stubbed in Sprint 2) to `useQueue` skip functions.

#### Frontend — Library
- [ ] **T3-15:** Build `LibraryPage.tsx`:
  - **Liked Songs** section — grid of `SongCard` components loaded via `invoke('get_liked_songs')`
  - **Recently Played** section — horizontal scroll row of last 10 played songs
- [ ] **T3-16:** Add a ❤️ like button to `SongCard`. Filled = liked, outline = not liked. Calls `invoke('like_song')` or `invoke('unlike_song')`.
- [ ] **T3-17:** Build `ArtistPage.tsx` — calls `invoke('search_songs', { query: artistName })` and filters results. Navigated to from `SongCard` artist name click (link).

#### Notifications
- [ ] **T3-18:** Build a `Toast.tsx` system (a `<ToastContainer>` rendered in `App.tsx` outside the router). Exposes a `useToast()` hook that any component can call to show a message. Replace the Sprint 2 auth error inline message with this system.

---

## 3. Implementation Notes

### Library File Location
Use Tauri's path API to resolve the data directory:

```rust
use tauri::Manager;
let data_dir = app_handle.path().app_data_dir()?;
let library_path = data_dir.join("library.json");
```

This resolves to `~/.local/share/musicwave/library.json` on Linux (XDG compliant) and the equivalent on Windows/macOS.

### Queue Capacity
Cap the queue at **200 songs** to prevent unbounded memory growth. If the user tries to add a 201st song, show a toast: "Queue is full (200 songs max)."

### Recently Played
Keep max **50 entries**. When a new song is added and the list is at capacity, remove the oldest entry (index 0).

### Auto-advance on Song End
The Rust side emits `player://ended`. The frontend `useQueue` hook listens for it. If the queue is non-empty, it calls `invoke('play_song', { videoId })` with the next queued song. If the queue is empty, it sets `isPlaying = false` and leaves the Player Bar showing the last song.

### Sidebar Active State
Use React Router's `NavLink` (or a manual `useLocation` check) to highlight the active page in the sidebar with the accent colour.

### Code Style (from CLAUDE.md)
- Rust: `VecDeque` for the queue and recents (efficient front-pop), `serde_json::to_string_pretty` for library file writes
- Conventional commits: `feat: add play queue`, `feat: add liked songs library`

---

## 4. Definition of Done

- [ ] Playing a song and letting it end automatically plays the next queued song
- [ ] Queue panel opens and shows the current queue
- [ ] Adding a song to the queue from search results works
- [ ] Liked songs persist across app restarts
- [ ] Library page shows liked songs and recently played tracks
- [ ] Clicking an artist name navigates to a page showing their songs
- [ ] Previous / Next buttons in the player bar work
- [ ] Toast notifications replace all direct `alert()` or inline error strings
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

# Queue test:
# 1. Search "Daft Punk" → click a song → it plays
# 2. Right-click another song → "Add to Queue"
# 3. Open Queue panel → second song is listed
# 4. Let first song end (or click Next) → second song auto-plays

# Library test:
# 1. Click the heart on a song → it fills
# 2. Navigate to Library → song appears in Liked Songs
# 3. Restart the app → liked song is still there

# Artist test:
# 1. Click an artist name on any song card → artist page opens with their songs
```

### Known Issues / Notes for Sprint 4
_Any caveats or tech debt._
