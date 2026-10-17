use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue, ORIGIN, REFERER, USER_AGENT};
use serde::Deserialize;
use std::sync::Arc;
use youtui_vendored_rusty_ytdl::{
    RequestOptions, Video, VideoOptions, VideoQuality, VideoSearchOptions, choose_format,
};

#[derive(Deserialize)]
struct HeadersConfig {
    #[serde(rename = "User-Agent")]
    user_agent: Option<String>,
    #[serde(rename = "Cookie")]
    cookie: Option<String>,
}

fn read_file_multi_path(filename: &str) -> Option<String> {
    for path in [
        filename.to_string(),
        format!("../{}", filename),
        format!("src-tauri/{}", filename),
    ] {
        if let Ok(content) = std::fs::read_to_string(&path) {
            return Some(content);
        }
    }
    None
}

pub fn load_auth_config() -> (Option<String>, Option<String>, Option<String>) {
    let mut cookie = None;
    let mut user_agent = None;
    let mut po_token = None;

    // Try loading headers.json
    if let Some(content) = read_file_multi_path("headers.json")
        && let Ok(config) = serde_json::from_str::<HeadersConfig>(&content)
    {
        cookie = config.cookie;
        user_agent = config.user_agent;
    }

    // Try loading po_token.txt
    if let Some(content) = read_file_multi_path("po_token.txt") {
        let trimmed = content.trim().to_string();
        if !trimmed.is_empty() {
            po_token = Some(trimmed);
        }
    }

    (cookie, user_agent, po_token)
}

pub async fn resolve_stream_url(
    video_id: &str,
    cookie: Option<String>,
    po_token: Option<String>,
) -> anyhow::Result<(String, f64, Client)> {
    let video_url = format!("https://www.youtube.com/watch?v={}", video_id);
    let (auth_cookie, user_agent, auth_po_token) = load_auth_config();
    let effective_cookie = cookie.or(auth_cookie);
    let effective_po_token = po_token.or(auth_po_token);

    let ua_string = user_agent.clone().unwrap_or_else(|| {
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string()
    });

    let mut extraction_headers = HeaderMap::new();
    extraction_headers.insert(USER_AGENT, HeaderValue::from_str(&ua_string)?);
    let extraction_client = Client::builder()
        .default_headers(extraction_headers)
        .build()?;

    let playback_ua = if user_agent.is_some() {
        ua_string.clone()
    } else {
        "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip".to_string()
    };

    let mut playback_headers = HeaderMap::new();
    playback_headers.insert(USER_AGENT, HeaderValue::from_str(&playback_ua)?);
    if user_agent.is_some() {
        playback_headers.insert(
            REFERER,
            HeaderValue::from_static("https://www.youtube.com/"),
        );
        playback_headers.insert(ORIGIN, HeaderValue::from_static("https://www.youtube.com"));
    }
    let playback_client = Client::builder()
        .default_headers(playback_headers)
        .build()?;

    let video_options = VideoOptions {
        quality: VideoQuality::Highest,
        filter: VideoSearchOptions::Custom(Arc::new(|f| {
            f.has_audio && !f.has_video && f.mime_type.container == "mp4"
        })),
        request_options: RequestOptions {
            client: Some(extraction_client),
            cookies: effective_cookie,
            po_token: effective_po_token,
            ..Default::default()
        },
        ..Default::default()
    };

    let video = Video::new_with_options(&video_url, &video_options)?;
    let video_info = video.get_info().await?;
    let total_seconds = video_info
        .video_details
        .length_seconds
        .parse::<f64>()
        .unwrap_or(0.0);
    let format = choose_format(&video_info.formats, &video_options)?;

    Ok((format.url, total_seconds, playback_client))
}
