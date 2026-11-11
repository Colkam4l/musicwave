#![cfg(desktop)]

use crate::search::SongResult;
use std::sync::{LazyLock, Mutex};
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, WindowEvent, Wry};

const MENU_NOW_PLAYING: &str = "tray_now_playing";
const MENU_PLAY_PAUSE: &str = "tray_play_pause";
const MENU_NEXT: &str = "tray_next";
const MENU_OPEN: &str = "tray_open";
const MENU_QUIT: &str = "tray_quit";

#[derive(Clone)]
struct TrayMenuHandles {
    now_playing: MenuItem<Wry>,
    play_pause: MenuItem<Wry>,
}

static TRAY_HANDLES: LazyLock<Mutex<Option<TrayMenuHandles>>> = LazyLock::new(|| Mutex::new(None));

/// Shows, unminimizes, and focuses the main application window.
pub fn show_main_window(app_handle: &AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Hides the window to the system tray instead of terminating the app when closed.
pub fn handle_window_event(window: &tauri::Window, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        let _ = window.hide();
        api.prevent_close();
    }
}

/// Initializes the desktop system tray icon and context menu.
pub fn setup_tray(app_handle: &AppHandle) -> tauri::Result<()> {
    let now_playing = MenuItem::with_id(
        app_handle,
        MENU_NOW_PLAYING,
        "Now Playing: Nothing Playing",
        false,
        None::<&str>,
    )?;
    let play_pause = MenuItem::with_id(app_handle, MENU_PLAY_PAUSE, "Play", true, None::<&str>)?;
    let next = MenuItem::with_id(app_handle, MENU_NEXT, "Next", true, None::<&str>)?;
    let open = MenuItem::with_id(app_handle, MENU_OPEN, "Open MusicWave", true, None::<&str>)?;
    let quit = MenuItem::with_id(app_handle, MENU_QUIT, "Quit", true, None::<&str>)?;

    let sep1 = PredefinedMenuItem::separator(app_handle)?;
    let sep2 = PredefinedMenuItem::separator(app_handle)?;

    let menu = Menu::with_items(
        app_handle,
        &[&now_playing, &sep1, &play_pause, &next, &sep2, &open, &quit],
    )?;

    if let Ok(mut guard) = TRAY_HANDLES.lock() {
        *guard = Some(TrayMenuHandles {
            now_playing,
            play_pause,
        });
    }

    let icon = Image::from_bytes(include_bytes!("../icons/tray.png"))?;

    TrayIconBuilder::with_id("musicwave-tray")
        .icon(icon)
        .tooltip("MusicWave")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            MENU_PLAY_PAUSE => {
                let handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    crate::audio::toggle_play_pause(&handle).await;
                });
            }
            MENU_NEXT => {
                let handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    crate::audio::skip_next_from_queue(&handle).await;
                });
            }
            MENU_OPEN => {
                show_main_window(app);
            }
            MENU_QUIT => {
                let handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    crate::audio::stop_with_app(Some(&handle)).await;
                    handle.exit(0);
                });
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            }
            | TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app_handle)?;

    Ok(())
}

/// Updates the tray menu labels to reflect the active song and play/pause state.
pub fn update_state(song: Option<SongResult>, is_playing: bool) {
    let handles = {
        TRAY_HANDLES
            .lock()
            .ok()
            .and_then(|guard| guard.as_ref().cloned())
    };
    let Some(handles) = handles else {
        return;
    };

    let now_playing_label = match song {
        Some(s) => format!("Now Playing: {} - {}", s.artist, s.title),
        None => "Now Playing: Nothing Playing".to_string(),
    };
    let play_label = if is_playing { "Pause" } else { "Play" };

    tauri::async_runtime::spawn_blocking(move || {
        let _ = handles.now_playing.set_text(now_playing_label);
        let _ = handles.play_pause.set_text(play_label);
    });
}
