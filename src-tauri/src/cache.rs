use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CacheStats {
    pub total_bytes: u64,
    pub track_count: usize,
    pub cached_video_ids: Vec<String>,
}

pub fn get_cache_dir(app_handle: &AppHandle) -> anyhow::Result<PathBuf> {
    let data_dir = app_handle.path().app_data_dir()?;
    let cache_dir = data_dir.join("cache").join("tracks");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir)?;
    }
    Ok(cache_dir)
}

pub fn sanitize_video_id(video_id: &str) -> String {
    video_id
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .collect()
}

pub fn get_cached_track_path(app_handle: &AppHandle, video_id: &str) -> Option<PathBuf> {
    let clean_id = sanitize_video_id(video_id);
    if clean_id.is_empty() {
        return None;
    }
    let cache_dir = get_cache_dir(app_handle).ok()?;
    let path = cache_dir.join(format!("{}.mp4", clean_id));
    if path.is_file()
        && let Ok(meta) = fs::metadata(&path)
        && meta.len() > 0
    {
        return Some(path);
    }
    None
}

pub fn is_track_cached(app_handle: &AppHandle, video_id: &str) -> bool {
    get_cached_track_path(app_handle, video_id).is_some()
}

pub fn list_cached_video_ids(app_handle: &AppHandle) -> Vec<String> {
    let Ok(cache_dir) = get_cache_dir(app_handle) else {
        return Vec::new();
    };

    let mut ids = Vec::new();
    if let Ok(entries) = fs::read_dir(cache_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file()
                && path.extension().and_then(|s| s.to_str()) == Some("mp4")
                && let Some(stem) = path.file_stem().and_then(|s| s.to_str())
            {
                ids.push(stem.to_string());
            }
        }
    }
    ids
}

pub fn get_cache_stats(app_handle: &AppHandle) -> anyhow::Result<CacheStats> {
    let cache_dir = get_cache_dir(app_handle)?;
    let mut total_bytes = 0u64;
    let mut cached_video_ids = Vec::new();

    if let Ok(entries) = fs::read_dir(cache_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file()
                && path.extension().and_then(|s| s.to_str()) == Some("mp4")
                && let Ok(meta) = entry.metadata()
            {
                total_bytes += meta.len();
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    cached_video_ids.push(stem.to_string());
                }
            }
        }
    }

    Ok(CacheStats {
        total_bytes,
        track_count: cached_video_ids.len(),
        cached_video_ids,
    })
}

pub fn clear_cache(app_handle: &AppHandle) -> anyhow::Result<()> {
    let cache_dir = get_cache_dir(app_handle)?;
    if cache_dir.exists()
        && let Ok(entries) = fs::read_dir(&cache_dir)
    {
        for entry in entries.flatten() {
            let _ = fs::remove_file(entry.path());
        }
    }
    Ok(())
}

pub fn delete_cached_track(app_handle: &AppHandle, video_id: &str) -> anyhow::Result<()> {
    let clean_id = sanitize_video_id(video_id);
    let cache_dir = get_cache_dir(app_handle)?;
    let path = cache_dir.join(format!("{}.mp4", clean_id));
    if path.exists() {
        fs::remove_file(path)?;
    }
    Ok(())
}

pub async fn download_track_for_offline(
    app_handle: &AppHandle,
    video_id: &str,
) -> anyhow::Result<PathBuf> {
    let clean_id = sanitize_video_id(video_id);
    if clean_id.is_empty() {
        anyhow::bail!("Invalid video ID for offline download");
    }

    let cache_dir = get_cache_dir(app_handle)?;
    let final_path = cache_dir.join(format!("{}.mp4", clean_id));
    if final_path.is_file()
        && fs::metadata(&final_path)
            .map(|m| m.len() > 0)
            .unwrap_or(false)
    {
        return Ok(final_path);
    }

    let cancel = crate::stream::PlaybackCancel::new();
    let resolved =
        crate::stream::resolve_audio_stream_with_app(&clean_id, &cancel, Some(app_handle)).await?;

    let tmp_path = cache_dir.join(format!("{}.mp4.tmp", clean_id));
    let mut file = fs::File::create(&tmp_path)?;

    let mut resp = resolved.client.get(&resolved.url).send().await?;
    if !resp.status().is_success() {
        let _ = fs::remove_file(&tmp_path);
        anyhow::bail!("Failed downloading stream: HTTP {}", resp.status());
    }

    while let Some(chunk) = resp.chunk().await? {
        file.write_all(&chunk)?;
    }
    file.flush()?;
    drop(file);

    fs::rename(&tmp_path, &final_path)?;
    eprintln!(
        "[musicwave cache] Successfully cached offline track: {}",
        final_path.display()
    );

    Ok(final_path)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_video_id() {
        assert_eq!(sanitize_video_id("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
        assert_eq!(sanitize_video_id("../../bad/id?foo=bar"), "badidfoobar");
        assert_eq!(sanitize_video_id("a_b-c123"), "a_b-c123");
    }
}
