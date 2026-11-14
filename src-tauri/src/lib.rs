pub mod audio;
pub mod auth;
pub mod cache;
pub mod commands;
pub mod library;
#[cfg(all(target_os = "linux", feature = "mpris"))]
pub mod mpris;
pub mod queue;
pub mod search;
pub mod settings;
pub mod stream;
pub mod sync;
#[cfg(all(desktop, not(target_os = "android")))]
pub mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let app_handle = app.handle();
            if let Err(err) = settings::load_settings(app_handle) {
                eprintln!("[musicwave settings] Failed loading settings on startup: {err}");
            }

            #[cfg(all(desktop, not(target_os = "android")))]
            tray::setup_tray(app_handle)?;

            #[cfg(all(target_os = "linux", feature = "mpris"))]
            mpris::spawn_mpris(app_handle.clone());

            Ok(())
        })
        .on_window_event(|window, event| {
            #[cfg(all(desktop, not(target_os = "android")))]
            tray::handle_window_event(window, event);
            #[cfg(any(not(desktop), target_os = "android"))]
            let _ = (window, event);
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
            commands::save_settings,
            commands::get_home_shelves,
            commands::get_watch_playlist,
            commands::get_lyrics,
            commands::shuffle_queue,
            commands::set_repeat_mode,
            commands::get_repeat_mode,
            commands::set_auto_queue,
            commands::get_auto_queue,
            commands::create_playlist,
            commands::delete_playlist,
            commands::rename_playlist,
            commands::add_to_playlist,
            commands::remove_from_playlist,
            commands::reorder_playlist,
            commands::get_playlists,
            commands::get_playlist,
            commands::get_active_profile,
            commands::create_profile,
            commands::switch_profile,
            commands::delete_profile,
            commands::list_profiles,
            commands::link_youtube_account,
            commands::disconnect_youtube_account,
            commands::get_sync_status,
            commands::sync_library,
            commands::get_cache_stats,
            commands::clear_cache,
            commands::download_track_for_offline,
            commands::is_track_cached,
            commands::get_search_suggestions,
            commands::skip_to_queue_index
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
