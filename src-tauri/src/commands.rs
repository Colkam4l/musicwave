use crate::audio::{self, RepeatMode};
use crate::auth;
use crate::cache;
use crate::library::{self, UserPlaylist};
use crate::queue;
use crate::search::{
    self, HomeShelves, LyricsResponse, SongResult, search_songs as search_songs_impl,
};
use crate::settings::{self, Settings};
use crate::stream::{is_auth_error, is_cancelled_error};
use crate::sync;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn ping() -> Result<String, String> {
    Ok("pong".to_string())
}

#[tauri::command]
pub async fn search_songs(query: String) -> Result<Vec<SongResult>, String> {
    search_songs_impl(&query).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search(query: String) -> Result<Vec<SongResult>, String> {
    search_songs_impl(&query).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn play_song(
    video_id: String,
    song: Option<SongResult>,
    app_handle: AppHandle,
) -> Result<(), String> {
    match audio::play_track(video_id, song, app_handle.clone()).await {
        Ok(()) => Ok(()),
        Err(e) if is_cancelled_error(&e) => Ok(()),
        Err(e) => {
            if is_auth_error(&e) {
                let _ = app_handle.emit("player://auth-required", ());
            }
            Err(format!("Playback error: {e}"))
        }
    }
}

#[tauri::command]
pub async fn play(
    video_id: String,
    song: Option<SongResult>,
    app_handle: AppHandle,
) -> Result<(), String> {
    play_song(video_id, song, app_handle).await
}

#[tauri::command]
pub async fn pause_playback(app_handle: AppHandle) -> Result<(), String> {
    audio::pause_with_app(Some(&app_handle)).await;
    Ok(())
}

#[tauri::command]
pub async fn pause(app_handle: AppHandle) -> Result<(), String> {
    pause_playback(app_handle).await
}

#[tauri::command]
pub async fn resume_playback(app_handle: AppHandle) -> Result<(), String> {
    audio::resume_with_app(Some(&app_handle)).await;
    Ok(())
}

#[tauri::command]
pub async fn resume(app_handle: AppHandle) -> Result<(), String> {
    resume_playback(app_handle).await
}

#[tauri::command]
pub async fn stop_playback(app_handle: AppHandle) -> Result<(), String> {
    audio::stop_with_app(Some(&app_handle)).await;
    Ok(())
}

#[tauri::command]
pub async fn stop(app_handle: AppHandle) -> Result<(), String> {
    stop_playback(app_handle).await
}

#[tauri::command]
pub async fn seek_to(position_seconds: f64, app_handle: AppHandle) -> Result<(), String> {
    audio::seek(position_seconds, Some(app_handle))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_volume(volume: f64) -> Result<(), String> {
    let vol = if volume > 1.0 {
        (volume / 100.0) as f32
    } else {
        volume as f32
    };
    audio::set_volume(vol).await;
    Ok(())
}

#[tauri::command]
pub async fn enqueue_next(song: SongResult) -> Result<Vec<SongResult>, String> {
    queue::enqueue_next(song).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn enqueue_last(song: SongResult) -> Result<Vec<SongResult>, String> {
    queue::enqueue_last(song).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn dequeue_front() -> Result<Option<SongResult>, String> {
    Ok(queue::dequeue_front().await)
}

#[tauri::command]
pub async fn remove_from_queue(index: usize) -> Result<Vec<SongResult>, String> {
    Ok(queue::remove_at(index).await)
}

#[tauri::command]
pub async fn reorder_queue(from: usize, to: usize) -> Result<Vec<SongResult>, String> {
    Ok(queue::reorder(from, to).await)
}

#[tauri::command]
pub async fn clear_queue() -> Result<Vec<SongResult>, String> {
    Ok(queue::clear_queue().await)
}

#[tauri::command]
pub async fn get_queue() -> Result<Vec<SongResult>, String> {
    Ok(queue::get_queue().await)
}

#[tauri::command]
pub async fn like_song(song: SongResult, app_handle: AppHandle) -> Result<Vec<SongResult>, String> {
    library::like_song(&app_handle, song)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn unlike_song(
    video_id: String,
    app_handle: AppHandle,
) -> Result<Vec<SongResult>, String> {
    library::unlike_song(&app_handle, &video_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_liked_songs(app_handle: AppHandle) -> Result<Vec<SongResult>, String> {
    library::get_liked_songs(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_plays(app_handle: AppHandle) -> Result<Vec<SongResult>, String> {
    library::get_recent_plays(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_settings(app_handle: AppHandle) -> Result<Settings, String> {
    settings::load_settings(&app_handle).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_settings(settings: Settings, app_handle: AppHandle) -> Result<Settings, String> {
    settings::save_settings(&app_handle, settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_home_shelves() -> Result<HomeShelves, String> {
    search::get_home_shelves().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_watch_playlist(video_id: String) -> Result<Vec<SongResult>, String> {
    search::get_watch_playlist(&video_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_lyrics(
    video_id: String,
    title: Option<String>,
    artist: Option<String>,
    duration: Option<u32>,
) -> Result<LyricsResponse, String> {
    search::get_lyrics(&video_id, title.as_deref(), artist.as_deref(), duration)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn shuffle_queue() -> Result<Vec<SongResult>, String> {
    Ok(queue::shuffle_queue().await)
}

#[tauri::command]
pub async fn set_repeat_mode(mode: RepeatMode) -> Result<(), String> {
    audio::set_repeat_mode(mode).await;
    Ok(())
}

#[tauri::command]
pub async fn get_repeat_mode() -> Result<RepeatMode, String> {
    Ok(audio::get_repeat_mode().await)
}

#[tauri::command]
pub async fn set_auto_queue(enabled: bool) -> Result<(), String> {
    audio::set_auto_queue(enabled).await;
    Ok(())
}

#[tauri::command]
pub async fn get_auto_queue() -> Result<bool, String> {
    Ok(audio::get_auto_queue().await)
}

#[tauri::command]
pub async fn create_playlist(
    name: String,
    description: Option<String>,
    app_handle: AppHandle,
) -> Result<UserPlaylist, String> {
    library::create_playlist(&app_handle, name, description)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_playlist(
    playlist_id: String,
    app_handle: AppHandle,
) -> Result<Vec<UserPlaylist>, String> {
    library::delete_playlist(&app_handle, &playlist_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rename_playlist(
    playlist_id: String,
    name: String,
    description: Option<String>,
    app_handle: AppHandle,
) -> Result<UserPlaylist, String> {
    library::rename_playlist(&app_handle, &playlist_id, name, description)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_to_playlist(
    playlist_id: String,
    song: SongResult,
    app_handle: AppHandle,
) -> Result<UserPlaylist, String> {
    library::add_to_playlist(&app_handle, &playlist_id, song)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_from_playlist(
    playlist_id: String,
    video_id: String,
    app_handle: AppHandle,
) -> Result<UserPlaylist, String> {
    library::remove_from_playlist(&app_handle, &playlist_id, &video_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reorder_playlist(
    playlist_id: String,
    from_index: usize,
    to_index: usize,
    app_handle: AppHandle,
) -> Result<UserPlaylist, String> {
    library::reorder_playlist(&app_handle, &playlist_id, from_index, to_index)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_playlists(app_handle: AppHandle) -> Result<Vec<UserPlaylist>, String> {
    library::get_playlists(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_playlist(
    playlist_id: String,
    app_handle: AppHandle,
) -> Result<Option<UserPlaylist>, String> {
    library::get_playlist(&app_handle, &playlist_id)
        .await
        .map_err(|e| e.to_string())
}

// Auth / Profile commands
#[tauri::command]
pub async fn get_active_profile(app_handle: AppHandle) -> Result<auth::UserProfile, String> {
    auth::get_active_profile(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_profile(
    display_name: String,
    avatar_url: Option<String>,
    app_handle: AppHandle,
) -> Result<auth::UserProfile, String> {
    auth::create_profile(&app_handle, display_name, avatar_url)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn switch_profile(
    profile_id: String,
    app_handle: AppHandle,
) -> Result<auth::UserProfile, String> {
    auth::switch_profile(&app_handle, &profile_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_profile(
    profile_id: String,
    app_handle: AppHandle,
) -> Result<auth::UserProfile, String> {
    auth::delete_profile(&app_handle, &profile_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_profiles(app_handle: AppHandle) -> Result<Vec<auth::UserProfile>, String> {
    auth::list_profiles(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

// Sync commands
#[tauri::command]
pub async fn link_youtube_account(
    cookie: String,
    app_handle: AppHandle,
) -> Result<auth::UserProfile, String> {
    sync::link_youtube_cookie(&app_handle, cookie)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn disconnect_youtube_account(
    app_handle: AppHandle,
) -> Result<auth::UserProfile, String> {
    sync::disconnect_youtube_account(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_sync_status(app_handle: AppHandle) -> Result<sync::SyncStatus, String> {
    Ok(sync::get_sync_status(&app_handle).await)
}

#[tauri::command]
pub async fn sync_library(app_handle: AppHandle) -> Result<sync::SyncSummary, String> {
    sync::sync_library(&app_handle)
        .await
        .map_err(|e| e.to_string())
}

// Cache / Offline commands
#[tauri::command]
pub async fn get_cache_stats(app_handle: AppHandle) -> Result<cache::CacheStats, String> {
    cache::get_cache_stats(&app_handle).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_cache(app_handle: AppHandle) -> Result<(), String> {
    cache::clear_cache(&app_handle).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download_track_for_offline(
    video_id: String,
    app_handle: AppHandle,
) -> Result<String, String> {
    let path = cache::download_track_for_offline(&app_handle, &video_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn is_track_cached(video_id: String, app_handle: AppHandle) -> Result<bool, String> {
    Ok(cache::is_track_cached(&app_handle, &video_id))
}

#[tauri::command]
pub async fn get_search_suggestions(query: String) -> Result<Vec<String>, String> {
    search::get_search_suggestions(&query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skip_to_queue_index(
    index: usize,
    app_handle: AppHandle,
) -> Result<Option<SongResult>, String> {
    if let Some(song) = queue::skip_to_index(index).await {
        let _ = app_handle.emit("player://track-changed", &song);
        let updated_queue = queue::get_queue().await;
        let _ = app_handle.emit("queue://updated", &updated_queue);

        let handle_clone = app_handle.clone();
        let song_clone = song.clone();
        tokio::spawn(async move {
            let _ = audio::play_track(song_clone.video_id.clone(), Some(song_clone), handle_clone).await;
        });

        Ok(Some(song))
    } else {
        Ok(None)
    }
}
