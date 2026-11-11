use crate::audio;
use crate::library;
use crate::queue;
use crate::search::{SongResult, search_songs as search_songs_impl};
use crate::stream::{is_auth_error, is_cancelled_error};
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
