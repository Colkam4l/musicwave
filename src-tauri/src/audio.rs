use reqwest::Client;
use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink, Player};
use serde::{Deserialize, Serialize};
use std::io::BufReader;
use std::sync::{Arc, LazyLock};
use stream_download::http::HttpStream;
use stream_download::storage::temp::TempStorageProvider;
use stream_download::{Settings, StreamDownload};
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProgressPayload {
    pub elapsed_seconds: f64,
    pub total_seconds: f64,
    pub is_playing: bool,
}

pub struct AudioEngine {
    pub sink: MixerDeviceSink,
    pub player: Option<Arc<Player>>,
    pub total_seconds: f64,
    pub abort_handle: Option<tokio::task::AbortHandle>,
}

pub static AUDIO_ENGINE: LazyLock<Mutex<Option<AudioEngine>>> = LazyLock::new(|| Mutex::new(None));

pub async fn play(
    stream_url: String,
    total_seconds: f64,
    client: Client,
    app_handle: AppHandle,
) -> anyhow::Result<()> {
    // 1. Ensure audio engine & persistent sink is initialized
    let mut engine_guard = AUDIO_ENGINE.lock().await;
    if engine_guard.is_none() {
        let sink = DeviceSinkBuilder::open_default_sink()
            .map_err(|e| anyhow::anyhow!("Failed to open default audio sink: {e:?}"))?;
        *engine_guard = Some(AudioEngine {
            sink,
            player: None,
            total_seconds: 0.0,
            abort_handle: None,
        });
    }

    let engine = engine_guard.as_mut().unwrap();

    // 2. Stop and abort any previous player
    if let Some(prev_task) = engine.abort_handle.take() {
        prev_task.abort();
    }
    if let Some(prev_player) = engine.player.take() {
        prev_player.stop();
    }

    // 3. Create new player connected to existing sink's mixer
    let player = Arc::new(Player::connect_new(engine.sink.mixer()));

    // 4. Resolve stream download and MP4 decoder
    let parsed_url = stream_url.parse()?;
    let http_stream = HttpStream::new(client, parsed_url).await?;
    let settings = Settings::default().prefetch_bytes(128 * 1024);
    let reader =
        StreamDownload::from_stream(http_stream, TempStorageProvider::new(), settings).await?;

    let source = tokio::task::spawn_blocking(move || {
        Decoder::new_mp4(BufReader::with_capacity(128 * 1024, reader))
    })
    .await??;

    player.append(source);
    player.play();

    // 5. Emit initial progress event
    let initial_payload = ProgressPayload {
        elapsed_seconds: 0.0,
        total_seconds,
        is_playing: true,
    };
    let _ = app_handle.emit("player://progress", initial_payload);

    // 6. Spawn progress monitor task
    let player_clone = Arc::clone(&player);
    let app_handle_clone = app_handle.clone();
    let progress_task = tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(500));
        interval.tick().await;

        loop {
            interval.tick().await;

            let is_empty = player_clone.empty();
            let elapsed = player_clone.get_pos().as_secs_f64();
            let is_paused = player_clone.is_paused();

            if is_empty && elapsed > 1.0 {
                let _ = app_handle_clone.emit("player://ended", ());
                let ended_payload = ProgressPayload {
                    elapsed_seconds: elapsed,
                    total_seconds,
                    is_playing: false,
                };
                let _ = app_handle_clone.emit("player://progress", ended_payload);
                break;
            }

            let payload = ProgressPayload {
                elapsed_seconds: elapsed,
                total_seconds,
                is_playing: !is_paused && !is_empty,
            };
            let _ = app_handle_clone.emit("player://progress", payload);
        }
    });

    engine.player = Some(player);
    engine.total_seconds = total_seconds;
    engine.abort_handle = Some(progress_task.abort_handle());

    Ok(())
}

pub async fn pause() {
    let engine = AUDIO_ENGINE.lock().await;
    if let Some(ref e) = *engine
        && let Some(ref p) = e.player
    {
        p.pause();
    }
}

pub async fn resume() {
    let engine = AUDIO_ENGINE.lock().await;
    if let Some(ref e) = *engine
        && let Some(ref p) = e.player
    {
        p.play();
    }
}

pub async fn stop() {
    let mut engine = AUDIO_ENGINE.lock().await;
    if let Some(ref mut e) = *engine {
        if let Some(task) = e.abort_handle.take() {
            task.abort();
        }
        if let Some(p) = e.player.take() {
            p.stop();
        }
    }
}

pub async fn seek(position_seconds: f64) {
    let engine = AUDIO_ENGINE.lock().await;
    if let Some(ref e) = *engine
        && let Some(ref p) = e.player
    {
        let _ = p.try_seek(std::time::Duration::from_secs_f64(position_seconds));
    }
}

pub async fn set_volume(volume: f32) {
    let engine = AUDIO_ENGINE.lock().await;
    if let Some(ref e) = *engine
        && let Some(ref p) = e.player
    {
        p.set_volume(volume.clamp(0.0, 1.0));
    }
}
