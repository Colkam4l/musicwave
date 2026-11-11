use crate::search::SongResult;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

pub const MAX_RECENT_PLAYS: usize = 50;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Library {
    pub liked_songs: Vec<SongResult>,
    pub recent_plays: VecDeque<SongResult>,
}

static LIBRARY_CACHE: LazyLock<Mutex<Option<Library>>> = LazyLock::new(|| Mutex::new(None));

fn library_path(app_handle: &AppHandle) -> anyhow::Result<PathBuf> {
    let data_dir = app_handle.path().app_data_dir()?;
    Ok(data_dir.join("library.json"))
}

/// Loads `Library` from `path`, creating an empty default file if none exists yet.
pub fn load_library_from_path(path: &Path) -> Library {
    if !path.exists() {
        let default = Library::default();
        let _ = save_library_to_path(path, &default);
        return default;
    }

    match fs::read_to_string(path) {
        Ok(contents) => serde_json::from_str::<Library>(&contents).unwrap_or_default(),
        Err(err) => {
            eprintln!(
                "[musicwave library] Failed reading {}: {err}",
                path.display()
            );
            Library::default()
        }
    }
}

/// Atomically writes `library` as pretty-printed JSON using a temp file and rename.
pub fn save_library_to_path(path: &Path, library: &Library) -> anyhow::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let tmp_path = path.with_extension("json.tmp");
    let serialized = serde_json::to_string_pretty(library)?;
    fs::write(&tmp_path, serialized)?;
    fs::rename(&tmp_path, path)?;
    Ok(())
}

/// Loads `Library` for the app's data directory (`library.json`).
pub fn load_library(app_handle: &AppHandle) -> anyhow::Result<Library> {
    let path = library_path(app_handle)?;
    Ok(load_library_from_path(&path))
}

/// Saves `Library` to the app's data directory (`library.json`).
pub fn save_library(app_handle: &AppHandle, library: &Library) -> anyhow::Result<()> {
    let path = library_path(app_handle)?;
    save_library_to_path(&path, library)
}

fn like_song_in_memory(library: &mut Library, song: SongResult) {
    library
        .liked_songs
        .retain(|existing| existing.video_id != song.video_id);
    library.liked_songs.insert(0, song);
}

fn unlike_song_in_memory(library: &mut Library, video_id: &str) {
    library
        .liked_songs
        .retain(|existing| existing.video_id != video_id);
}

fn add_recent_in_memory(library: &mut Library, song: SongResult) {
    library
        .recent_plays
        .retain(|existing| existing.video_id != song.video_id);
    library.recent_plays.push_front(song);
    while library.recent_plays.len() > MAX_RECENT_PLAYS {
        library.recent_plays.pop_back();
    }
}

async fn with_library_mut<T>(
    app_handle: &AppHandle,
    mutate: impl FnOnce(&mut Library) -> T,
) -> anyhow::Result<T> {
    let path = library_path(app_handle)?;
    let mut guard = LIBRARY_CACHE.lock().await;
    if guard.is_none() {
        *guard = Some(load_library_from_path(&path));
    }
    let library = guard.as_mut().unwrap();
    let result = mutate(library);
    save_library_to_path(&path, library)?;
    Ok(result)
}

async fn with_library_read<T>(
    app_handle: &AppHandle,
    read: impl FnOnce(&Library) -> T,
) -> anyhow::Result<T> {
    let path = library_path(app_handle)?;
    let mut guard = LIBRARY_CACHE.lock().await;
    if guard.is_none() {
        *guard = Some(load_library_from_path(&path));
    }
    Ok(read(guard.as_ref().unwrap()))
}

pub async fn like_song(
    app_handle: &AppHandle,
    song: SongResult,
) -> anyhow::Result<Vec<SongResult>> {
    with_library_mut(app_handle, |lib| {
        like_song_in_memory(lib, song);
        lib.liked_songs.clone()
    })
    .await
}

pub async fn unlike_song(
    app_handle: &AppHandle,
    video_id: &str,
) -> anyhow::Result<Vec<SongResult>> {
    with_library_mut(app_handle, |lib| {
        unlike_song_in_memory(lib, video_id);
        lib.liked_songs.clone()
    })
    .await
}

pub async fn get_liked_songs(app_handle: &AppHandle) -> anyhow::Result<Vec<SongResult>> {
    with_library_read(app_handle, |lib| lib.liked_songs.clone()).await
}

pub async fn add_to_recents(
    app_handle: &AppHandle,
    song: SongResult,
) -> anyhow::Result<Vec<SongResult>> {
    with_library_mut(app_handle, |lib| {
        add_recent_in_memory(lib, song);
        lib.recent_plays.iter().cloned().collect()
    })
    .await
}

pub async fn get_recent_plays(app_handle: &AppHandle) -> anyhow::Result<Vec<SongResult>> {
    with_library_read(app_handle, |lib| lib.recent_plays.iter().cloned().collect()).await
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_song(id: &str) -> SongResult {
        SongResult {
            video_id: id.to_string(),
            title: format!("Title {id}"),
            artist: "Artist".to_string(),
            album: Some("Album".to_string()),
            duration: Some("3:10".to_string()),
            duration_seconds: Some(190),
            thumbnail_url: None,
        }
    }

    #[test]
    fn test_library_persistence_and_limits() {
        let dir = std::env::temp_dir().join(format!("musicwave_lib_test_{}", std::process::id()));
        let path = dir.join("library.json");
        let _ = fs::remove_dir_all(&dir);

        let mut lib = load_library_from_path(&path);
        assert!(path.exists());
        assert!(lib.liked_songs.is_empty());

        like_song_in_memory(&mut lib, sample_song("v1"));
        like_song_in_memory(&mut lib, sample_song("v2"));
        like_song_in_memory(&mut lib, sample_song("v1")); // deduplicates & moves to top
        assert_eq!(lib.liked_songs.len(), 2);
        assert_eq!(lib.liked_songs[0].video_id, "v1");

        unlike_song_in_memory(&mut lib, "v2");
        assert_eq!(lib.liked_songs.len(), 1);

        for i in 0..60 {
            add_recent_in_memory(&mut lib, sample_song(&format!("r{i}")));
        }
        assert_eq!(lib.recent_plays.len(), MAX_RECENT_PLAYS);
        assert_eq!(lib.recent_plays[0].video_id, "r59");

        save_library_to_path(&path, &lib).unwrap();
        let reloaded = load_library_from_path(&path);
        assert_eq!(reloaded.liked_songs.len(), 1);
        assert_eq!(reloaded.liked_songs[0].video_id, "v1");
        assert_eq!(reloaded.recent_plays.len(), MAX_RECENT_PLAYS);

        let _ = fs::remove_dir_all(&dir);
    }
}
