use reqwest::StatusCode;
use reqwest::header::{CONTENT_RANGE, HeaderMap, HeaderValue, RANGE, USER_AGENT};
use std::collections::{HashMap, VecDeque};
use std::fmt;
use std::io::{self, Read, Seek, SeekFrom};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::sync::{Notify, watch};
use youtui_vendored_rusty_ytdl::{
    DownloadOptions, RequestOptions, Video, VideoOptions, VideoQuality, VideoSearchOptions,
    choose_format,
};

const CHUNK_SIZE: u64 = 512 * 1024;
const MAX_CACHED_CHUNKS: usize = 8;
const DEFAULT_UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

#[derive(Debug)]
pub struct PlaybackCancelledError;

impl fmt::Display for PlaybackCancelledError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Playback cancelled")
    }
}

impl std::error::Error for PlaybackCancelledError {}

#[derive(Debug)]
pub struct AuthRequiredError(pub String);

impl fmt::Display for AuthRequiredError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for AuthRequiredError {}

/// Cooperative cancellation signal shared across stream resolution, decoding, and range reads.
#[derive(Clone)]
pub struct PlaybackCancel {
    cancelled: Arc<AtomicBool>,
    notify: Arc<Notify>,
}

impl PlaybackCancel {
    pub fn new() -> Self {
        Self {
            cancelled: Arc::new(AtomicBool::new(false)),
            notify: Arc::new(Notify::new()),
        }
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
        self.notify.notify_waiters();
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    /// Resolves cleanly as soon as `cancel()` has been called, without losing prior notifications.
    pub async fn wait_cancelled(&self) {
        loop {
            let notified = self.notify.notified();
            if self.is_cancelled() {
                return;
            }
            notified.await;
        }
    }
}

impl Default for PlaybackCancel {
    fn default() -> Self {
        Self::new()
    }
}

pub fn is_cancelled_error(err: &anyhow::Error) -> bool {
    err.downcast_ref::<PlaybackCancelledError>().is_some()
}

pub fn is_auth_error(err: &anyhow::Error) -> bool {
    if err.downcast_ref::<AuthRequiredError>().is_some() {
        return true;
    }
    let msg = err.to_string().to_lowercase();
    msg.contains("sign in to confirm")
        || msg.contains("confirm you're not a bot")
        || msg.contains("403 forbidden")
        || msg.contains("http 403")
        || msg.contains("http 401")
        || msg.contains("login_required")
}

pub fn load_auth_config() -> (Option<String>, Option<String>, Option<String>) {
    crate::settings::active_auth_tuple(None)
}

pub struct ResolvedAudioStream {
    pub url: String,
    pub content_length: u64,
    pub total_seconds: f64,
    pub client: reqwest::Client,
}

fn parse_content_range_total(header_val: &str) -> Option<u64> {
    let (_, total) = header_val.split_once('/')?;
    total.trim().parse::<u64>().ok()
}

async fn resolve_content_length(
    client: &reqwest::Client,
    url: &str,
    cancel: &PlaybackCancel,
) -> anyhow::Result<u64> {
    let req = client.get(url).header(RANGE, "bytes=0-0").send();
    let resp = tokio::select! {
        _ = cancel.wait_cancelled() => return Err(PlaybackCancelledError.into()),
        res = req => res?,
    };

    if resp.status() == StatusCode::UNAUTHORIZED || resp.status() == StatusCode::FORBIDDEN {
        return Err(AuthRequiredError(format!("HTTP {} from media server", resp.status())).into());
    }
    if !resp.status().is_success() {
        anyhow::bail!("Unexpected HTTP {} resolving stream length", resp.status());
    }

    if let Some(cr) = resp
        .headers()
        .get(CONTENT_RANGE)
        .and_then(|v| v.to_str().ok())
        && let Some(total) = parse_content_range_total(cr)
    {
        return Ok(total);
    }

    resp.content_length()
        .filter(|&len| len > 0)
        .ok_or_else(|| anyhow::anyhow!("Media server did not provide content length"))
}

/// Resolves the direct MP4 audio stream URL, byte length, and duration in a single `get_info()` call.
pub async fn resolve_audio_stream(
    video_id: &str,
    cancel: &PlaybackCancel,
) -> anyhow::Result<ResolvedAudioStream> {
    resolve_audio_stream_with_app(video_id, cancel, None).await
}

pub async fn resolve_audio_stream_with_app(
    video_id: &str,
    cancel: &PlaybackCancel,
    app_handle: Option<&tauri::AppHandle>,
) -> anyhow::Result<ResolvedAudioStream> {
    if cancel.is_cancelled() {
        return Err(PlaybackCancelledError.into());
    }

    eprintln!(
        "[musicwave stream] Resolving audio stream for video_id: {}",
        video_id
    );
    let video_url = format!("https://www.youtube.com/watch?v={}", video_id);
    let (auth_cookie, user_agent, auth_po_token) = crate::settings::active_auth_tuple(app_handle);
    let ua_string = user_agent.unwrap_or_else(|| DEFAULT_UA.to_string());

    let mut headers = HeaderMap::new();
    headers.insert(USER_AGENT, HeaderValue::from_str(&ua_string)?);

    let client = reqwest::Client::builder()
        .default_headers(headers)
        .connect_timeout(Duration::from_secs(10))
        .read_timeout(Duration::from_secs(15))
        .build()?;

    let video_options = VideoOptions {
        quality: VideoQuality::Highest,
        filter: VideoSearchOptions::Custom(Arc::new(|f| {
            f.has_audio && !f.has_video && f.mime_type.container == "mp4"
        })),
        download_options: DownloadOptions {
            dl_chunk_size: Some(CHUNK_SIZE),
        },
        request_options: RequestOptions {
            client: Some(client.clone()),
            cookies: auth_cookie,
            po_token: auth_po_token,
            ..Default::default()
        },
    };

    let video = Video::new_with_options(&video_url, &video_options)?;
    let video_info = tokio::select! {
        _ = cancel.wait_cancelled() => return Err(PlaybackCancelledError.into()),
        res = video.get_info() => res?,
    };

    let total_seconds = video_info
        .video_details
        .length_seconds
        .parse::<f64>()
        .unwrap_or(0.0);

    let format = choose_format(&video_info.formats, &video_options)
        .map_err(|_| anyhow::anyhow!("No playable MP4 audio format found"))?;

    if format.url.is_empty() {
        anyhow::bail!("Resolved audio format has empty URL");
    }

    let mut content_length = format
        .content_length
        .as_deref()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);

    if content_length == 0 {
        content_length = resolve_content_length(&client, &format.url, cancel).await?;
    }

    eprintln!(
        "[musicwave stream] Resolved stream: duration={}s, content_length={} bytes",
        total_seconds, content_length
    );

    Ok(ResolvedAudioStream {
        url: format.url,
        content_length,
        total_seconds,
        client,
    })
}

type ChunkWatchVal = Option<Result<Arc<Vec<u8>>, String>>;

struct ChunkCache {
    chunks: VecDeque<(u64, Arc<Vec<u8>>)>,
    in_flight: HashMap<u64, watch::Receiver<ChunkWatchVal>>,
}

impl ChunkCache {
    fn new() -> Self {
        Self {
            chunks: VecDeque::with_capacity(MAX_CACHED_CHUNKS),
            in_flight: HashMap::new(),
        }
    }

    fn get_cached(&mut self, idx: u64) -> Option<Arc<Vec<u8>>> {
        let pos = self.chunks.iter().position(|(k, _)| *k == idx)?;
        let entry = self.chunks.remove(pos)?;
        let data = Arc::clone(&entry.1);
        self.chunks.push_back(entry);
        Some(data)
    }

    fn insert_cached(&mut self, idx: u64, data: Arc<Vec<u8>>) {
        if let Some(pos) = self.chunks.iter().position(|(k, _)| *k == idx) {
            self.chunks.remove(pos);
        } else if self.chunks.len() >= MAX_CACHED_CHUNKS {
            self.chunks.pop_front();
        }
        self.chunks.push_back((idx, data));
    }
}

struct InFlightGuard {
    chunk_idx: u64,
    cache: Arc<Mutex<ChunkCache>>,
    tx: Option<watch::Sender<ChunkWatchVal>>,
}

impl InFlightGuard {
    fn complete(mut self, result: Result<Arc<Vec<u8>>, String>) {
        if let Ok(mut guard) = self.cache.lock() {
            guard.in_flight.remove(&self.chunk_idx);
            if let Ok(ref data) = result {
                guard.insert_cached(self.chunk_idx, Arc::clone(data));
            }
        }
        if let Some(tx) = self.tx.take() {
            let _ = tx.send(Some(result));
        }
    }
}

impl Drop for InFlightGuard {
    fn drop(&mut self) {
        if let Some(tx) = self.tx.take() {
            if let Ok(mut guard) = self.cache.lock() {
                guard.in_flight.remove(&self.chunk_idx);
            }
            let _ = tx.send(Some(Err("Chunk fetch aborted".to_string())));
        }
    }
}

#[derive(Clone)]
struct FetchContext {
    url: Arc<String>,
    client: reqwest::Client,
    content_length: u64,
    cancel: PlaybackCancel,
    cache: Arc<Mutex<ChunkCache>>,
}

enum ChunkLookup {
    Ready(Arc<Vec<u8>>),
    Wait(watch::Receiver<ChunkWatchVal>),
    Fetch(InFlightGuard),
}

impl FetchContext {
    fn lookup_or_claim(&self, chunk_idx: u64) -> io::Result<ChunkLookup> {
        let mut guard = self
            .cache
            .lock()
            .map_err(|_| io::Error::other("Chunk cache mutex poisoned"))?;

        if let Some(cached) = guard.get_cached(chunk_idx) {
            return Ok(ChunkLookup::Ready(cached));
        }

        if let Some(rx) = guard.in_flight.get(&chunk_idx) {
            return Ok(ChunkLookup::Wait(rx.clone()));
        }

        let (tx, rx) = watch::channel(None);
        guard.in_flight.insert(chunk_idx, rx);
        Ok(ChunkLookup::Fetch(InFlightGuard {
            chunk_idx,
            cache: Arc::clone(&self.cache),
            tx: Some(tx),
        }))
    }

    async fn fetch_chunk_http(&self, chunk_idx: u64) -> Result<Arc<Vec<u8>>, String> {
        let start = chunk_idx * CHUNK_SIZE;
        let end = (start + CHUNK_SIZE - 1).min(self.content_length - 1);
        let range_header = format!("bytes={}-{}", start, end);

        let send_fut = self
            .client
            .get(self.url.as_str())
            .header(RANGE, range_header)
            .send();

        let resp = tokio::select! {
            _ = self.cancel.wait_cancelled() => return Err("Playback cancelled".to_string()),
            res = send_fut => res.map_err(|e| format!("Range request failed: {e}"))?,
        };

        let status = resp.status();
        if status == StatusCode::UNAUTHORIZED || status == StatusCode::FORBIDDEN {
            return Err(format!("HTTP {status} reading audio range"));
        }
        if !status.is_success() {
            return Err(format!("Unexpected HTTP {status} reading audio range"));
        }

        let bytes = tokio::select! {
            _ = self.cancel.wait_cancelled() => return Err("Playback cancelled".to_string()),
            res = resp.bytes() => res.map_err(|e| format!("Failed reading response body: {e}"))?,
        };

        Ok(Arc::new(bytes.to_vec()))
    }

    async fn get_or_fetch_chunk(&self, chunk_idx: u64) -> io::Result<Arc<Vec<u8>>> {
        loop {
            if self.cancel.is_cancelled() {
                return Err(io::Error::new(
                    io::ErrorKind::Interrupted,
                    "Playback cancelled",
                ));
            }

            match self.lookup_or_claim(chunk_idx)? {
                ChunkLookup::Ready(data) => return Ok(data),
                ChunkLookup::Fetch(guard) => {
                    let result = self.fetch_chunk_http(chunk_idx).await;
                    guard.complete(result.clone());
                    return result.map_err(|msg| {
                        let kind = if self.cancel.is_cancelled() {
                            io::ErrorKind::Interrupted
                        } else {
                            io::ErrorKind::Other
                        };
                        io::Error::new(kind, msg)
                    });
                }
                ChunkLookup::Wait(mut rx) => {
                    let wait_res = tokio::select! {
                        _ = self.cancel.wait_cancelled() => {
                            return Err(io::Error::new(io::ErrorKind::Interrupted, "Playback cancelled"));
                        }
                        res = rx.wait_for(|v| v.is_some()) => res,
                    };
                    match wait_res {
                        Ok(val) => {
                            if let Some(Ok(data)) = val.as_ref() {
                                return Ok(Arc::clone(data));
                            }
                            if let Some(Err(msg)) = val.as_ref() {
                                return Err(io::Error::other(msg.clone()));
                            }
                        }
                        Err(_) => {
                            // Sender dropped before delivering; retry loop to reclaim or observe cancel.
                        }
                    }
                }
            }
        }
    }

    fn spawn_prefetch(&self, runtime: &tokio::runtime::Handle, chunk_idx: u64) {
        if chunk_idx * CHUNK_SIZE >= self.content_length || self.cancel.is_cancelled() {
            return;
        }

        let Ok(mut guard) = self.cache.lock() else {
            return;
        };
        if guard.chunks.iter().any(|(k, _)| *k == chunk_idx)
            || guard.in_flight.contains_key(&chunk_idx)
        {
            return;
        }
        let (tx, rx) = watch::channel(None);
        guard.in_flight.insert(chunk_idx, rx);
        let in_flight_guard = InFlightGuard {
            chunk_idx,
            cache: Arc::clone(&self.cache),
            tx: Some(tx),
        };
        drop(guard);

        let ctx = self.clone();
        runtime.spawn(async move {
            let result = ctx.fetch_chunk_http(chunk_idx).await;
            in_flight_guard.complete(result);
        });
    }
}

/// Seekable HTTP range-window reader with read-ahead caching for immediate audio streaming and seeking.
pub struct RangeStreamReader {
    ctx: FetchContext,
    runtime: tokio::runtime::Handle,
    pos: u64,
}

impl RangeStreamReader {
    pub fn new(
        resolved: ResolvedAudioStream,
        runtime: tokio::runtime::Handle,
        cancel: PlaybackCancel,
    ) -> Self {
        Self {
            ctx: FetchContext {
                url: Arc::new(resolved.url),
                client: resolved.client,
                content_length: resolved.content_length,
                cancel,
                cache: Arc::new(Mutex::new(ChunkCache::new())),
            },
            runtime,
            pos: 0,
        }
    }
}

impl Read for RangeStreamReader {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        if buf.is_empty() {
            return Ok(0);
        }
        if self.ctx.cancel.is_cancelled() {
            return Err(io::Error::new(
                io::ErrorKind::Interrupted,
                "Playback cancelled",
            ));
        }
        if self.pos >= self.ctx.content_length {
            return Ok(0);
        }

        let chunk_idx = self.pos / CHUNK_SIZE;
        let offset = (self.pos % CHUNK_SIZE) as usize;
        let chunk = self
            .runtime
            .block_on(self.ctx.get_or_fetch_chunk(chunk_idx))?;

        self.ctx.spawn_prefetch(&self.runtime, chunk_idx + 1);

        if offset >= chunk.len() {
            return Ok(0);
        }

        let to_copy = (chunk.len() - offset).min(buf.len());
        buf[..to_copy].copy_from_slice(&chunk[offset..offset + to_copy]);
        self.pos += to_copy as u64;
        Ok(to_copy)
    }
}

impl Seek for RangeStreamReader {
    fn seek(&mut self, style: SeekFrom) -> io::Result<u64> {
        let new_pos: i64 = match style {
            SeekFrom::Start(offset) => i64::try_from(offset)
                .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "Seek offset overflow"))?,
            SeekFrom::Current(delta) => (self.pos as i64)
                .checked_add(delta)
                .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Seek overflow"))?,
            SeekFrom::End(delta) => (self.ctx.content_length as i64)
                .checked_add(delta)
                .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "Seek overflow"))?,
        };

        if new_pos < 0 {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Cannot seek before start of stream",
            ));
        }

        self.pos = new_pos as u64;
        Ok(self.pos)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rodio::{Decoder, Source};
    use std::time::Instant;

    #[test]
    fn test_parse_content_range_total() {
        assert_eq!(
            parse_content_range_total("bytes 0-0/1234567"),
            Some(1234567)
        );
        assert_eq!(parse_content_range_total("bytes 0-524287/999"), Some(999));
        assert_eq!(parse_content_range_total("invalid"), None);
    }

    #[tokio::test]
    async fn test_range_reader_seek_bounds() {
        let cancel = PlaybackCancel::new();
        let resolved = ResolvedAudioStream {
            url: "https://example.invalid/audio".to_string(),
            content_length: 1000,
            total_seconds: 10.0,
            client: reqwest::Client::new(),
        };
        let mut reader =
            RangeStreamReader::new(resolved, tokio::runtime::Handle::current(), cancel);

        assert_eq!(reader.seek(SeekFrom::Start(250)).unwrap(), 250);
        assert_eq!(reader.seek(SeekFrom::Current(-50)).unwrap(), 200);
        assert_eq!(reader.seek(SeekFrom::End(-100)).unwrap(), 900);
        assert!(reader.seek(SeekFrom::Start(0)).is_ok());
        assert!(reader.seek(SeekFrom::Current(-1)).is_err());
        assert!(reader.seek(SeekFrom::End(-1001)).is_err());
    }

    #[tokio::test]
    async fn test_resolve_and_decode_range_stream() {
        let t0 = Instant::now();
        let songs = crate::search::search_songs("location")
            .await
            .expect("search should succeed");
        assert!(!songs.is_empty());
        let search_elapsed = t0.elapsed();
        eprintln!(
            "[test] top result: '{}' by '{}' ({})",
            songs[0].title, songs[0].artist, songs[0].video_id
        );

        let t1 = Instant::now();
        let cancel = PlaybackCancel::new();
        let resolved = resolve_audio_stream(&songs[0].video_id, &cancel)
            .await
            .expect("stream should resolve");
        assert!(resolved.content_length > 0);
        let resolve_elapsed = t1.elapsed();

        let runtime = tokio::runtime::Handle::current();
        let playback_handle = tokio::runtime::Handle::current();
        let playback_cancel = cancel.clone();
        let (decode_elapsed, seek_elapsed, initial_count, seek_count) =
            tokio::task::spawn_blocking(move || {
                let t2 = Instant::now();
                let reader = RangeStreamReader::new(resolved, runtime, cancel);
                let mut source = Decoder::new_mp4(reader).expect("MP4 decoder should open");
                let decode_elapsed = t2.elapsed();

                let initial_samples: Vec<f32> = source.by_ref().take(2048).collect();
                let t3 = Instant::now();
                source
                    .try_seek(Duration::from_secs(10))
                    .expect("try_seek should succeed on RangeStreamReader");
                let seek_samples: Vec<f32> = source.by_ref().take(2048).collect();
                let seek_elapsed = t3.elapsed();

                (
                    decode_elapsed,
                    seek_elapsed,
                    initial_samples.len(),
                    seek_samples.len(),
                )
            })
            .await
            .unwrap();

        assert_eq!(initial_count, 2048);
        assert_eq!(seek_count, 2048);

        // Also test live sink playback if an audio output device is accessible in this session.
        let resolved_play = resolve_audio_stream(&songs[0].video_id, &playback_cancel)
            .await
            .expect("second stream resolve should succeed");
        match rodio::DeviceSinkBuilder::open_default_sink() {
            Ok(sink) => {
                let source = tokio::task::spawn_blocking(move || {
                    let reader =
                        RangeStreamReader::new(resolved_play, playback_handle, playback_cancel);
                    Decoder::new_mp4(reader).expect("MP4 decoder for sink should open")
                })
                .await
                .unwrap();

                let player = Arc::new(rodio::Player::connect_new(sink.mixer()));
                player.set_volume(0.4);
                player.append(source);
                player.play();
                tokio::time::sleep(Duration::from_millis(1200)).await;
                let pos_before_seek = player.get_pos();
                assert!(
                    pos_before_seek > Duration::from_millis(200),
                    "expected playback position to advance, got {pos_before_seek:?}"
                );
                let player_for_seek = Arc::clone(&player);
                tokio::task::spawn_blocking(move || {
                    player_for_seek
                        .try_seek(Duration::from_secs(15))
                        .expect("player try_seek should succeed");
                })
                .await
                .unwrap();
                tokio::time::sleep(Duration::from_millis(500)).await;
                let pos_after_seek = player.get_pos();
                assert!(
                    pos_after_seek >= Duration::from_secs(14),
                    "expected position >= 14s after seek, got {pos_after_seek:?}"
                );
                player.stop();
                eprintln!(
                    "[test] live audio played: pos_before_seek={pos_before_seek:?}, pos_after_seek={pos_after_seek:?}"
                );
            }
            Err(e) => {
                eprintln!(
                    "[test] audio sink unavailable in test env ({e:?}); PCM decode/seek verified"
                );
            }
        }

        eprintln!(
            "[test] search={:?}, resolve={:?}, decode_open={:?}, seek={:?}, total={:?}",
            search_elapsed,
            resolve_elapsed,
            decode_elapsed,
            seek_elapsed,
            t0.elapsed()
        );
    }
}
