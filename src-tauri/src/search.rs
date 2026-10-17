use serde::{Deserialize, Serialize};
use ytmapi_rs::YtMusic;
use ytmapi_rs::common::YoutubeID;
use ytmapi_rs::query::SearchQuery;
use ytmapi_rs::query::search::{FilteredSearch, SongsFilter};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongResult {
    pub video_id: String,
    pub title: String,
    pub artist: String,
}

pub async fn search_songs(query: &str) -> anyhow::Result<Vec<SongResult>> {
    let yt = YtMusic::new_unauthenticated().await?;
    let search_query: SearchQuery<'_, FilteredSearch<SongsFilter>> = SearchQuery::from(query);
    let songs = yt.query(search_query).await?;

    let results = songs
        .into_iter()
        .map(|song| SongResult {
            video_id: song.video_id.get_raw().to_string(),
            title: song.title,
            artist: song.artist,
        })
        .collect();

    Ok(results)
}
