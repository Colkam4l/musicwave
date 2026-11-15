use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DetectedBrowser {
    pub id: String,
    pub name: String,
    pub available: bool,
    pub has_session: bool,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct PythonExtractionResult {
    success: Option<bool>,
    cookie: Option<String>,
    error: Option<String>,
}

const SUPPORTED_BROWSERS: &[(&str, &str)] = &[
    ("firefox", "Mozilla Firefox"),
    ("chrome", "Google Chrome"),
    ("brave", "Brave Browser"),
    ("edge", "Microsoft Edge"),
    ("chromium", "Chromium"),
    ("opera", "Opera"),
    ("vivaldi", "Vivaldi"),
];

/// Detects which supported web browsers are available on this system and if they contain
/// Google / YouTube Music session cookies.
pub fn detect_available_browsers() -> Vec<DetectedBrowser> {
    let py_script = r#"
import json, sys
try:
    from yt_dlp.cookies import extract_cookies_from_browser
except ImportError:
    print(json.dumps([]))
    sys.exit(0)

browsers = [
    ('firefox', 'Mozilla Firefox'),
    ('chrome', 'Google Chrome'),
    ('brave', 'Brave Browser'),
    ('edge', 'Microsoft Edge'),
    ('chromium', 'Chromium'),
    ('opera', 'Opera'),
    ('vivaldi', 'Vivaldi'),
]

results = []
for b_id, b_name in browsers:
    try:
        jar = extract_cookies_from_browser(b_id)
        cookies = {c.name: c.value for c in jar if 'google' in c.domain or 'youtube' in c.domain}
        has_auth = bool('SAPISID' in cookies or '__Secure-3PAPISID' in cookies or 'SID' in cookies)
        results.append({'id': b_id, 'name': b_name, 'available': True, 'hasSession': has_auth})
    except FileNotFoundError:
        results.append({'id': b_id, 'name': b_name, 'available': False, 'hasSession': False})
    except Exception:
        results.append({'id': b_id, 'name': b_name, 'available': True, 'hasSession': False})

print(json.dumps(results))
"#;

    let output = Command::new("python3")
        .arg("-c")
        .arg(py_script)
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            serde_json::from_str::<Vec<DetectedBrowser>>(&stdout).unwrap_or_else(|_| fallback_browser_detection())
        }
        _ => fallback_browser_detection(),
    }
}

/// Fallback detection if python/yt-dlp script fails (checks known filesystem config paths)
fn fallback_browser_detection() -> Vec<DetectedBrowser> {
    let home = std::env::var("HOME").unwrap_or_default();
    SUPPORTED_BROWSERS
        .iter()
        .map(|(id, name)| {
            let available = match *id {
                "firefox" => std::path::Path::new(&format!("{home}/.mozilla/firefox")).exists(),
                "chrome" => std::path::Path::new(&format!("{home}/.config/google-chrome")).exists(),
                "brave" => std::path::Path::new(&format!("{home}/.config/BraveSoftware/Brave-Browser")).exists(),
                "edge" => std::path::Path::new(&format!("{home}/.config/microsoft-edge")).exists(),
                "chromium" => std::path::Path::new(&format!("{home}/.config/chromium")).exists(),
                "opera" => std::path::Path::new(&format!("{home}/.config/opera")).exists(),
                "vivaldi" => std::path::Path::new(&format!("{home}/.config/vivaldi")).exists(),
                _ => false,
            };
            DetectedBrowser {
                id: id.to_string(),
                name: name.to_string(),
                available,
                has_session: false,
            }
        })
        .collect()
}

/// Extracts Google/YouTube Music authentication cookies from the selected browser without
/// requiring any user password input.
pub fn extract_browser_cookies(browser_id: &str) -> anyhow::Result<String> {
    let safe_id = browser_id.trim().to_lowercase();
    let is_valid_browser = SUPPORTED_BROWSERS.iter().any(|(id, _)| *id == safe_id);
    if !is_valid_browser {
        anyhow::bail!("Unsupported browser: {browser_id}");
    }

    let py_script = format!(
        r#"
import sys, json
try:
    from yt_dlp.cookies import extract_cookies_from_browser
    jar = extract_cookies_from_browser('{safe_id}')
    cookies = {{c.name: c.value for c in jar if 'google' in c.domain or 'youtube' in c.domain}}
    if not cookies or ('SAPISID' not in cookies and '__Secure-3PAPISID' not in cookies and 'SID' not in cookies):
        print(json.dumps({{'error': 'No active Google / YouTube Music session found in this browser. Please open {safe_id} and visit music.youtube.com first.'}}))
        sys.exit(1)
    cookie_str = '; '.join([f'{{k}}={{v}}' for k, v in cookies.items()])
    print(json.dumps({{'success': True, 'cookie': cookie_str}}))
except Exception as e:
    print(json.dumps({{'error': str(e)}}))
    sys.exit(1)
"#
    );

    let output = Command::new("python3")
        .arg("-c")
        .arg(&py_script)
        .output()
        .map_err(|e| anyhow::anyhow!("Failed to execute browser cookie extraction: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: PythonExtractionResult = serde_json::from_str(&stdout)
        .map_err(|_| anyhow::anyhow!("Unexpected response from browser extractor: {}", stdout.trim()))?;

    if let Some(cookie) = parsed.cookie {
        if !cookie.trim().is_empty() {
            return Ok(cookie);
        }
    }

    let error_msg = parsed
        .error
        .unwrap_or_else(|| "Unknown error extracting cookies from browser".to_string());
    anyhow::bail!("{error_msg}")
}

/// Extracts cookies from the given browser and immediately links the active YouTube Music profile
pub async fn import_and_link_browser(
    browser_id: &str,
    app_handle: &AppHandle,
) -> anyhow::Result<crate::auth::UserProfile> {
    let cookie = extract_browser_cookies(browser_id)?;
    crate::sync::link_youtube_cookie(app_handle, cookie).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_available_browsers() {
        let browsers = detect_available_browsers();
        assert!(!browsers.is_empty());
        // At least Firefox should be detected on this machine
        let firefox = browsers.iter().find(|b| b.id == "firefox");
        assert!(firefox.is_some());
    }

    #[test]
    fn test_unsupported_browser() {
        let res = extract_browser_cookies("internet_explorer");
        assert!(res.is_err());
    }
}
