pub mod audio;
pub mod commands;
pub mod search;
pub mod stream;

use std::sync::Arc;
use tokio::sync::Mutex;

use audio::AudioPlayer;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let player = Arc::new(Mutex::new(AudioPlayer::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(player)
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::search_songs,
            commands::search,
            commands::play,
            commands::pause,
            commands::resume,
            commands::stop
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
