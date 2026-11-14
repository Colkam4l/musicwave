use std::sync::LazyLock;

use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::sync::Mutex;
use ytmapi_rs::auth::noauth::NoAuthToken;
use ytmapi_rs::common::{VideoID, YoutubeID};
use ytmapi_rs::json::from_json;
use ytmapi_rs::query::search::{FilteredSearch, SongsFilter};
use ytmapi_rs::query::song::GetLyricsIDQuery;
use ytmapi_rs::query::{
    GetLyricsQuery, GetMoodCategoriesQuery, GetWatchPlaylistQuery, SearchQuery,
};
use ytmapi_rs::{Client as YtClient, YtMusic, YtMusicBuilder};

static YT_SEARCH_CLIENT: LazyLock<Mutex<Option<YtMusic<NoAuthToken>>>> =
    LazyLock::new(|| Mutex::new(None));

async fn build_unauthenticated_client() -> anyhow::Result<YtMusic<NoAuthToken>> {
    // Force HTTP/1.1 because YouTube Music resets HTTP/2 streams sent with ytmapi-rs's default UA.
    let reqwest_client = reqwest::Client::builder().http1_only().build()?;
    let yt_client = YtClient::new_from_reqwest_client(reqwest_client);
    let yt = YtMusicBuilder::new_with_client(yt_client).build().await?;
    Ok(yt)
}

async fn get_or_init_client() -> anyhow::Result<YtMusic<NoAuthToken>> {
    let mut guard = YT_SEARCH_CLIENT.lock().await;
    if let Some(yt) = guard.as_ref() {
        return Ok(yt.clone());
    }
    let yt = build_unauthenticated_client().await?;
    *guard = Some(yt.clone());
    Ok(yt)
}

async fn reset_cached_client() {
    *YT_SEARCH_CLIENT.lock().await = None;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SongResult {
    pub video_id: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub duration: Option<String>,
    pub duration_seconds: Option<u32>,
    pub thumbnail_url: Option<String>,
}

fn parse_duration_to_seconds(duration: &str) -> Option<u32> {
    let parts: Vec<&str> = duration.trim().split(':').collect();
    match parts.len() {
        1 => parts[0].parse::<u32>().ok(),
        2 => {
            let mins = parts[0].parse::<u32>().ok()?;
            let secs = parts[1].parse::<u32>().ok()?;
            Some(mins * 60 + secs)
        }
        3 => {
            let hours = parts[0].parse::<u32>().ok()?;
            let mins = parts[1].parse::<u32>().ok()?;
            let secs = parts[2].parse::<u32>().ok()?;
            Some(hours * 3600 + mins * 60 + secs)
        }
        _ => None,
    }
}

fn extract_flex_column_text(flex_col: &Value) -> String {
    flex_col
        .pointer("/musicResponsiveListItemFlexColumnRenderer/text/runs")
        .and_then(Value::as_array)
        .map(|runs| {
            runs.iter()
                .filter_map(|r| r.get("text").and_then(Value::as_str))
                .collect::<String>()
        })
        .unwrap_or_default()
}

fn is_play_count_segment(segment: &str) -> bool {
    let lower = segment.to_ascii_lowercase();
    lower.ends_with(" plays")
        || lower.ends_with(" play")
        || lower.ends_with(" views")
        || lower.ends_with(" view")
}

fn parse_subtitle_fields(subtitle: &str) -> (String, Option<String>, Option<String>, Option<u32>) {
    let mut parts: Vec<&str> = subtitle
        .split(" • ")
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .collect();

    if parts.len() >= 3 && matches!(parts[0], "Song" | "Video") {
        parts.remove(0);
    }

    if parts.last().is_some_and(|last| is_play_count_segment(last)) {
        parts.pop();
    }

    let (duration, duration_seconds) = match parts.last().copied() {
        Some(last) if last.contains(':') => match parse_duration_to_seconds(last) {
            Some(secs) => {
                parts.pop();
                (Some(last.to_string()), Some(secs))
            }
            None => (None, None),
        },
        _ => (None, None),
    };

    let artist = parts
        .first()
        .map(|s| (*s).to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "Unknown Artist".to_string());

    let album = if parts.len() >= 2 {
        parts
            .last()
            .map(|s| (*s).to_string())
            .filter(|s| !s.is_empty())
    } else {
        None
    };

    (artist, album, duration, duration_seconds)
}

fn parse_song_item(item: &Value) -> Option<SongResult> {
    let mrlir = item.get("musicResponsiveListItemRenderer")?;
    let flex_cols = mrlir.get("flexColumns")?.as_array()?;

    let title = flex_cols
        .first()
        .map(extract_flex_column_text)?
        .trim()
        .to_string();
    if title.is_empty() {
        return None;
    }

    let video_id = mrlir
        .pointer("/playlistItemData/videoId")
        .and_then(Value::as_str)
        .or_else(|| {
            flex_cols.first()?.pointer(
                "/musicResponsiveListItemFlexColumnRenderer/text/runs/0/navigationEndpoint/watchEndpoint/videoId",
            )
            .and_then(Value::as_str)
        })
        .or_else(|| {
            mrlir
                .pointer("/overlay/musicItemThumbnailOverlayRenderer/content/musicPlayButtonRenderer/playNavigationEndpoint/watchEndpoint/videoId")
                .and_then(Value::as_str)
        })?
        .trim()
        .to_string();
    if video_id.is_empty() {
        return None;
    }

    let subtitle = flex_cols
        .get(1)
        .map(extract_flex_column_text)
        .unwrap_or_default();
    let (artist, album, duration, duration_seconds) = parse_subtitle_fields(&subtitle);

    let thumbnail_url = mrlir
        .pointer("/thumbnail/musicThumbnailRenderer/thumbnail/thumbnails")
        .and_then(Value::as_array)
        .and_then(|arr| arr.last())
        .and_then(|t| t.get("url"))
        .and_then(Value::as_str)
        .map(ToString::to_string);

    Some(SongResult {
        video_id,
        title,
        artist,
        album,
        duration,
        duration_seconds,
        thumbnail_url,
    })
}

fn find_section_list_contents(root: &Value) -> Option<&Vec<Value>> {
    if let Some(tabs) = root
        .pointer("/contents/tabbedSearchResultsRenderer/tabs")
        .and_then(Value::as_array)
    {
        let selected_or_first = tabs
            .iter()
            .find(|t| {
                t.pointer("/tabRenderer/selected")
                    .and_then(Value::as_bool)
                    .unwrap_or(false)
            })
            .or_else(|| tabs.first())?;

        if let Some(arr) = selected_or_first
            .pointer("/tabRenderer/content/sectionListRenderer/contents")
            .and_then(Value::as_array)
        {
            return Some(arr);
        }
    }

    root.pointer("/contents/sectionListRenderer/contents")
        .and_then(Value::as_array)
}

/// Parses YouTube Music song search JSON tolerantly without failing the whole query on missing album links or extra subtitle fields.
fn parse_songs_from_response(root: &Value) -> Vec<SongResult> {
    let Some(sections) = find_section_list_contents(root) else {
        return Vec::new();
    };

    let mut results = Vec::new();
    for section in sections {
        let Some(items) = section
            .pointer("/musicShelfRenderer/contents")
            .and_then(Value::as_array)
        else {
            continue;
        };

        for item in items {
            if let Some(song) = parse_song_item(item) {
                results.push(song);
            }
        }
    }
    results
}

pub async fn search_songs(query: &str) -> anyhow::Result<Vec<SongResult>> {
    let yt = get_or_init_client().await?;
    let search_query: SearchQuery<'_, FilteredSearch<SongsFilter>> = SearchQuery::from(query);
    let json = match yt.json_query(search_query).await {
        Ok(json) => json,
        Err(_) => {
            reset_cached_client().await;
            let yt = get_or_init_client().await?;
            let retry_query: SearchQuery<'_, FilteredSearch<SongsFilter>> =
                SearchQuery::from(query);
            yt.json_query(retry_query).await?
        }
    };

    let root: Value = from_json(json)?;
    Ok(parse_songs_from_response(&root))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricLine {
    pub time: f64,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricsResponse {
    pub plain_lyrics: Option<String>,
    pub synced_lyrics: Option<Vec<LyricLine>>,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HomeShelf {
    pub id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub items: Vec<SongResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoodCategoryItem {
    pub title: String,
    pub params: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HomeShelves {
    pub quick_picks: HomeShelf,
    pub trending: HomeShelf,
    pub moods: Vec<MoodCategoryItem>,
}

fn parse_lrc_lyrics(lrc_text: &str) -> Vec<LyricLine> {
    static LRC_RE: LazyLock<Regex> =
        LazyLock::new(|| Regex::new(r"^\[(\d+):(\d+(?:\.\d+)?)\](.*)$").unwrap());

    let mut lines = Vec::new();
    for raw_line in lrc_text.lines() {
        let trimmed = raw_line.trim();
        if let Some(caps) = LRC_RE.captures(trimmed) {
            let minutes: f64 = caps[1].parse().unwrap_or(0.0);
            let seconds: f64 = caps[2].parse().unwrap_or(0.0);
            let text = caps[3].trim().to_string();
            let time = minutes * 60.0 + seconds;
            lines.push(LyricLine { time, text });
        }
    }
    lines
}

#[derive(Deserialize)]
struct LrclibResponse {
    #[serde(rename = "plainLyrics")]
    plain_lyrics: Option<String>,
    #[serde(rename = "syncedLyrics")]
    synced_lyrics: Option<String>,
}

async fn fetch_lrclib(title: &str, artist: &str, duration: Option<u32>) -> Option<LyricsResponse> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(4))
        .build()
        .ok()?;
    let mut query = vec![("track_name", title), ("artist_name", artist)];
    let dur_str = duration.map(|d| d.to_string());
    if let Some(ref d) = dur_str {
        query.push(("duration", d.as_str()));
    }

    let resp = client
        .get("https://lrclib.net/api/get")
        .query(&query)
        .header("User-Agent", "MusicWave/0.1.0")
        .send()
        .await
        .ok()?;

    if !resp.status().is_success() {
        return None;
    }

    let lrclib_data: LrclibResponse = resp.json().await.ok()?;
    let synced = lrclib_data.synced_lyrics.as_deref().map(parse_lrc_lyrics);

    if synced.as_ref().is_some_and(|s| !s.is_empty()) || lrclib_data.plain_lyrics.is_some() {
        Some(LyricsResponse {
            plain_lyrics: lrclib_data.plain_lyrics,
            synced_lyrics: synced,
            source: "lrclib".to_string(),
        })
    } else {
        None
    }
}

pub async fn get_lyrics(
    video_id: &str,
    title: Option<&str>,
    artist: Option<&str>,
    duration: Option<u32>,
) -> anyhow::Result<LyricsResponse> {
    if let (Some(t), Some(a)) = (title, artist)
        && let Some(lrc) = fetch_lrclib(t, a, duration).await
    {
        return Ok(lrc);
    }

    let yt = get_or_init_client().await?;
    let vid = VideoID::from_raw(video_id);
    let lyrics_id_query = GetLyricsIDQuery::new(vid);
    if let Ok(lyrics_id) = yt.query(lyrics_id_query).await {
        let lyrics_query = GetLyricsQuery::new(lyrics_id);
        if let Ok(lyrics) = yt.query(lyrics_query).await {
            return Ok(LyricsResponse {
                plain_lyrics: Some(lyrics.lyrics),
                synced_lyrics: None,
                source: "ytmusic".to_string(),
            });
        }
    }

    Ok(LyricsResponse {
        plain_lyrics: None,
        synced_lyrics: None,
        source: "none".to_string(),
    })
}

pub async fn get_watch_playlist(video_id: &str) -> anyhow::Result<Vec<SongResult>> {
    let yt = get_or_init_client().await?;
    let vid = VideoID::from_raw(video_id);
    let query = GetWatchPlaylistQuery::new_from_video_id(vid);
    let tracks = match yt.query(query).await {
        Ok(t) => t,
        Err(_) => {
            reset_cached_client().await;
            let yt = get_or_init_client().await?;
            let vid = VideoID::from_raw(video_id);
            let query = GetWatchPlaylistQuery::new_from_video_id(vid);
            yt.query(query).await?
        }
    };

    let songs = tracks
        .into_iter()
        .map(|t| {
            let duration_seconds = parse_duration_to_seconds(&t.duration);
            let thumbnail_url = t.thumbnails.last().map(|thumb| thumb.url.clone());
            SongResult {
                video_id: t.video_id.get_raw().to_string(),
                title: t.title,
                artist: t.author,
                album: None,
                duration: Some(t.duration),
                duration_seconds,
                thumbnail_url,
            }
        })
        .collect();

    Ok(songs)
}

pub async fn get_home_shelves() -> anyhow::Result<HomeShelves> {
    let trending_songs = search_songs("Trending hits").await.unwrap_or_default();
    let quick_picks_songs = search_songs("Top Global Hits").await.unwrap_or_default();

    let mut moods = Vec::new();
    if let Ok(yt) = get_or_init_client().await
        && let Ok(sections) = yt.query(GetMoodCategoriesQuery).await
    {
        for section in sections {
            for mood in section.mood_categories {
                moods.push(MoodCategoryItem {
                    title: mood.title,
                    params: mood.params.get_raw().to_string(),
                });
            }
        }
    }

    if moods.is_empty() {
        let fallback_names = [
            "Chill",
            "Workout",
            "Focus",
            "Party",
            "Pop",
            "Hip-Hop",
            "Rock",
            "R&B",
            "Electronic",
            "Indie",
        ];
        for name in fallback_names {
            moods.push(MoodCategoryItem {
                title: name.to_string(),
                params: String::new(),
            });
        }
    }

    Ok(HomeShelves {
        quick_picks: HomeShelf {
            id: "quick-picks".to_string(),
            title: "Quick Picks".to_string(),
            subtitle: Some("Popular music to get you started".to_string()),
            items: quick_picks_songs.into_iter().take(12).collect(),
        },
        trending: HomeShelf {
            id: "trending".to_string(),
            title: "Trending Charts".to_string(),
            subtitle: Some("What everyone is listening to".to_string()),
            items: trending_songs.into_iter().take(12).collect(),
        },
        moods,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_duration() {
        assert_eq!(parse_duration_to_seconds("3:45"), Some(225));
        assert_eq!(parse_duration_to_seconds("1:02:30"), Some(3750));
        assert_eq!(parse_duration_to_seconds("45"), Some(45));
    }

    #[test]
    fn test_parse_subtitle_variants() {
        assert_eq!(
            parse_subtitle_fields("Dave & Burna Boy • PSYCHODRAMA • 4:02"),
            (
                "Dave & Burna Boy".to_string(),
                Some("PSYCHODRAMA".to_string()),
                Some("4:02".to_string()),
                Some(242)
            )
        );
        assert_eq!(
            parse_subtitle_fields("Song • Khalid • American Teen • 3:40 • 1.2B plays"),
            (
                "Khalid".to_string(),
                Some("American Teen".to_string()),
                Some("3:40".to_string()),
                Some(220)
            )
        );
        assert_eq!(
            parse_subtitle_fields("Artist Only • 2:15"),
            (
                "Artist Only".to_string(),
                None,
                Some("2:15".to_string()),
                Some(135)
            )
        );
    }

    #[tokio::test]
    async fn test_search_songs() {
        let results = search_songs("alibi banks").await;
        assert!(results.is_ok(), "alibi banks search failed: {results:?}");
        let list = results.unwrap();
        assert!(!list.is_empty());
        let first = &list[0];
        assert!(!first.video_id.is_empty());
        assert!(!first.title.is_empty());

        let loc_results = search_songs("location").await;
        assert!(
            loc_results.is_ok(),
            "location search failed: {loc_results:?}"
        );
        let loc_list = loc_results.unwrap();
        assert!(
            loc_list.len() >= 10,
            "expected >=10 results, got {}",
            loc_list.len()
        );
        assert!(!loc_list[0].video_id.is_empty());
        assert!(!loc_list[0].artist.is_empty());
    }
}
