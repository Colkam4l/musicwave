# Sprint 6 — Core Streaming Features & Discovery Experience

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-6-core-features` |
| **Depends On** | Sprint 5 complete and merged to `main` |
| **Status** | ✅ Complete |
| **Scope** | ~3–4 focused sessions |

> **Related docs:** [CLAUDE.md](../CLAUDE.md) · [decisions.md](../decisions.md) · [SETUP.md](../SETUP.md) · [Sprint Index](./README.md) · [Feature Gap Report](../.gemini/antigravity/brain/116d04ef-f500-4d5c-b6da-47162cfcbb50/musicwave-feature-gap-and-roadmap-report.md)

---

## 1. Context

Through Sprints 0–5, MusicWave established its core playback pipeline, seekable HTTP range streaming, audio controls, library persistence, settings, system tray, MPRIS integration, and mobile responsive layout.

However, MusicWave currently behaves as a **search-and-play tool** rather than a **complete streaming service**. In this sprint, we bridge the core functional gap between MusicWave and modern music streaming clients like Spotify, Tidal, and Bitchord:

1. **Rich Home & Discovery Page (`/`):** Replace the empty search default with a discovery home featuring real song/album thumbnail shelves (Quick Picks from history, Trending Charts, Mood & Genre shelves).
2. **Dedicated Search Page (`/search`):** Move search input and results to a dedicated page with category filter chips (Songs, Artists, Albums, Playlists).
3. **Expandable / Immersive Now Playing View:** An expandable full-window desktop and mobile view with animated album artwork (breathing glow / vinyl rotation), synchronized timestamped lyrics (via LRCLIB & YouTube Music), track credits, and queue management.
4. **Recommendation Algorithm & Auto-Queue:** Integrate YouTube Music's Watch Playlist Radio (`GetWatchPlaylistQuery` on `RDAMVM<videoId>`). When the user's manual queue finishes, automatically append recommended tracks so music never stops.
5. **Custom Playlist Creation & Management:** Allow users to create, rename, and delete playlists, and add/remove songs from any track menu, stored persistently in `library.json`.
6. **Enhanced Playback Modes:** Add Shuffle and Repeat modes (`Off`, `All`, `One`), handled cleanly in the queue engine without altering the underlying audio decoder.

---

## 2. Deliverables

### 2.1 Files to Create / Modify

```
src-tauri/src/
├── search.rs            # MODIFY — add get_home_shelves, get_watch_playlist (radio), get_lyrics commands
├── library.rs           # MODIFY — expand Library schema with playlists: Vec<UserPlaylist> and CRUD helpers
├── audio.rs             # MODIFY — add RepeatMode (Off, All, One) and Auto-Queue trigger on track end
├── queue.rs             # MODIFY — add shuffle/unshuffle and append_recommended helpers
└── commands.rs          # MODIFY — expose new playlist, home, radio, lyrics, and repeat/shuffle commands

src/
├── pages/
│   ├── HomePage.tsx     # CREATE — discovery view with Quick Picks, Trending, and Mood shelves
│   ├── SearchPage.tsx   # MODIFY — relocated to route /search with category filter chips
│   └── PlaylistPage.tsx # CREATE — custom playlist tracklist, playback, edit, and delete
├── components/
│   ├── NowPlayingModal.tsx # CREATE — expandable full-window now playing sheet with lyrics & visualizer
│   ├── LyricsSheet.tsx  # CREATE — synchronized scrolling lyrics component with active line highlighting
│   ├── PlaylistModal.tsx # CREATE — create playlist / add to playlist dialog
│   ├── Sidebar.tsx      # MODIFY — update navigation links (Home, Search, Library, Settings)
│   ├── BottomNav.tsx    # MODIFY — update mobile navigation links (Home, Search, Library, Settings)
│   ├── PlaybackControls.tsx # MODIFY — wire Shuffle and Repeat mode buttons
│   ├── SongCard.tsx     # MODIFY — add "Add to Playlist" action in context/dropdown menu
│   └── PlayerBar.tsx    # MODIFY — click on now-playing opens expandable NowPlayingModal
├── store/
│   ├── playerStore.ts   # MODIFY — add repeatMode, isShuffled, isAutoQueueEnabled, currentLyrics
│   └── libraryStore.ts  # MODIFY — add playlists state, createPlaylist, addToPlaylist, etc.
├── hooks/
│   ├── useLyrics.ts     # CREATE — fetch and sync timestamped lyrics with elapsedSeconds
│   └── useRecommendations.ts # CREATE — fetch radio recommendations and manage auto-queue
```

---

### 2.2 Tasks

#### 1. Backend Discovery & Recommendation Endpoints
- [x] **T6-1:** Implement `get_home_shelves` in `src-tauri/src/search.rs` (fetching trending charts, mood categories, and listen-again seeds using `ytmapi-rs` browse queries).
- [x] **T6-2:** Implement `get_watch_playlist` in `src-tauri/src/search.rs` using `GetWatchPlaylistQuery::new_from_video_id` (`RDAMVM<videoId>`) to fetch 25–50 contextual radio recommendations.
- [x] **T6-3:** Implement `get_lyrics` in `src-tauri/src/search.rs` fetching lyrics from YouTube Music (`GetLyricsIDQuery` + `GetLyricsQuery`) with fallback to LRCLIB API for synchronized timestamped lyrics.
- [x] **T6-4:** Expose Tauri commands in `commands.rs`: `get_home_shelves`, `get_watch_playlist`, `get_lyrics`.

#### 2. Playlist Creation & Library Backend
- [x] **T6-5:** Extend `Library` struct in `src-tauri/src/library.rs` with `pub playlists: Vec<UserPlaylist>`, where `UserPlaylist` contains `id`, `name`, `description`, `created_at`, `updated_at`, and `tracks: Vec<SongResult>`.
- [x] **T6-6:** Add atomic CRUD operations in `library.rs`: `create_playlist`, `delete_playlist`, `rename_playlist`, `add_to_playlist`, `remove_from_playlist`, `reorder_playlist`.
- [x] **T6-7:** Expose playlist Tauri commands in `commands.rs`.

#### 3. Playback Modes & Auto-Queue Engine
- [x] **T6-8:** Add `RepeatMode` enum (`Off`, `All`, `One`) in `audio.rs`. When track ends:
  - If `One`: seek to 0 and replay the same track.
  - If `All`: re-enqueue the finished track at the back of the queue.
  - If `Off`: dequeue front normally.
- [x] **T6-9:** Implement Auto-Queue in `audio.rs`: when the user queue is empty and auto-queue is enabled, query `get_watch_playlist` for the current track and automatically append recommendations.
- [x] **T6-10:** Add queue shuffle/unshuffle in `queue.rs` preserving history and active song.

#### 4. Frontend Home & Search Split
- [x] **T6-11:** Build `HomePage.tsx` at route `/`:
  - Quick Picks / Listen Again shelf (from `recent_plays` and history seeds).
  - Trending Charts shelf (top tracks with high-res thumbnails).
  - Mood & Genre shelves with horizontal scroll and quick-play buttons.
- [x] **T6-12:** Move `SearchPage.tsx` to route `/search` and update sidebar and mobile bottom nav to have separate `Home` (`/`) and `Search` (`/search`) navigation items.

#### 5. Expandable Now Playing View & Synced Lyrics
- [x] **T6-13:** Build `NowPlayingModal.tsx` on desktop (and link with mobile `FullScreenPlayer`):
  - Expandable by clicking the album art or title on `PlayerBar`.
  - Fluid animated album artwork (breathing glow / subtle vinyl animation).
  - Synchronized lyrics panel (`LyricsSheet.tsx`) highlighting the active line matching `elapsedSeconds` with auto-scroll.
  - Up Next / Queue tab with drag/drop or move controls.
- [x] **T6-14:** Wire Shuffle and Repeat (`Off` -> `All` -> `One`) buttons into `PlaybackControls.tsx` and `PlayerBar.tsx`.

#### 6. Custom Playlists UI
- [x] **T6-15:** Build `PlaylistPage.tsx` (`/playlist/:id`) with playlist banner, total track count, total duration, Play All, Shuffle Play, and track list.
- [x] **T6-16:** Add "Add to Playlist" action in `SongCard.tsx` context menu opening `PlaylistModal.tsx`.
- [x] **T6-17:** Add Playlists tab in `LibraryPage.tsx` with "Create Playlist" button and grid of user playlists.

---

## 3. Implementation Notes

### Non-Disruption Guarantee
All new features must preserve the working audio pipeline (`rodio` seekable HTTP range streaming in `audio.rs` and `stream.rs`). Shuffle, repeat, and auto-queue operate at the `queue.rs` level and must never interrupt active streaming.

### Graceful Fallbacks for Offline & Unauthenticated States
- If `get_home_shelves` fails (e.g. offline), `HomePage` gracefully displays local recently played and liked songs.
- If LRCLIB or YouTube Music has no lyrics for a track, the lyrics view displays a clean "No lyrics available for this song" message without crashing.
- Playlists are stored in `library.json` locally using atomic writes, requiring zero external database or cloud account.

---

## 4. Definition of Done

- [x] Route `/` is the Home discovery page with real song/album thumbnail shelves
- [x] Route `/search` is the dedicated search page
- [x] Clicking on the Player Bar opens the expandable Now Playing view
- [x] Synchronized / plain lyrics display and auto-scroll with playback
- [x] When the queue ends, Auto-Queue automatically fetches and appends related radio tracks
- [x] Repeat mode cycles between Off, All, and One; Repeat One correctly loops the current song
- [x] Shuffle mode randomizes the remaining queue
- [x] Users can create, rename, and delete custom playlists
- [x] Songs can be added to and removed from custom playlists
- [x] `cargo clippy -- -D warnings` passes with 0 warnings
- [x] `npm run build` passes with zero TypeScript errors
- [x] End-of-Sprint Report section below is filled in

---

## 5. End-of-Sprint Report

### Date Completed
November 14, 2026

### What Was Built
1. **Discovery & Recommendation Backend (`src-tauri/src/search.rs` & `commands.rs`):**
   - Implemented `get_home_shelves` fetching Trending Charts, Quick Picks, and dynamic Mood categories via `GetMoodCategoriesQuery`.
   - Implemented `get_watch_playlist` querying YouTube Music's radio endpoint (`RDAMVM<videoId>`).
   - Implemented `get_lyrics` integrating LRCLIB API for real-time timestamped synchronized lyrics (`[mm:ss.xx] line`) with YouTube Music official lyrics fallback.
2. **Custom Playlist Engine (`src-tauri/src/library.rs` & `commands.rs`):**
   - Extended local `library.json` schema with `UserPlaylist` (`id`, `name`, `description`, `tracks`, `created_at`, `updated_at`).
   - Implemented atomic CRUD operations: create, delete, rename, add, remove, and reorder.
3. **Playback Modes & Auto-Queue (`src-tauri/src/audio.rs` & `queue.rs`):**
   - Added `RepeatMode` (`Off`, `All`, `One`). `One` loops the active track at completion; `All` cycles finished tracks back into queue.
   - Built Auto-Queue engine: when user queue runs out, automatically queries `get_watch_playlist` for contextual song radio and continues playback seamlessly.
   - Implemented `shuffle_queue` for in-place queue randomization without external dependencies.
4. **Frontend Architecture & Navigation:**
   - Built `HomePage.tsx` mounted at `/` with Quick Picks, Trending Charts (#1–#10), and mood pill filters.
   - Relocated search to `/search` with auto-query param routing (`?q=...`).
   - Built `NowPlayingModal.tsx` for desktop and enhanced `FullScreenPlayer.tsx` for mobile with synchronized karaoke-style scrolling lyrics (`LyricsSheet.tsx`), queue inspection, and related radio tracks.
   - Built `PlaylistPage.tsx` (`/playlist/:id`) with Play All, Shuffle Play, edit, and delete.
   - Built `PlaylistModal.tsx` and wired `ListPlus` action button in `SongCard.tsx`.
   - Updated `Sidebar.tsx` and `BottomNav.tsx` to cleanly separate Home, Search, Library, and Settings.

### How to Test
1. **Home Discovery:**
   - Launch application (`npm run tauri dev`). Route `/` opens displaying Quick Picks, Trending Charts with thumbnails, and Mood pills.
   - Click any mood pill (e.g. "Chill") to navigate directly to `/search?q=Chill`.
2. **Now Playing & Lyrics:**
   - Play any song. Click on the album artwork or title in the Player Bar to expand the `NowPlayingModal`.
   - Switch to the "Lyrics" tab: timestamped lyrics highlight and scroll smoothly as song plays. Click any lyric line to jump directly to that timestamp.
3. **Auto-Queue & Playback Modes:**
   - Toggle Repeat button in Player Bar to cycle between Off, All, and One.
   - With Repeat set to One, seek near track end; track loops from 0:00 when finished.
   - Toggle Shuffle to randomize remaining queue.
   - Play a single track with an empty queue; observe Auto-Queue automatically fetching and queuing similar radio tracks when the song ends.
4. **Playlists:**
   - Open Library (`/library`) -> Playlists tab. Click "+ New Playlist" to create a playlist.
   - From any search result or shelf, click the playlist icon on a track to add it to your playlist.
   - Open `/playlist/:id` to verify tracks, total duration, Play All, and Shuffle Play.

### Known Issues / Notes for Sprint 7
- In Sprint 7, local user playlists will be merged with optional YouTube Music cloud playlist sync (Bitchord dual authentication model).


