use ytmapi_rs::query::search::{FilteredSearch, SongsFilter};
use ytmapi_rs::query::SearchQuery;
use ytmapi_rs::common::YoutubeID;
use ytmapi_rs::YtMusic;
use youtui_vendored_rusty_ytdl::{Video, VideoOptions, VideoSearchOptions, VideoQuality, RequestOptions, choose_format};
use reqwest::header::{HeaderMap, USER_AGENT, HeaderValue};
use reqwest::Client;

use stream_download::storage::temp::TempStorageProvider;
use stream_download::http::HttpStream;
use stream_download::{Settings, StreamDownload};
use std::io::BufReader;
use std::fs::File;
use std::io::Read;
use serde::Deserialize;
use rodio::{Decoder, DeviceSinkBuilder, Player};

#[derive(Deserialize)]
struct HeadersConfig {
    #[serde(rename = "User-Agent")]
    user_agent: Option<String>,
    #[serde(rename = "Cookie")]
    cookie: Option<String>,
}

fn load_auth_config() -> (Option<String>, Option<String>, Option<String>) {
    let mut cookie = None;
    let mut user_agent = None;
    let mut po_token = None;

    // Try loading headers.json
    if let Ok(mut file) = File::open("headers.json") {
        let mut content = String::new();
        if file.read_to_string(&mut content).is_ok() {
            if let Ok(config) = serde_json::from_str::<HeadersConfig>(&content) {
                cookie = config.cookie;
                user_agent = config.user_agent;
            }
        }
    }

    // Try loading po_token.txt
    if let Ok(mut file) = File::open("po_token.txt") {
        let mut content = String::new();
        if file.read_to_string(&mut content).is_ok() {
            let trimmed = content.trim().to_string();
            if !trimmed.is_empty() {
                po_token = Some(trimmed);
            }
        }
    }

    (cookie, user_agent, po_token)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let yt = YtMusic::new_unauthenticated().await?;
    let query: SearchQuery<'_, FilteredSearch<SongsFilter>> = SearchQuery::from("Coldplay Yellow");
    let songs = yt.query(query).await?;
    
    if let Some(song) = songs.first() {
        let video_id = song.video_id.get_raw();
        println!("Found song: {} by {} (ID: {})", song.title, song.artist, video_id);
        
        let video_url = format!("https://www.youtube.com/watch?v={}", video_id);
        println!("Extracting stream URL from {}...", video_url);
        
        let (cookie, user_agent, po_token) = load_auth_config();

        // Build custom reqwest Client for extraction (with custom or modern User-Agent)
        let ua_string = user_agent.clone().unwrap_or_else(|| {
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string()
        });
        
        let mut extraction_headers = HeaderMap::new();
        extraction_headers.insert(
            USER_AGENT,
            HeaderValue::from_str(&ua_string)?
        );
        let extraction_client = Client::builder()
            .default_headers(extraction_headers)
            .build()?;

        // Build custom reqwest Client for playback (matching either the custom browser UA or the logical Android client User-Agent)
        let playback_ua = if user_agent.is_some() {
            ua_string.clone()
        } else {
            "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip".to_string()
        };

        let mut playback_headers = HeaderMap::new();
        playback_headers.insert(
            USER_AGENT,
            HeaderValue::from_str(&playback_ua)?
        );
        // If they provided browser cookies, pass Referer and Origin for browser compatibility
        if user_agent.is_some() {
            playback_headers.insert(
                reqwest::header::REFERER,
                HeaderValue::from_static("https://www.youtube.com/")
            );
            playback_headers.insert(
                reqwest::header::ORIGIN,
                HeaderValue::from_static("https://www.youtube.com")
            );
        }
        let playback_client = Client::builder()
            .default_headers(playback_headers)
            .build()?;

        let video_options = VideoOptions {
            quality: VideoQuality::Highest,
            filter: VideoSearchOptions::Custom(std::sync::Arc::new(|f| {
                f.has_audio && !f.has_video && f.mime_type.container == "mp4"
            })),
            request_options: RequestOptions {
                client: Some(extraction_client),
                cookies: cookie,
                po_token,
                ..Default::default()
            },
            ..Default::default()
        };
        
        let video = Video::new_with_options(&video_url, &video_options)?;
        let video_info = video.get_info().await?;
        
        let format = choose_format(&video_info.formats, &video_options)?;
        println!("Resolved Stream URL. Initializing stream-download...");
        
        let stream_url = format.url.parse()?;
        let stream = HttpStream::new(
            playback_client,
            stream_url,
        )
        .await?;

        let reader = StreamDownload::from_stream(
            stream,
            TempStorageProvider::new(),
            Settings::default(),
        )
        .await?;
        
        println!("Audio buffer initialized. Initializing rodio (v0.22) output...");
        let device_sink = DeviceSinkBuilder::open_default_sink()
            .map_err(|e| anyhow::anyhow!("Failed to open default audio device: {:?}", e))?;
        let player = Player::connect_new(device_sink.mixer());
        
        let source = Decoder::new_mp4(BufReader::new(reader))?;
        player.append(source);
        
        println!("Playing '{}' by {}... Press Ctrl+C to stop.", song.title, song.artist);
        
        // Block main thread until the song is finished playing
        player.sleep_until_end();
    } else {
        println!("No songs found!");
    }
    
    Ok(())
}
