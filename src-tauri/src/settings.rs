use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{LazyLock, RwLock};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub cookie: Option<String>,
    pub user_agent: Option<String>,
    pub po_token: Option<String>,
}

#[derive(Deserialize)]
struct LegacyHeadersConfig {
    #[serde(rename = "User-Agent")]
    user_agent: Option<String>,
    #[serde(rename = "Cookie")]
    cookie: Option<String>,
}

static SETTINGS_CACHE: LazyLock<RwLock<Option<Settings>>> = LazyLock::new(|| RwLock::new(None));

fn normalize_opt(value: Option<String>) -> Option<String> {
    value.and_then(|raw| {
        let trimmed = raw.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

impl Settings {
    /// Trims fields and converts empty/whitespace-only strings to `None`.
    pub fn normalized(self) -> Self {
        Self {
            cookie: normalize_opt(self.cookie),
            user_agent: normalize_opt(self.user_agent),
            po_token: normalize_opt(self.po_token),
        }
    }

    pub fn has_any_auth(&self) -> bool {
        self.cookie.is_some() || self.user_agent.is_some() || self.po_token.is_some()
    }
}

fn settings_path(app_handle: &AppHandle) -> anyhow::Result<PathBuf> {
    let data_dir = app_handle.path().app_data_dir()?;
    Ok(data_dir.join("settings.json"))
}

fn default_legacy_search_dirs() -> Vec<PathBuf> {
    vec![
        PathBuf::from("."),
        PathBuf::from(".."),
        PathBuf::from("src-tauri"),
    ]
}

fn read_first_existing(dirs: &[PathBuf], filename: &str) -> Option<String> {
    for dir in dirs {
        let candidate = dir.join(filename);
        if let Ok(content) = fs::read_to_string(&candidate) {
            return Some(content);
        }
    }
    None
}

/// Reads legacy `headers.json` and `po_token.txt` from `search_dirs`.
/// Returns `(settings, found_headers_json)`.
pub fn read_legacy_auth_from_dirs(search_dirs: &[PathBuf]) -> (Settings, bool) {
    let mut settings = Settings::default();
    let mut found_headers_json = false;

    if let Some(content) = read_first_existing(search_dirs, "headers.json")
        && let Ok(parsed) = serde_json::from_str::<LegacyHeadersConfig>(&content)
    {
        found_headers_json = true;
        settings.cookie = parsed.cookie;
        settings.user_agent = parsed.user_agent;
    }

    if let Some(content) = read_first_existing(search_dirs, "po_token.txt") {
        settings.po_token = Some(content);
    }

    (settings.normalized(), found_headers_json)
}

/// Atomically writes `settings` as pretty-printed JSON using a temp file and rename.
pub fn save_settings_to_path(path: &Path, settings: &Settings) -> anyhow::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let clean = settings.clone().normalized();
    let tmp_path = path.with_extension("json.tmp");
    let serialized = serde_json::to_string_pretty(&clean)?;
    fs::write(&tmp_path, serialized)?;
    fs::rename(&tmp_path, path)?;
    Ok(())
}

/// Loads `Settings` from `path`, migrating legacy `headers.json` / `po_token.txt` if needed.
pub fn load_settings_from_path(path: &Path, legacy_search_dirs: &[PathBuf]) -> Settings {
    if path.exists() {
        return match fs::read_to_string(path) {
            Ok(contents) => serde_json::from_str::<Settings>(&contents)
                .map(Settings::normalized)
                .unwrap_or_default(),
            Err(err) => {
                eprintln!(
                    "[musicwave settings] Failed reading {}: {err}",
                    path.display()
                );
                Settings::default()
            }
        };
    }

    let (migrated, found_headers) = read_legacy_auth_from_dirs(legacy_search_dirs);
    if migrated.has_any_auth() {
        if let Err(err) = save_settings_to_path(path, &migrated) {
            eprintln!("[musicwave settings] Failed saving migrated settings: {err}");
        } else if found_headers {
            eprintln!(
                "[musicwave settings] Migrated auth from headers.json to settings.json. You can delete headers.json."
            );
        }
        return migrated;
    }

    let default = Settings::default();
    let _ = save_settings_to_path(path, &default);
    default
}

fn update_cache(settings: &Settings) {
    if let Ok(mut guard) = SETTINGS_CACHE.write() {
        *guard = Some(settings.clone());
    }
}

/// Loads `Settings` from `app_data_dir()/settings.json` (with one-time legacy migration)
/// and updates the in-memory auth cache.
pub fn load_settings(app_handle: &AppHandle) -> anyhow::Result<Settings> {
    if let Ok(guard) = SETTINGS_CACHE.read()
        && let Some(cached) = guard.as_ref()
    {
        return Ok(cached.clone());
    }

    let path = settings_path(app_handle)?;
    let loaded = load_settings_from_path(&path, &default_legacy_search_dirs());
    update_cache(&loaded);
    Ok(loaded)
}

/// Saves `settings` to `app_data_dir()/settings.json` and immediately updates the in-memory cache.
pub fn save_settings(app_handle: &AppHandle, settings: Settings) -> anyhow::Result<Settings> {
    let clean = settings.normalized();
    let path = settings_path(app_handle)?;
    save_settings_to_path(&path, &clean)?;
    update_cache(&clean);
    Ok(clean)
}

/// Returns `(cookie, user_agent, po_token)` from persisted settings (if `app_handle` is given),
/// cached settings, or legacy file fallback for standalone/unit-test execution.
pub fn active_auth_tuple(
    app_handle: Option<&AppHandle>,
) -> (Option<String>, Option<String>, Option<String>) {
    if let Some(handle) = app_handle
        && let Ok(s) = load_settings(handle)
    {
        return (s.cookie, s.user_agent, s.po_token);
    }

    if let Ok(guard) = SETTINGS_CACHE.read()
        && let Some(s) = guard.as_ref()
    {
        return (s.cookie.clone(), s.user_agent.clone(), s.po_token.clone());
    }

    let (legacy, _) = read_legacy_auth_from_dirs(&default_legacy_search_dirs());
    (legacy.cookie, legacy.user_agent, legacy.po_token)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_dir(name: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("musicwave_settings_test_{name}_{nanos}"));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn test_save_and_load_settings_roundtrip() {
        let dir = unique_temp_dir("roundtrip");
        let path = dir.join("settings.json");

        let input = Settings {
            cookie: Some("  SAPISID=abc; SID=xyz  ".to_string()),
            user_agent: Some("CustomUA/1.0".to_string()),
            po_token: Some("  token_123 \n".to_string()),
        };

        save_settings_to_path(&path, &input).unwrap();
        let loaded = load_settings_from_path(&path, &[]);

        assert_eq!(
            loaded,
            Settings {
                cookie: Some("SAPISID=abc; SID=xyz".to_string()),
                user_agent: Some("CustomUA/1.0".to_string()),
                po_token: Some("token_123".to_string()),
            }
        );

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_migration_from_headers_and_po_token() {
        let dir = unique_temp_dir("migrate");
        let legacy_dir = dir.join("legacy");
        fs::create_dir_all(&legacy_dir).unwrap();

        fs::write(
            legacy_dir.join("headers.json"),
            r#"{"User-Agent": "Mozilla/5.0 Test", "Cookie": "SID=legacy"}"#,
        )
        .unwrap();
        fs::write(legacy_dir.join("po_token.txt"), "legacy_po_tok\n").unwrap();

        let settings_path = dir.join("data").join("settings.json");
        let loaded = load_settings_from_path(&settings_path, &[legacy_dir]);

        assert!(settings_path.exists());
        assert_eq!(loaded.cookie.as_deref(), Some("SID=legacy"));
        assert_eq!(loaded.user_agent.as_deref(), Some("Mozilla/5.0 Test"));
        assert_eq!(loaded.po_token.as_deref(), Some("legacy_po_tok"));

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_empty_fields_normalized_to_none() {
        let s = Settings {
            cookie: Some("   \t  ".to_string()),
            user_agent: Some(String::new()),
            po_token: Some("valid".to_string()),
        }
        .normalized();

        assert_eq!(s.cookie, None);
        assert_eq!(s.user_agent, None);
        assert_eq!(s.po_token.as_deref(), Some("valid"));
    }
}
