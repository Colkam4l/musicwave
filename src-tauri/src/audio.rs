use crate::search::SongResult;
use crate::stream::{
    PlaybackCancel, PlaybackCancelledError, RangeStreamReader, ResolvedAudioStream, is_auth_error,
    is_cancelled_error, resolve_audio_stream,
};
use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink, Player};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, LazyLock};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProgressPayload {
    pub elapsed_seconds: f64,
    pub total_seconds: f64,
    pub is_playing: bool,
}

struct AudioEngine {
    sink: MixerDeviceSink,
    player: Option<Arc<Player>>,
    total_seconds: f64,
    abort_handle: Option<tokio::task::AbortHandle>,
}

struct AudioState {
    volume: f32,
    generation: u64,
    active_cancel: Option<PlaybackCancel>,
    engine: Option<AudioEngine>,
}

impl AudioState {
    fn stop_active_playback(&mut self) {
        if let Some(prev_cancel) = self.active_cancel.take() {
            prev_cancel.cancel();
        }
        if let Some(ref mut engine) = self.engine {
            if let Some(prev_task) = engine.abort_handle.take() {
                prev_task.abort();
            }
            if let Some(prev_player) = engine.player.take() {
                prev_player.stop();
            }
        }
    }
}

static AUDIO_STATE: LazyLock<Mutex<AudioState>> = LazyLock::new(|| {
    Mutex::new(AudioState {
        volume: 0.8,
        generation: 0,
        active_cancel: None,
        engine: None,
    })
});

/// Stops any active or in-flight playback and starts a new cancellation session.
pub async fn begin_playback_session() -> (u64, PlaybackCancel) {
    let mut state = AUDIO_STATE.lock().await;
    state.generation += 1;
    state.stop_active_playback();

    let cancel = PlaybackCancel::new();
    state.active_cancel = Some(cancel.clone());
    (state.generation, cancel)
}

fn spawn_progress_monitor(
    player: Arc<Player>,
    total_seconds: f64,
    app_handle: AppHandle,
) -> tokio::task::AbortHandle {
    let task = tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(500));
        interval.tick().await;

        loop {
            interval.tick().await;

            let is_empty = player.empty();
            let elapsed = player.get_pos().as_secs_f64();
            let is_paused = player.is_paused();

            if is_empty && (elapsed > 0.5 || (total_seconds > 0.0 && total_seconds <= 1.0)) {
                eprintln!("[musicwave audio] Track ended at {:.2}s", elapsed);
                let ended_payload = ProgressPayload {
                    elapsed_seconds: elapsed.min(total_seconds),
                    total_seconds,
                    is_playing: false,
                };
                let _ = app_handle.emit("player://progress", ended_payload);

                if let Some(next_song) = crate::queue::dequeue_front().await {
                    let _ = app_handle.emit("player://track-changed", &next_song);
                    let handle_clone = app_handle.clone();
                    tokio::spawn(async move {
                        if let Err(err) = play_track(
                            next_song.video_id.clone(),
                            Some(next_song),
                            handle_clone.clone(),
                        )
                        .await
                            && !is_cancelled_error(&err)
                        {
                            if is_auth_error(&err) {
                                let _ = handle_clone.emit("player://auth-required", ());
                            } else {
                                let _ = handle_clone.emit("player://error", err.to_string());
                            }
                            let _ = handle_clone.emit("player://ended", ());
                        }
                    });
                } else {
                    let _ = app_handle.emit("player://ended", ());
                }
                break;
            }

            let clamped_elapsed = if total_seconds > 0.0 {
                elapsed.min(total_seconds)
            } else {
                elapsed
            };

            let payload = ProgressPayload {
                elapsed_seconds: clamped_elapsed,
                total_seconds,
                is_playing: !is_paused && !is_empty,
            };
            let _ = app_handle.emit("player://progress", payload);
        }
    });

    task.abort_handle()
}

pub async fn play_stream(
    resolved: ResolvedAudioStream,
    session_gen: u64,
    cancel: PlaybackCancel,
    app_handle: AppHandle,
) -> anyhow::Result<()> {
    if cancel.is_cancelled() {
        return Err(PlaybackCancelledError.into());
    }

    let total_seconds = resolved.total_seconds;
    let runtime = tokio::runtime::Handle::current();
    let reader = RangeStreamReader::new(resolved, runtime, cancel.clone());

    eprintln!("[musicwave audio] Opening MP4 decoder over range stream...");
    let decode_task = tokio::task::spawn_blocking(move || Decoder::new_mp4(reader));
    let source = tokio::select! {
        _ = cancel.wait_cancelled() => return Err(PlaybackCancelledError.into()),
        res = decode_task => match res {
            Ok(Ok(src)) => src,
            Ok(Err(e)) => {
                if cancel.is_cancelled() {
                    return Err(PlaybackCancelledError.into());
                }
                return Err(e.into());
            }
            Err(e) => return Err(e.into()),
        },
    };
    eprintln!("[musicwave audio] MP4 decoder ready!");

    let mut state = AUDIO_STATE.lock().await;
    if state.generation != session_gen || cancel.is_cancelled() {
        return Err(PlaybackCancelledError.into());
    }

    if state.engine.is_none() {
        eprintln!("[musicwave audio] Opening default audio sink...");
        let sink = DeviceSinkBuilder::open_default_sink()
            .map_err(|e| anyhow::anyhow!("Failed to open default audio sink: {e:?}"))?;
        state.engine = Some(AudioEngine {
            sink,
            player: None,
            total_seconds: 0.0,
            abort_handle: None,
        });
        eprintln!("[musicwave audio] Default audio sink successfully opened!");
    }

    let volume = state.volume;
    let engine = state.engine.as_mut().unwrap();

    if let Some(prev_task) = engine.abort_handle.take() {
        prev_task.abort();
    }
    if let Some(prev_player) = engine.player.take() {
        prev_player.stop();
    }

    let player = Arc::new(Player::connect_new(engine.sink.mixer()));
    player.set_volume(volume);
    player.append(source);
    player.play();
    eprintln!("[musicwave audio] Player started playing!");

    let initial_payload = ProgressPayload {
        elapsed_seconds: 0.0,
        total_seconds,
        is_playing: true,
    };
    let _ = app_handle.emit("player://progress", initial_payload);

    let abort_handle = spawn_progress_monitor(Arc::clone(&player), total_seconds, app_handle);
    engine.player = Some(player);
    engine.total_seconds = total_seconds;
    engine.abort_handle = Some(abort_handle);

    Ok(())
}

/// Resolves and starts playing `video_id`, recording `song` in recently played once active.
pub async fn play_track(
    video_id: String,
    song: Option<SongResult>,
    app_handle: AppHandle,
) -> anyhow::Result<()> {
    let (session_gen, cancel) = begin_playback_session().await;
    let resolved = resolve_audio_stream(&video_id, &cancel).await?;
    play_stream(resolved, session_gen, cancel, app_handle.clone()).await?;

    if let Some(song_meta) = song
        && let Ok(recents) = crate::library::add_to_recents(&app_handle, song_meta).await
    {
        let _ = app_handle.emit("library://recents-updated", recents);
    }

    Ok(())
}

pub async fn pause() {
    let state = AUDIO_STATE.lock().await;
    if let Some(ref engine) = state.engine
        && let Some(ref p) = engine.player
    {
        p.pause();
    }
}

pub async fn resume() {
    let state = AUDIO_STATE.lock().await;
    if let Some(ref engine) = state.engine
        && let Some(ref p) = engine.player
    {
        p.play();
    }
}

pub async fn stop() {
    let mut state = AUDIO_STATE.lock().await;
    state.generation += 1;
    state.stop_active_playback();
}

pub async fn seek(position_seconds: f64, app_handle: Option<AppHandle>) -> anyhow::Result<()> {
    let (player_opt, total_seconds) = {
        let state = AUDIO_STATE.lock().await;
        match state.engine {
            Some(ref engine) => (engine.player.clone(), engine.total_seconds),
            None => (None, 0.0),
        }
    };

    if let Some(player) = player_opt {
        let clamped = if total_seconds > 0.0 {
            position_seconds.clamp(0.0, total_seconds)
        } else {
            position_seconds.max(0.0)
        };
        let target = Duration::from_secs_f64(clamped);
        let player_for_seek = Arc::clone(&player);

        tokio::task::spawn_blocking(move || player_for_seek.try_seek(target))
            .await?
            .map_err(|e| anyhow::anyhow!("Seek failed: {e:?}"))?;

        if let Some(handle) = app_handle {
            let payload = ProgressPayload {
                elapsed_seconds: player.get_pos().as_secs_f64(),
                total_seconds,
                is_playing: !player.is_paused() && !player.empty(),
            };
            let _ = handle.emit("player://progress", payload);
        }
    }

    Ok(())
}

pub async fn set_volume(volume: f32) {
    let clamped = volume.clamp(0.0, 1.0);
    let mut state = AUDIO_STATE.lock().await;
    state.volume = clamped;
    if let Some(ref engine) = state.engine
        && let Some(ref p) = engine.player
    {
        p.set_volume(clamped);
    }
}
