pub mod audio;
pub mod commands;
pub mod search;
pub mod stream;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::search_songs,
            commands::search,
            commands::play_song,
            commands::play,
            commands::pause_playback,
            commands::pause,
            commands::resume_playback,
            commands::resume,
            commands::stop_playback,
            commands::stop,
            commands::seek_to,
            commands::set_volume
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
