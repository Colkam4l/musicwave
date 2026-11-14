use crate::auth::{self, AuthType, LinkedYtAccount, UserProfile};
use crate::library::UserPlaylist;
use crate::search::SongResult;
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use std::time::SystemTime;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use ytmapi_rs::auth::browser::BrowserToken;
use ytmapi_rs::common::YoutubeID;
use ytmapi_rs::parse::PlaylistItem;
use ytmapi_rs::query::library::{GetLibraryPlaylistsQuery, GetLibrarySongsQuery};
use ytmapi_rs::query::playlist::GetPlaylistTracksQuery;
use ytmapi_rs::{Client as YtClient, YtMusic, YtMusicBuilder};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncSummary {
    pub liked_songs_synced: usize,
    pub playlists_synced: usize,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatus {
    pub is_linked: bool,
    pub is_syncing: bool,
    pub last_synced: Option<u64>,
    pub total_synced_tracks: usize,
    pub total_synced_playlists: usize,
    pub error: Option<String>,
}

static SYNC_STATE: LazyLock<Mutex<SyncStatus>> =
    LazyLock::new(|| Mutex::new(SyncStatus::default()));

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn parse_duration_to_seconds(duration: &str) -> Option<u32> {
    let parts: Vec<&str> = duration.trim().split(':').collect();
    match parts.len() {
        1 => parts[0].parse::<u32>().ok(),
        2 => {
            let mins = parts[0].parse::<u32>().ok()?;
            let secs = parts[1].parse::<u32>().ok()?;
            Some(mins * 60 + secs)
        }
        3 => {
            let hours = parts[0].parse::<u32>().ok()?;
            let mins = parts[1].parse::<u32>().ok()?;
            let secs = parts[2].parse::<u32>().ok()?;
            Some(hours * 3600 + mins * 60 + secs)
        }
        _ => None,
    }
}

async fn build_authenticated_client(cookie: &str) -> anyhow::Result<YtMusic<BrowserToken>> {
    let reqwest_client = reqwest::Client::builder().http1_only().build()?;
    let yt_client = YtClient::new_from_reqwest_client(reqwest_client);
    let token = BrowserToken::from_str(cookie, &yt_client).await?;
    let yt = YtMusicBuilder::new_with_client(yt_client)
        .with_auth_token(token)
        .build()?;
    Ok(yt)
}

pub async fn link_youtube_cookie(
    app_handle: &AppHandle,
    cookie: String,
) -> anyhow::Result<UserProfile> {
    let trimmed = cookie.trim();
    if trimmed.is_empty() {
        anyhow::bail!("Cookie cannot be empty");
    }

    let yt = build_authenticated_client(trimmed).await.map_err(|e| {
        anyhow::anyhow!("Failed to authenticate with provided YouTube Music cookie: {e}")
    })?;

    // Verify token by querying library playlists
    let playlists_res = yt.query(GetLibraryPlaylistsQuery).await;
    if let Err(err) = playlists_res {
        eprintln!("[musicwave sync] Cookie verification warning: {err}");
    }

    // Save cookie into app settings
    let mut current_settings = crate::settings::load_settings(app_handle).unwrap_or_default();
    current_settings.cookie = Some(trimmed.to_string());
    crate::settings::save_settings(app_handle, current_settings)?;

    let linked = LinkedYtAccount {
        account_name: "YouTube Music Account".to_string(),
        channel_handle: None,
        avatar_url: None,
        auth_type: AuthType::Cookie,
        synced_at: None,
    };

    let updated_profile = auth::update_active_linked_account(app_handle, Some(linked)).await?;

    let mut state = SYNC_STATE.lock().await;
    state.is_linked = true;
    state.error = None;

    let _ = app_handle.emit("auth://profile-updated", &updated_profile);
    Ok(updated_profile)
}

pub async fn disconnect_youtube_account(app_handle: &AppHandle) -> anyhow::Result<UserProfile> {
    // Clear cookie from settings
    let mut current_settings = crate::settings::load_settings(app_handle).unwrap_or_default();
    current_settings.cookie = None;
    crate::settings::save_settings(app_handle, current_settings)?;

    let updated_profile = auth::update_active_linked_account(app_handle, None).await?;

    let mut state = SYNC_STATE.lock().await;
    state.is_linked = false;
    state.error = None;
    state.last_synced = None;

    let _ = app_handle.emit("auth://profile-updated", &updated_profile);
    Ok(updated_profile)
}

pub async fn get_sync_status(app_handle: &AppHandle) -> SyncStatus {
    let mut state = SYNC_STATE.lock().await;
    if let Ok(profile) = auth::get_active_profile(app_handle).await {
        state.is_linked = profile.linked_account.is_some();
        if let Some(ref acc) = profile.linked_account {
            state.last_synced = acc.synced_at;
        }
    }
    state.clone()
}

pub async fn sync_library(app_handle: &AppHandle) -> anyhow::Result<SyncSummary> {
    let active_profile = auth::get_active_profile(app_handle).await?;
    let linked = active_profile.linked_account.ok_or_else(|| {
        anyhow::anyhow!(
            "No linked YouTube Music account. Please link your account in Settings first."
        )
    })?;

    {
        let mut state = SYNC_STATE.lock().await;
        state.is_syncing = true;
        state.error = None;
    }
    let _ = app_handle.emit("sync://status-changed", ());

    let (cookie, _, _) = crate::settings::active_auth_tuple(Some(app_handle));
    let Some(cookie_str) = cookie else {
        let mut state = SYNC_STATE.lock().await;
        state.is_syncing = false;
        state.error = Some("No authentication cookie configured".to_string());
        anyhow::bail!("No authentication cookie found");
    };

    let yt = match build_authenticated_client(&cookie_str).await {
        Ok(client) => client,
        Err(err) => {
            let mut state = SYNC_STATE.lock().await;
            state.is_syncing = false;
            state.error = Some(err.to_string());
            return Err(err);
        }
    };

    // 1. Fetch liked songs
    eprintln!("[musicwave sync] Fetching library songs...");
    let mut cloud_songs = Vec::new();
    match yt.query(GetLibrarySongsQuery::default()).await {
        Ok(songs) => {
            for s in songs {
                let vid = s.video_id.get_raw().to_string();
                let artist = s
                    .artists
                    .iter()
                    .map(|a| a.name.clone())
                    .collect::<Vec<_>>()
                    .join(", ");
                let thumb = s.thumbnails.last().map(|t| t.url.clone());
                let duration_sec = parse_duration_to_seconds(&s.duration);
                cloud_songs.push(SongResult {
                    video_id: vid,
                    title: s.title,
                    artist,
                    album: Some(s.album.name),
                    duration: Some(s.duration),
                    duration_seconds: duration_sec,
                    thumbnail_url: thumb,
                });
            }
        }
        Err(err) => {
            eprintln!("[musicwave sync] Could not fetch liked songs: {err}");
        }
    }

    // 2. Fetch playlists
    eprintln!("[musicwave sync] Fetching library playlists...");
    let mut cloud_playlists = Vec::new();
    match yt.query(GetLibraryPlaylistsQuery).await {
        Ok(playlists) => {
            for p in playlists {
                let pl_id = format!("yt_{}", p.playlist_id.get_raw());
                let mut tracks = Vec::new();

                // Fetch tracks for the playlist
                if let Ok(items) = yt
                    .query(GetPlaylistTracksQuery::new(p.playlist_id.clone()))
                    .await
                {
                    for item in items {
                        match item {
                            PlaylistItem::Song(s) => {
                                let vid = s.video_id.get_raw().to_string();
                                let artist = s
                                    .artists
                                    .iter()
                                    .map(|a| a.name.clone())
                                    .collect::<Vec<_>>()
                                    .join(", ");
                                let thumb = s.thumbnails.last().map(|t| t.url.clone());
                                let duration_sec = parse_duration_to_seconds(&s.duration);
                                tracks.push(SongResult {
                                    video_id: vid,
                                    title: s.title,
                                    artist,
                                    album: Some(s.album.name),
                                    duration: Some(s.duration),
                                    duration_seconds: duration_sec,
                                    thumbnail_url: thumb,
                                });
                            }
                            PlaylistItem::Video(v) => {
                                let vid = v.video_id.get_raw().to_string();
                                let thumb = v.thumbnails.last().map(|t| t.url.clone());
                                let duration_sec = parse_duration_to_seconds(&v.duration);
                                tracks.push(SongResult {
                                    video_id: vid,
                                    title: v.title,
                                    artist: v.channel_name,
                                    album: None,
                                    duration: Some(v.duration),
                                    duration_seconds: duration_sec,
                                    thumbnail_url: thumb,
                                });
                            }
                            _ => {}
                        }
                    }
                }

                let now = current_timestamp();
                cloud_playlists.push(UserPlaylist {
                    id: pl_id,
                    name: p.title,
                    description: Some(format!("Synced from YouTube Music ({})", p.author)),
                    created_at: now,
                    updated_at: now,
                    tracks,
                    is_cloud: Some(true),
                });
            }
        }
        Err(err) => {
            eprintln!("[musicwave sync] Could not fetch library playlists: {err}");
        }
    }

    let (added_songs, synced_pl_count) =
        crate::library::merge_synced_library(app_handle, cloud_songs, cloud_playlists).await?;

    let now = current_timestamp();
    let updated_account = LinkedYtAccount {
        synced_at: Some(now),
        ..linked
    };
    let _ = auth::update_active_linked_account(app_handle, Some(updated_account)).await;

    let summary = SyncSummary {
        liked_songs_synced: added_songs,
        playlists_synced: synced_pl_count,
        timestamp: now,
    };

    {
        let mut state = SYNC_STATE.lock().await;
        state.is_syncing = false;
        state.last_synced = Some(now);
        state.total_synced_tracks = added_songs;
        state.total_synced_playlists = synced_pl_count;
        state.error = None;
    }

    let _ = app_handle.emit("sync://status-changed", ());
    let _ = app_handle.emit("library://updated", ());

    Ok(summary)
}
