use crate::audio;
use crate::search::{SongResult, search_songs as search_songs_impl};
use crate::stream::{is_auth_error, is_cancelled_error, resolve_audio_stream};
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
    let (session_gen, cancel) = audio::begin_playback_session().await;

    let resolved = match resolve_audio_stream(&video_id, &cancel).await {
        Ok(stream) => stream,
        Err(e) if is_cancelled_error(&e) => return Ok(()),
        Err(e) => {
            if is_auth_error(&e) {
                let _ = app_handle.emit("player://auth-required", ());
            }
            return Err(format!("Failed to resolve song stream: {e}"));
        }
    };

    match audio::play_stream(resolved, session_gen, cancel, app_handle.clone()).await {
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
