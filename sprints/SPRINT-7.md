# Sprint 7 — Dual Authentication & Account Sync (Bitchord Model)

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-7-auth-sync` |
| **Depends On** | Sprint 6 complete and merged to `main` |
| **Status** | ✅ Completed |
| **Scope** | ~3 focused sessions |

> **Related docs:** [CLAUDE.md](../CLAUDE.md) · [decisions.md](../decisions.md) · [SETUP.md](../SETUP.md) · [Sprint Index](./README.md) · [Feature Gap Report](../.gemini/antigravity/brain/116d04ef-f500-4d5c-b6da-47162cfcbb50/musicwave-feature-gap-and-roadmap-report.md)

---

## 1. Context

In early sprints, authentication relied exclusively on manually copying and pasting raw `Cookie` or `po_token` values from browser developer tools. This created friction for everyday users and forced everyone to have a Google / YouTube Music account just to unlock authenticated playback.

Following the architecture of **Bitchord** and modern client designs, Sprint 7 introduces a **Dual-Account & Sync System**:

1. **Standalone Local Profile (No Google Account Required):**
   - Users can create a local profile (display name, avatar, local preferences) without needing an account.
   - All liked songs, custom playlists, listening history, and recommendation preferences are stored locally in the application data directory.
2. **Linked YouTube Music Account (Optional Cloud Sync):**
   - Users with a YouTube Music account can sign in via an embedded OAuth webview or one-click browser sync.
   - Two-way sync: imports user's YouTube Music Liked Songs, artist subscriptions, and cloud playlists into MusicWave while preserving local playlists.
   - Unlocks premium/lossless bitrates and avoids `HTTP 403 Forbidden` playback errors without manual token pasting.
3. **Encrypted / Decrypted Stream Disk Caching (Offline Playback):**
   - Saves downloaded stream chunks to a dedicated disk cache directory (`~/.local/share/musicwave/cache/tracks/<videoId>.mp4`).
   - Allows users to play previously heard or marked "Downloaded" tracks when completely offline.

---

## 2. Deliverables

### 2.1 Files to Create / Modify

```
src-tauri/src/
├── auth.rs              # CREATE — local user profile management + OAuth token refresh
├── sync.rs              # CREATE — YouTube Music cloud library two-way synchronization
├── cache.rs             # CREATE — local stream disk caching and offline storage management
├── library.rs           # MODIFY — merge local playlists with synced cloud playlists
├── stream.rs            # MODIFY — check local track cache before querying YouTube stream URLs
└── commands.rs          # MODIFY — expose profile, sync, and offline cache commands

src/
├── components/
│   ├── AuthModal.tsx    # CREATE — login options: Local Profile vs YouTube Music Sync
│   ├── ProfileMenu.tsx  # CREATE — top-bar / sidebar avatar with sync status and account switcher
│   └── OfflineBadge.tsx # CREATE — visual indicators for cached/downloaded tracks
├── pages/
│   ├── SettingsPage.tsx # MODIFY — account management, sync frequency, and cache storage size/purge
│   └── LibraryPage.tsx  # MODIFY — tabs for "All", "Local Only", and "Synced from YouTube"
├── store/
│   ├── authStore.ts     # CREATE — active profile, sync state, and cloud connection status
│   └── cacheStore.ts    # CREATE — cached song IDs and offline status
└── hooks/
    ├── useAuth.ts       # CREATE — profile login, logout, and token handling
    └── useSync.ts       # CREATE — trigger and monitor cloud synchronization
```

---

### 2.2 Tasks

#### 1. Local Profile Backend
- [x] **T7-1:** Create `src-tauri/src/auth.rs`. Define `UserProfile` (`id`, `display_name`, `avatar_url`, `created_at`, `linked_account: Option<LinkedYtAccount>`).
- [x] **T7-2:** Implement atomic persistence for profiles in `profiles.json` inside the app data directory.
- [x] **T7-3:** Expose profile management commands in `commands.rs`: `get_active_profile`, `create_profile`, `switch_profile`, `delete_profile`, `list_profiles`.

#### 2. YouTube Music Account Synchronization (Bitchord Approach)
- [x] **T7-4:** Implement YouTube Music auth helper in `src-tauri/src/sync.rs` leveraging `ytmapi_rs::auth::browser::BrowserToken` for authenticated requests.
- [x] **T7-5:** Create `src-tauri/src/sync.rs`. Implement two-way library synchronization:
  - Pull cloud liked songs (`GetLibrarySongsQuery`) and merge with local favorites.
  - Pull cloud playlists (`GetLibraryPlaylistsQuery` & `GetPlaylistTracksQuery`) and store with `is_cloud: true` flag.
  - Merge into local library atomically while retaining offline/local playlists.
- [x] **T7-6:** Expose sync commands in `commands.rs`: `sync_library`, `disconnect_youtube_account`, `get_sync_status`, `link_youtube_account`.

#### 3. Offline Stream Disk Caching
- [x] **T7-7:** Create `src-tauri/src/cache.rs` managing `~/.local/share/musicwave/cache/tracks/`:
  - `save_track_cache(video_id: &str, data: &[u8]) -> Result<PathBuf>`
  - `get_cached_track_path(video_id: &str) -> Option<PathBuf>`
  - `clear_cache() -> Result<()>`
  - `get_cache_stats() -> Result<CacheStats>`
- [x] **T7-8:** In `src-tauri/src/audio.rs`, before querying `rusty_ytdl` for remote URLs, check if the track exists in local cache; if present, stream directly from disk via `play_cached_file` for instant playback without network access.
- [x] **T7-9:** Expose cache commands in `commands.rs`: `get_cache_stats`, `clear_cache`, `download_track_for_offline`, `is_track_cached`.

#### 4. Frontend Profile & Sync UI
- [x] **T7-10:** Build `AuthModal.tsx`:
  - Choice 1: "Continue as Local User" (enter display name, pick avatar color style).
  - Choice 2: "Connect YouTube Music" (cookie session import & verification).
- [x] **T7-11:** Build `ProfileMenu.tsx` in `Sidebar.tsx`:
  - Displays user avatar and name.
  - Displays sync/offline status ("Synced with YouTube", "Offline Mode", or "Local Profile Only").
  - Dropdown: "Switch Profile", "Sync Now", "Create / Link Account", "Settings & Cache".
- [x] **T7-12:** Update `LibraryPage.tsx` with filter tabs: `Playlists` (with `All`, `Local`, `Cloud` pills), `Liked Songs`, `Recently Played`, and `Downloaded (Offline)`.
- [x] **T7-13:** Update `SettingsPage.tsx` with dedicated **Account & Profile** and **Offline Audio Cache** sections displaying cache size, clear cache button, and cloud connection controls.

---

## 3. Implementation Notes

### Zero Paywall / Open Ecosystem
Following Bitchord, no features are locked behind payment. Local users have access to all features (playlists, audio playback, auto-queue, history, lyrics, offline downloads). Connecting a YouTube account is purely an optional enhancement for importing existing cloud playlists.

### Offline Resilience
When the application detects no internet connectivity (`navigator.onLine === false` or network timeout):
- Automatically switches to offline mode indicator in `ProfileMenu.tsx`.
- Filters Library to show cached/downloaded songs under the "Downloaded (Offline)" tab.
- Plays directly from local disk cache (`~/.local/share/musicwave/cache/tracks/<videoId>.mp4`) without hitting YouTube media servers.

---

## 4. Definition of Done

- [x] Users can use the app without any Google / YouTube account using a local profile
- [x] Users can connect a YouTube Music account and sync their cloud library (liked songs & playlists)
- [x] Synced cloud playlists display alongside local playlists with clear source badges
- [x] Previously played or downloaded tracks cache to disk and play seamlessly when offline
- [x] Cache settings allow viewing disk usage and clearing cached audio files
- [x] `cargo clippy -- -D warnings` passes with 0 warnings
- [x] `npm run build` passes with zero TypeScript errors
- [x] End-of-Sprint Report section below is filled in

---

## 5. End-of-Sprint Report

### Date Completed
2026-11-14

### What Was Built
1. **Rust Backend:**
   - `src-tauri/src/auth.rs`: Atomic user profile management (`UserProfile`, `LinkedYtAccount`, `ProfilesState`, `profiles.json`). Supports guest profiles out-of-the-box, profile creation, switching, deletion, and account linking.
   - `src-tauri/src/cache.rs`: Disk caching for offline tracks in `app_data_dir/cache/tracks/<videoId>.mp4`. Handles `download_track_for_offline`, cache size calculation, cache clearance, and video ID sanitization.
   - `src-tauri/src/sync.rs`: Two-way cloud library synchronization via `ytmapi-rs` `BrowserToken`. Queries `GetLibrarySongsQuery` and `GetLibraryPlaylistsQuery`, imports cloud tracks and playlists, and persists `synced_at`.
   - `src-tauri/src/library.rs`: Extended `UserPlaylist` with `is_cloud: Option<bool>` and added atomic `merge_synced_library`.
   - `src-tauri/src/audio.rs`: Added `play_cached_file` to play directly from local disk via `rodio::Decoder::new_mp4(file)` without network roundtrips when a track is cached.
   - `src-tauri/src/commands.rs` & `src-tauri/src/lib.rs`: Registered all 13 new IPC commands for auth, sync, and offline cache.

2. **Frontend UI & State:**
   - `src/types/auth.ts` & `src/types/cache.ts`: Type definitions for profiles, sync status, and cache statistics.
   - `src/store/authStore.ts` & `src/store/cacheStore.ts`: Zustand stores for active profile, sync state, and disk cache.
   - `src/hooks/useAuth.ts`, `src/hooks/useSync.ts`, `src/hooks/useCache.ts`: Reactive hooks for profile switching, sync events, offline downloads, and network online/offline state.
   - `src/components/AuthModal.tsx`: Two-in-one modal for local guest profile creation or YouTube Music cookie connection.
   - `src/components/ProfileMenu.tsx`: Interactive profile pill in sidebar with online/offline indicators, sync trigger, and profile switcher dropdown.
   - `src/components/OfflineBadge.tsx` & `src/components/SongCard.tsx`: Offline download button with stateful icons (`Download`, `Loader2` spinner, `CheckCircle2` offline indicator).
   - `src/pages/LibraryPage.tsx`: Tabs for Playlists (`All`, `Local`, `Cloud`), Liked Songs, Recently Played, and Downloaded (Offline).
   - `src/pages/SettingsPage.tsx`: Integrated Account & Profile section and Offline Audio Cache section with disk usage stats and cache purge button.

### How to Test
1. **Local Profile:** Open Profile menu in sidebar -> Click "Switch / Add Profile" -> Create a new profile with a custom display name and avatar color style -> Observe immediate profile switch.
2. **Offline Download & Playback:** Click the download icon on any song -> Wait for the checkmark badge -> Disconnect internet or play the song -> Observe instant playback directly from disk.
3. **YouTube Music Sync:** Open Settings -> Click "Link Account" -> Enter YouTube Music cookie -> Click Connect & Sync -> Watch cloud playlists appear in Library with green "Synced" badges alongside local playlists.
4. **Storage Management:** Go to Settings -> Scroll to "Offline Audio Cache" -> Review total MB and track count -> Click "Clear Cache" -> Observe cache reset to 0 MB.

