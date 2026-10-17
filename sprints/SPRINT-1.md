# Sprint 1 — Core Search UI

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-1-search-ui` |
| **Depends On** | Sprint 0 complete and merged to `main` |
| **Status** | ⏳ Not Started |
| **Scope** | ~2 focused sessions |

> **Related docs:** [CLAUDE.md](../CLAUDE.md) · [decisions.md](../decisions.md) · [SETUP.md](../SETUP.md) · [Sprint Index](./README.md)

---

## 1. Context

Sprint 0 produced a Tauri window with a blank React app and a working IPC bridge. This sprint builds the first real user-facing screen: a **search page** where the user types a query, presses Enter, and sees a list of matching songs returned from the YouTube Music API.

This is the single most critical user flow in the app — everything downstream (playback, queue, library) depends on getting a search result object on screen.

---

## 2. Deliverables

### 2.1 Files to Create / Modify

```
src/
├── index.css                      # MODIFY — add full design system (tokens, fonts, reset)
├── App.tsx                        # MODIFY — add React Router, route to SearchPage
├── pages/
│   └── SearchPage.tsx             # CREATE — main search screen
├── components/
│   ├── SearchBar.tsx              # CREATE — input with search icon
│   ├── SongCard.tsx               # CREATE — individual result row
│   ├── SongList.tsx               # CREATE — list wrapper with loading/empty states
│   └── Spinner.tsx                # CREATE — loading indicator
├── hooks/
│   └── useSearch.ts               # CREATE — search logic + Zustand state wiring
├── store/
│   └── searchStore.ts             # CREATE — Zustand store for search query + results
└── types/
    └── music.ts                   # CREATE — TypeScript types: Song, SearchResult, etc.

src-tauri/src/
├── commands.rs                    # MODIFY — add search_songs Tauri command
├── search.rs                      # MODIFY — ensure search_songs returns serializable structs
```

### 2.2 Tasks

- [ ] **T1-1:** Define TypeScript types in `src/types/music.ts`

  ```ts
  export interface Song {
    videoId: string;
    title: string;
    artist: string;
    album: string | null;
    durationSeconds: number | null;
    thumbnailUrl: string | null;
  }
  ```

- [ ] **T1-2:** In `src-tauri/src/search.rs`, ensure `search_songs` returns a `Vec<SongResult>` where `SongResult` derives `serde::Serialize` and maps to the `Song` TypeScript type above.

- [ ] **T1-3:** Register `search_songs` in `src-tauri/src/commands.rs` as a `#[tauri::command]`:

  ```rust
  #[tauri::command]
  pub async fn search_songs(query: String) -> Result<Vec<SongResult>, String> { ... }
  ```

- [ ] **T1-4:** Create Zustand store `searchStore.ts` with state: `query`, `results: Song[]`, `isLoading`, `error`.

- [ ] **T1-5:** Create `useSearch.ts` hook — calls `invoke<Song[]>('search_songs', { query })` and writes to the store.

- [ ] **T1-6:** Build `SearchBar.tsx` — a styled text input with a search icon button. Fires search on Enter keypress and button click.

- [ ] **T1-7:** Build `SongCard.tsx` — displays thumbnail, title, artist, album, duration. Entire row is clickable (will wire up to playback in Sprint 2).

- [ ] **T1-8:** Build `SongList.tsx` — renders the list of `SongCard`, or a loading `Spinner`, or an empty-state message.

- [ ] **T1-9:** Assemble `SearchPage.tsx` — combines `SearchBar` + `SongList`.

- [ ] **T1-10:** Add React Router to `App.tsx` and route `/` → `SearchPage`.

- [ ] **T1-11:** Design System in `index.css`:
  - Import `Inter` from Google Fonts
  - Define CSS variables for: `--bg-primary`, `--bg-surface`, `--text-primary`, `--text-muted`, `--accent`, `--accent-hover`, `--radius-md`, `--spacing-*`
  - Dark theme by default (no light mode toggle in this sprint)

---

## 3. Implementation Notes

### Design Constraints
- **Dark mode only** — background `#0d0d0d`, surface `#1a1a1a`, accent `#c2185b` (deep rose/music-adjacent)
- **Font:** Inter (Google Fonts), 14px base size
- **Search bar:** Full width with rounded corners, subtle glow on focus
- **Song cards:** Hover state with slight background lift; thumbnail is a 48×48 rounded square
- **No modals or side drawers** in this sprint — keep it to one column layout

### Tauri IPC Pattern
Always use the typed `invoke` wrapper from `@tauri-apps/api/core`:

```ts
import { invoke } from '@tauri-apps/api/core';
const results = await invoke<Song[]>('search_songs', { query });
```

### Error Handling
- If the Tauri command returns an `Err(String)`, display a dismissible inline error banner (not an alert dialog)
- If `thumbnailUrl` is null, use a generic music note placeholder SVG icon

### Auth Awareness
The search itself (querying song metadata) does **not** require cookies or a PO token — `ytmapi-rs` works unauthenticated for searches. Only audio stream resolution (Sprint 2) requires auth. Do not gate the search page behind auth.

### Code Style (from CLAUDE.md)
- Rust: `anyhow` errors, conventional commits (`feat: add search_songs tauri command`)
- React: functional components only, no class components
- CSS: use CSS variables exclusively — no hardcoded colour hex values in component files

---

## 4. Definition of Done

- [ ] Typing a query and pressing Enter shows a list of song results
- [ ] Each result shows: thumbnail, title, artist, and duration
- [ ] A loading spinner appears while the search is in progress
- [ ] An empty-state message appears for a query that returns no results (e.g. nonsense string)
- [ ] An error message appears if the Tauri backend returns an error (can be tested by killing internet)
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
_Describe each file created and what it does._

### How to Test

```bash
# Start the dev app
npm run tauri dev

# In the app:
# 1. Type "Coldplay Yellow" in the search bar and press Enter
# 2. Verify results appear with thumbnails, title, and artist
# 3. Disconnect from the internet and search again — verify error banner appears
# 4. Search for "xxxxxxxxxgarbage" — verify empty state message
```

### Known Issues / Notes for Sprint 2
_Any caveats or tech debt._
