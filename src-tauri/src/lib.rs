pub mod audio;
pub mod commands;
pub mod library;
#[cfg(all(target_os = "linux", feature = "mpris"))]
pub mod mpris;
pub mod queue;
pub mod search;
pub mod settings;
pub mod stream;
#[cfg(desktop)]
pub mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();
            if let Err(err) = settings::load_settings(app_handle) {
                eprintln!("[musicwave settings] Failed loading settings on startup: {err}");
            }

            #[cfg(desktop)]
            tray::setup_tray(app_handle)?;

            #[cfg(all(target_os = "linux", feature = "mpris"))]
            mpris::spawn_mpris(app_handle.clone());

            Ok(())
        })
        .on_window_event(|window, event| {
            #[cfg(desktop)]
            tray::handle_window_event(window, event);
        })
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
            commands::set_volume,
            commands::enqueue_next,
            commands::enqueue_last,
            commands::dequeue_front,
            commands::remove_from_queue,
            commands::reorder_queue,
            commands::clear_queue,
            commands::get_queue,
            commands::like_song,
            commands::unlike_song,
            commands::get_liked_songs,
            commands::get_recent_plays,
            commands::get_settings,
            commands::save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
