use serde::{Deserialize, Serialize};
use ytmapi_rs::YtMusic;
use ytmapi_rs::common::YoutubeID;
use ytmapi_rs::query::SearchQuery;
use ytmapi_rs::query::search::{FilteredSearch, SongsFilter};

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

pub async fn search_songs(query: &str) -> anyhow::Result<Vec<SongResult>> {
    let yt = YtMusic::new_unauthenticated().await?;
    let search_query: SearchQuery<'_, FilteredSearch<SongsFilter>> = SearchQuery::from(query);
    let songs = yt.query(search_query).await?;

    let results = songs
        .into_iter()
        .map(|song| {
            let duration_str = if song.duration.is_empty() {
                None
            } else {
                Some(song.duration)
            };
            let duration_seconds = duration_str.as_deref().and_then(parse_duration_to_seconds);
            let thumbnail_url = song.thumbnails.last().map(|t| t.url.clone());
            let album = song.album.map(|a| a.name);

            SongResult {
                video_id: song.video_id.get_raw().to_string(),
                title: song.title,
                artist: song.artist,
                album,
                duration: duration_str,
                duration_seconds,
                thumbnail_url,
            }
        })
        .collect();

    Ok(results)
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

    #[tokio::test]
    async fn test_search_songs() {
        let results = search_songs("Coldplay Yellow").await;
        assert!(results.is_ok());
        let list = results.unwrap();
        assert!(!list.is_empty());
        let first = &list[0];
        assert!(!first.video_id.is_empty());
        assert!(!first.title.is_empty());
    }
}
