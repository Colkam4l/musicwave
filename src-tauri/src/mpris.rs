#![cfg(all(target_os = "linux", feature = "mpris"))]

use crate::search::SongResult;
use std::collections::HashMap;
use std::sync::LazyLock;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Mutex;
use zbus::connection::Builder;
use zbus::fdo;
use zbus::zvariant::{ObjectPath, OwnedValue, Value};
use zbus::{Connection, interface};

const MPRIS_BUS_NAME: &str = "org.mpris.MediaPlayer2.musicwave";
const MPRIS_OBJECT_PATH: &str = "/org/mpris/MediaPlayer2";

static MPRIS_CONNECTION: LazyLock<Mutex<Option<Connection>>> = LazyLock::new(|| Mutex::new(None));

struct MediaPlayer2Root {
    app_handle: AppHandle,
}

#[interface(name = "org.mpris.MediaPlayer2")]
impl MediaPlayer2Root {
    async fn raise(&self) {
        if let Some(window) = self.app_handle.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }

    async fn quit(&self) {
        crate::audio::stop_with_app(Some(&self.app_handle)).await;
        self.app_handle.exit(0);
    }

    #[zbus(property)]
    async fn can_quit(&self) -> bool {
        true
    }

    #[zbus(property)]
    async fn can_raise(&self) -> bool {
        true
    }

    #[zbus(property)]
    async fn has_track_list(&self) -> bool {
        false
    }

    #[zbus(property)]
    async fn identity(&self) -> &str {
        "MusicWave"
    }

    #[zbus(property)]
    async fn desktop_entry(&self) -> &str {
        "musicwave"
    }

    #[zbus(property)]
    async fn supported_uri_schemes(&self) -> Vec<String> {
        Vec::new()
    }

    #[zbus(property)]
    async fn supported_mime_types(&self) -> Vec<String> {
        Vec::new()
    }
}

struct MediaPlayer2Player {
    app_handle: AppHandle,
    playback_status: String,
    current_song: Option<SongResult>,
}

fn sanitize_track_id(video_id: &str) -> String {
    let cleaned: String = video_id
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '_' })
        .collect();
    if cleaned.is_empty() {
        "track".to_string()
    } else {
        cleaned
    }
}

fn build_metadata(song: Option<&SongResult>) -> HashMap<String, OwnedValue> {
    let mut map: HashMap<String, OwnedValue> = HashMap::new();
    let Some(song) = song else {
        return map;
    };

    let track_path = format!("/org/musicwave/track/{}", sanitize_track_id(&song.video_id));
    if let Ok(obj_path) = ObjectPath::try_from(track_path.as_str())
        && let Ok(val) = Value::from(obj_path).try_into()
    {
        map.insert("mpris:trackid".to_string(), val);
    }

    if let Ok(val) = Value::from(song.title.as_str()).try_into() {
        map.insert("xesam:title".to_string(), val);
    }

    let artists = vec![song.artist.clone()];
    if let Ok(val) = Value::from(artists).try_into() {
        map.insert("xesam:artist".to_string(), val);
    }

    if let Some(ref album) = song.album
        && let Ok(val) = Value::from(album.as_str()).try_into()
    {
        map.insert("xesam:album".to_string(), val);
    }

    if let Some(ref art_url) = song.thumbnail_url
        && let Ok(val) = Value::from(art_url.as_str()).try_into()
    {
        map.insert("mpris:artUrl".to_string(), val);
    }

    if let Some(secs) = song.duration_seconds
        && let Ok(val) = Value::from(i64::from(secs) * 1_000_000).try_into()
    {
        map.insert("mpris:length".to_string(), val);
    }

    map
}

#[interface(name = "org.mpris.MediaPlayer2.Player")]
impl MediaPlayer2Player {
    async fn next(&self) -> fdo::Result<()> {
        let handle = self.app_handle.clone();
        tokio::spawn(async move {
            crate::audio::skip_next_from_queue(&handle).await;
        });
        Ok(())
    }

    async fn previous(&self) -> fdo::Result<()> {
        let _ = self.app_handle.emit("player://previous-requested", ());
        Ok(())
    }

    async fn pause(&self) -> fdo::Result<()> {
        crate::audio::pause_with_app(Some(&self.app_handle)).await;
        Ok(())
    }

    async fn play_pause(&self) -> fdo::Result<()> {
        let handle = self.app_handle.clone();
        tokio::spawn(async move {
            crate::audio::toggle_play_pause(&handle).await;
        });
        Ok(())
    }

    async fn stop(&self) -> fdo::Result<()> {
        crate::audio::stop_with_app(Some(&self.app_handle)).await;
        Ok(())
    }

    async fn play(&self) -> fdo::Result<()> {
        crate::audio::resume_with_app(Some(&self.app_handle)).await;
        Ok(())
    }

    #[zbus(property)]
    async fn playback_status(&self) -> &str {
        &self.playback_status
    }

    #[zbus(property)]
    async fn metadata(&self) -> HashMap<String, OwnedValue> {
        build_metadata(self.current_song.as_ref())
    }

    #[zbus(property)]
    async fn can_go_next(&self) -> bool {
        true
    }

    #[zbus(property)]
    async fn can_go_previous(&self) -> bool {
        true
    }

    #[zbus(property)]
    async fn can_play(&self) -> bool {
        true
    }

    #[zbus(property)]
    async fn can_pause(&self) -> bool {
        true
    }

    #[zbus(property)]
    async fn can_seek(&self) -> bool {
        false
    }

    #[zbus(property)]
    async fn can_control(&self) -> bool {
        true
    }
}

/// Spawns the session D-Bus MPRIS2 service in the background without blocking startup.
pub fn spawn_mpris(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let root = MediaPlayer2Root {
            app_handle: app_handle.clone(),
        };
        let player = MediaPlayer2Player {
            app_handle,
            playback_status: "Stopped".to_string(),
            current_song: None,
        };

        let conn_res = Builder::session()
            .and_then(|b| b.name(MPRIS_BUS_NAME))
            .and_then(|b| b.serve_at(MPRIS_OBJECT_PATH, root))
            .and_then(|b| b.serve_at(MPRIS_OBJECT_PATH, player));

        match conn_res {
            Ok(builder) => match builder.build().await {
                Ok(conn) => {
                    *MPRIS_CONNECTION.lock().await = Some(conn);
                    eprintln!("[musicwave mpris] Registered D-Bus service {MPRIS_BUS_NAME}");
                }
                Err(err) => {
                    eprintln!("[musicwave mpris] Failed building D-Bus connection: {err}");
                }
            },
            Err(err) => {
                eprintln!("[musicwave mpris] Failed configuring D-Bus service: {err}");
            }
        }
    });
}

/// Pushes track metadata and playback status updates to MPRIS2 D-Bus properties.
pub fn notify_state_change(song: Option<SongResult>, status: &'static str) {
    tauri::async_runtime::spawn(async move {
        let conn_opt = { MPRIS_CONNECTION.lock().await.clone() };
        let Some(conn) = conn_opt else {
            return;
        };

        let Ok(iface_ref) = conn
            .object_server()
            .interface::<_, MediaPlayer2Player>(MPRIS_OBJECT_PATH)
            .await
        else {
            return;
        };

        let (status_changed, metadata_changed) = {
            let mut iface = iface_ref.get_mut().await;
            let status_changed = iface.playback_status != status;
            let metadata_changed = match (&iface.current_song, &song) {
                (Some(prev), Some(next)) => prev.video_id != next.video_id,
                (None, None) => false,
                (Some(_), None) => true,
                (None, Some(_)) => true,
            };

            iface.playback_status = status.to_string();
            if song.is_some() || status == "Stopped" {
                iface.current_song = song;
            }
            (status_changed, metadata_changed)
        };

        let iface = iface_ref.get().await;
        let emitter = iface_ref.signal_emitter();
        if status_changed {
            let _ = iface.playback_status_changed(emitter).await;
        }
        if metadata_changed {
            let _ = iface.metadata_changed(emitter).await;
        }
    });
}
