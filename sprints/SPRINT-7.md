# Sprint 7 — Dual Authentication & Account Sync (Bitchord Model)

| Field | Value |
|---|---|
| **Branch** | `feature/sprint-7-auth-sync` |
| **Depends On** | Sprint 6 complete and merged to `main` |
| **Status** | ⏳ Planned |
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
- [ ] **T7-1:** Create `src-tauri/src/auth.rs`. Define `UserProfile` (`id`, `display_name`, `avatar_url`, `created_at`, `linked_account: Option<LinkedYtAccount>`).
- [ ] **T7-2:** Implement atomic persistence for profiles in `profiles.json` inside the app data directory.
- [ ] **T7-3:** Expose profile management commands in `commands.rs`: `get_active_profile`, `create_profile`, `switch_profile`, `delete_profile`.

#### 2. YouTube Music Account Synchronization (Bitchord Approach)
- [ ] **T7-4:** Implement YouTube Music OAuth / Webview auth helper in `src-tauri/src/auth.rs` to exchange authorization codes for access and refresh tokens.
- [ ] **T7-5:** Create `src-tauri/src/sync.rs`. Implement two-way library synchronization:
  - Pull cloud liked songs (`GetLibrarySongsQuery`) and merge with local favorites.
  - Pull cloud playlists (`GetLibraryPlaylistsQuery`) and store with `is_cloud: true` flag.
  - Push local playlist creations to YouTube Music if cloud sync is toggled on.
- [ ] **T7-6:** Expose sync commands in `commands.rs`: `sync_library`, `disconnect_youtube_account`, `get_sync_status`.

#### 3. Offline Stream Disk Caching
- [ ] **T7-7:** Create `src-tauri/src/cache.rs` managing `~/.local/share/musicwave/cache/tracks/`:
  - `save_track_cache(video_id: &str, data: &[u8]) -> Result<()>`
  - `get_cached_track_path(video_id: &str) -> Option<PathBuf>`
  - `purge_cache(max_size_bytes: u64) -> Result<()>`
- [ ] **T7-8:** In `src-tauri/src/stream.rs`, before querying `rusty_ytdl` for remote URLs, check if the track exists in local cache; if present, stream directly from disk for instant playback without network access.
- [ ] **T7-9:** Expose cache commands in `commands.rs`: `get_cache_size`, `clear_cache`, `download_track_for_offline`.

#### 4. Frontend Profile & Sync UI
- [ ] **T7-10:** Build `AuthModal.tsx`:
  - Choice 1: "Continue as Local User" (enter display name, pick avatar icon).
  - Choice 2: "Connect YouTube Music" (OAuth sign-in or manual cookie import).
- [ ] **T7-11:** Build `ProfileMenu.tsx` in `Sidebar.tsx` and mobile `BottomNav.tsx`:
  - Displays user avatar and name.
  - Displays sync status ("Synced 5m ago" or "Offline / Local Mode").
  - Dropdown: "Switch Profile", "Sync Now", "Account Settings".
- [ ] **T7-12:** Update `LibraryPage.tsx` with filter pills: `All`, `Local`, `Cloud Synced`, and `Downloaded (Offline)`.
- [ ] **T7-13:** Update `SettingsPage.tsx` with a dedicated **Storage & Cache** section displaying cache size, clear cache button, and offline quality toggle.

---

## 3. Implementation Notes

### Zero Paywall / Open Ecosystem
Following Bitchord, no features are locked behind payment. Local users have access to all features (playlists, audio playback, auto-queue, history, lyrics). Connecting a YouTube account is purely an optional enhancement for importing existing cloud playlists.

### Offline Resilience
When the application detects no internet connectivity (`navigator.onLine === false` or network timeout):
- Automatically switches to offline mode.
- Filters Library to show only cached/downloaded songs.
- Plays directly from local disk cache without hitting the YouTube media servers.

---

## 4. Definition of Done

- [ ] Users can use the app without any Google / YouTube account using a local profile
- [ ] Users can connect a YouTube Music account and sync their cloud library (liked songs & playlists)
- [ ] Synced cloud playlists display alongside local playlists with clear source badges
- [ ] Previously played or downloaded tracks cache to disk and play seamlessly when offline
- [ ] Cache settings allow viewing disk usage and clearing cached audio files
- [ ] `cargo clippy -- -D warnings` passes with 0 warnings
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] End-of-Sprint Report section below is filled in

---

## 5. End-of-Sprint Report

> ⚠️ **This section is filled in by the implementing agent after completion.**

### Date Completed
_TBD_

### What Was Built
_Describe each file created and its role._

### How to Test
_Instructions to test Local Profiles, YouTube Sync, and Offline Playback._
