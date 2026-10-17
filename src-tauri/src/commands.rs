use crate::audio;
use crate::search::{SongResult, search_songs as search_songs_impl};
use crate::stream::{load_auth_config, resolve_stream_url};
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
pub async fn play_song(video_id: String, app_handle: AppHandle) -> Result<(), String> {
    let (cookie, _user_agent, po_token) = load_auth_config();

    // If neither cookie nor po_token is available, warn user
    if cookie.is_none() && po_token.is_none() {
        let _ = app_handle.emit("player://auth-required", ());
    }

    let (stream_url, total_seconds, client) = resolve_stream_url(&video_id, cookie, po_token)
        .await
        .map_err(|e| {
            let _ = app_handle.emit("player://auth-required", ());
            format!("Failed to resolve stream: {e}")
        })?;

    audio::play(stream_url, total_seconds, client, app_handle)
        .await
        .map_err(|e| format!("Playback error: {e}"))?;

    Ok(())
}

#[tauri::command]
pub async fn play(video_id: String, app_handle: AppHandle) -> Result<(), String> {
    play_song(video_id, app_handle).await
}

#[tauri::command]
pub async fn pause_playback() -> Result<(), String> {
    audio::pause().await;
    Ok(())
}

#[tauri::command]
pub async fn pause() -> Result<(), String> {
    pause_playback().await
}

#[tauri::command]
pub async fn resume_playback() -> Result<(), String> {
    audio::resume().await;
    Ok(())
}

#[tauri::command]
pub async fn resume() -> Result<(), String> {
    resume_playback().await
}

#[tauri::command]
pub async fn stop_playback() -> Result<(), String> {
    audio::stop().await;
    Ok(())
}

#[tauri::command]
pub async fn stop() -> Result<(), String> {
    stop_playback().await
}

#[tauri::command]
pub async fn seek_to(position_seconds: f64) -> Result<(), String> {
    audio::seek(position_seconds).await;
    Ok(())
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
