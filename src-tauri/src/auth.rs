use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;
use std::time::SystemTime;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum AuthType {
    Cookie,
    OAuth,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LinkedYtAccount {
    pub account_name: String,
    pub channel_handle: Option<String>,
    pub avatar_url: Option<String>,
    pub auth_type: AuthType,
    pub synced_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub created_at: u64,
    pub linked_account: Option<LinkedYtAccount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfilesState {
    pub active_profile_id: String,
    pub profiles: Vec<UserProfile>,
}

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn generate_profile_id() -> String {
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("prof_{:x}", now)
}

fn create_default_profile() -> (UserProfile, ProfilesState) {
    let profile = UserProfile {
        id: "prof_default".to_string(),
        display_name: "Local User".to_string(),
        avatar_url: None,
        created_at: current_timestamp(),
        linked_account: None,
    };
    let state = ProfilesState {
        active_profile_id: profile.id.clone(),
        profiles: vec![profile.clone()],
    };
    (profile, state)
}

static PROFILES_CACHE: LazyLock<Mutex<Option<ProfilesState>>> = LazyLock::new(|| Mutex::new(None));

fn profiles_path(app_handle: &AppHandle) -> anyhow::Result<PathBuf> {
    let data_dir = app_handle.path().app_data_dir()?;
    Ok(data_dir.join("profiles.json"))
}

pub fn load_profiles_from_path(path: &Path) -> ProfilesState {
    if !path.exists() {
        let (_, default_state) = create_default_profile();
        let _ = save_profiles_to_path(path, &default_state);
        return default_state;
    }

    match fs::read_to_string(path) {
        Ok(contents) => match serde_json::from_str::<ProfilesState>(&contents) {
            Ok(state) => {
                if state.profiles.is_empty() {
                    let (_, default_state) = create_default_profile();
                    let _ = save_profiles_to_path(path, &default_state);
                    default_state
                } else {
                    state
                }
            }
            Err(err) => {
                eprintln!("[musicwave auth] Failed parsing {}: {err}", path.display());
                let (_, default_state) = create_default_profile();
                default_state
            }
        },
        Err(err) => {
            eprintln!("[musicwave auth] Failed reading {}: {err}", path.display());
            let (_, default_state) = create_default_profile();
            default_state
        }
    }
}

pub fn save_profiles_to_path(path: &Path, state: &ProfilesState) -> anyhow::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let tmp_path = path.with_extension("json.tmp");
    let serialized = serde_json::to_string_pretty(state)?;
    fs::write(&tmp_path, serialized)?;
    fs::rename(&tmp_path, path)?;
    Ok(())
}

pub async fn get_profiles_state(app_handle: &AppHandle) -> anyhow::Result<ProfilesState> {
    let mut guard = PROFILES_CACHE.lock().await;
    if let Some(ref state) = *guard {
        return Ok(state.clone());
    }
    let path = profiles_path(app_handle)?;
    let state = load_profiles_from_path(&path);
    *guard = Some(state.clone());
    Ok(state)
}

pub async fn save_profiles_state(
    app_handle: &AppHandle,
    state: &ProfilesState,
) -> anyhow::Result<()> {
    let path = profiles_path(app_handle)?;
    save_profiles_to_path(&path, state)?;
    let mut guard = PROFILES_CACHE.lock().await;
    *guard = Some(state.clone());
    Ok(())
}

pub async fn get_active_profile(app_handle: &AppHandle) -> anyhow::Result<UserProfile> {
    let state = get_profiles_state(app_handle).await?;
    state
        .profiles
        .iter()
        .find(|p| p.id == state.active_profile_id)
        .cloned()
        .or_else(|| state.profiles.first().cloned())
        .ok_or_else(|| anyhow::anyhow!("No profiles found"))
}

pub async fn create_profile(
    app_handle: &AppHandle,
    display_name: String,
    avatar_url: Option<String>,
) -> anyhow::Result<UserProfile> {
    let clean_name = display_name.trim();
    if clean_name.is_empty() {
        anyhow::bail!("Profile display name cannot be empty");
    }

    let mut state = get_profiles_state(app_handle).await?;
    let new_profile = UserProfile {
        id: generate_profile_id(),
        display_name: clean_name.to_string(),
        avatar_url: avatar_url.and_then(|u| {
            let t = u.trim();
            if t.is_empty() {
                None
            } else {
                Some(t.to_string())
            }
        }),
        created_at: current_timestamp(),
        linked_account: None,
    };

    state.profiles.push(new_profile.clone());
    state.active_profile_id = new_profile.id.clone();
    save_profiles_state(app_handle, &state).await?;

    Ok(new_profile)
}

pub async fn switch_profile(
    app_handle: &AppHandle,
    profile_id: &str,
) -> anyhow::Result<UserProfile> {
    let mut state = get_profiles_state(app_handle).await?;
    let target = state
        .profiles
        .iter()
        .find(|p| p.id == profile_id)
        .cloned()
        .ok_or_else(|| anyhow::anyhow!("Profile not found: {}", profile_id))?;

    state.active_profile_id = target.id.clone();
    save_profiles_state(app_handle, &state).await?;

    Ok(target)
}

pub async fn delete_profile(
    app_handle: &AppHandle,
    profile_id: &str,
) -> anyhow::Result<UserProfile> {
    let mut state = get_profiles_state(app_handle).await?;
    if state.profiles.len() <= 1 {
        anyhow::bail!("Cannot delete the only existing profile");
    }

    let idx = state
        .profiles
        .iter()
        .position(|p| p.id == profile_id)
        .ok_or_else(|| anyhow::anyhow!("Profile not found: {}", profile_id))?;

    let removed = state.profiles.remove(idx);
    if state.active_profile_id == profile_id {
        state.active_profile_id = state.profiles[0].id.clone();
    }
    save_profiles_state(app_handle, &state).await?;

    Ok(removed)
}

pub async fn list_profiles(app_handle: &AppHandle) -> anyhow::Result<Vec<UserProfile>> {
    let state = get_profiles_state(app_handle).await?;
    Ok(state.profiles)
}

pub async fn update_active_linked_account(
    app_handle: &AppHandle,
    linked: Option<LinkedYtAccount>,
) -> anyhow::Result<UserProfile> {
    let mut state = get_profiles_state(app_handle).await?;
    let active_id = state.active_profile_id.clone();

    let profile = state
        .profiles
        .iter_mut()
        .find(|p| p.id == active_id)
        .ok_or_else(|| anyhow::anyhow!("Active profile not found"))?;

    profile.linked_account = linked;
    let updated = profile.clone();
    save_profiles_state(app_handle, &state).await?;

    Ok(updated)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_profile_state_roundtrip() {
        let temp_dir = std::env::temp_dir().join(format!("mw_test_auth_{}", current_timestamp()));
        let _ = fs::create_dir_all(&temp_dir);
        let path = temp_dir.join("profiles.json");

        let state = load_profiles_from_path(&path);
        assert_eq!(state.profiles.len(), 1);
        assert_eq!(state.profiles[0].display_name, "Local User");

        let mut updated = state.clone();
        let p2 = UserProfile {
            id: "prof_custom".to_string(),
            display_name: "Alice".to_string(),
            avatar_url: None,
            created_at: 12345,
            linked_account: None,
        };
        updated.profiles.push(p2);
        updated.active_profile_id = "prof_custom".to_string();
        save_profiles_to_path(&path, &updated).unwrap();

        let reloaded = load_profiles_from_path(&path);
        assert_eq!(reloaded.profiles.len(), 2);
        assert_eq!(reloaded.active_profile_id, "prof_custom");

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
