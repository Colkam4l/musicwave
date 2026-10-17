use crate::audio::SharedAudioPlayer;
use crate::search::{SongResult, search_songs};
use crate::stream::resolve_stream_url;
use tauri::State;

#[tauri::command]
pub async fn ping() -> Result<String, String> {
    Ok("pong".to_string())
}

#[tauri::command]
pub async fn search(query: String) -> Result<Vec<SongResult>, String> {
    search_songs(&query).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn play(video_id: String, player: State<'_, SharedAudioPlayer>) -> Result<(), String> {
    let (stream_url, client) = resolve_stream_url(&video_id)
        .await
        .map_err(|e| e.to_string())?;

    let mut p = player.lock().await;
    p.play_stream(&stream_url, client)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn pause(player: State<'_, SharedAudioPlayer>) -> Result<(), String> {
    let p = player.lock().await;
    p.pause();
    Ok(())
}

#[tauri::command]
pub async fn resume(player: State<'_, SharedAudioPlayer>) -> Result<(), String> {
    let p = player.lock().await;
    p.play();
    Ok(())
}

#[tauri::command]
pub async fn stop(player: State<'_, SharedAudioPlayer>) -> Result<(), String> {
    let p = player.lock().await;
    p.stop();
    Ok(())
}
