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

pub struct PlayerState {
    pub player: Arc<Player>,
    pub sink: MixerDeviceSink,
    pub total_seconds: f64,
    pub abort_handle: tokio::task::AbortHandle,
}

pub static AUDIO_STATE: LazyLock<Mutex<Option<PlayerState>>> = LazyLock::new(|| Mutex::new(None));

pub async fn play(
    stream_url: String,
    total_seconds: f64,
    client: Client,
    app_handle: AppHandle,
) -> anyhow::Result<()> {
    // 1. Stop and abort any existing playback
    {
        let mut state_guard = AUDIO_STATE.lock().await;
        if let Some(prev) = state_guard.take() {
            prev.abort_handle.abort();
            prev.player.stop();
        }
    }

    // 2. Open default audio sink and create player
    let sink = DeviceSinkBuilder::open_default_sink()
        .map_err(|e| anyhow::anyhow!("Failed to open default audio sink: {e:?}"))?;
    let player = Arc::new(Player::connect_new(sink.mixer()));

    // 3. Resolve stream download and MP4 decoder
    let parsed_url = stream_url.parse()?;
    let http_stream = HttpStream::new(client, parsed_url).await?;
    let reader =
        StreamDownload::from_stream(http_stream, TempStorageProvider::new(), Settings::default())
            .await?;

    let source = Decoder::new_mp4(BufReader::new(reader))?;
    player.append(source);
    player.play();

    // 4. Emit initial progress event
    let initial_payload = ProgressPayload {
        elapsed_seconds: 0.0,
        total_seconds,
        is_playing: true,
    };
    let _ = app_handle.emit("player://progress", initial_payload);

    // 5. Spawn background task to emit player://progress every 500ms
    let player_clone = Arc::clone(&player);
    let app_handle_clone = app_handle.clone();
    let progress_task = tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(500));
        // Consume first tick
        interval.tick().await;

        loop {
            interval.tick().await;

            let is_empty = player_clone.empty();
            let elapsed = player_clone.get_pos().as_secs_f64();
            let is_paused = player_clone.is_paused();

            if is_empty && elapsed > 0.0 {
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

    // 6. Save player state
    let abort_handle = progress_task.abort_handle();
    let new_state = PlayerState {
        player,
        sink,
        total_seconds,
        abort_handle,
    };

    let mut state_guard = AUDIO_STATE.lock().await;
    *state_guard = Some(new_state);

    Ok(())
}

pub async fn pause() {
    let state = AUDIO_STATE.lock().await;
    if let Some(ref s) = *state {
        s.player.pause();
    }
}

pub async fn resume() {
    let state = AUDIO_STATE.lock().await;
    if let Some(ref s) = *state {
        s.player.play();
    }
}

pub async fn stop() {
    let mut state = AUDIO_STATE.lock().await;
    if let Some(s) = state.take() {
        s.abort_handle.abort();
        s.player.stop();
    }
}

pub async fn seek(position_seconds: f64) {
    let state = AUDIO_STATE.lock().await;
    if let Some(ref s) = *state {
        // TODO: Sprint 4 — YouTube streams via stream-download may not support arbitrary seeking.
        let _ = s
            .player
            .try_seek(std::time::Duration::from_secs_f64(position_seconds));
    }
}

pub async fn set_volume(volume: f32) {
    let state = AUDIO_STATE.lock().await;
    if let Some(ref s) = *state {
        s.player.set_volume(volume.clamp(0.0, 1.0));
    }
}
