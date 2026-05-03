use std::fs;
use std::path::PathBuf;

const DESTINY_2_APP_ID: &str = "1085660";

/// Returns the Steam install path on Windows (default install location only).
#[cfg(windows)]
fn steam_install_path() -> Option<PathBuf> {
    // 1. Registry: HKEY_CURRENT_USER\Software\Valve\Steam\SteamPath
    if let Ok(output) = std::process::Command::new("reg")
        .args(["query", r"HKCU\Software\Valve\Steam", "/v", "SteamPath"])
        .output()
    {
        let text = String::from_utf8_lossy(&output.stdout);
        for line in text.lines() {
            if let Some(idx) = line.find("REG_SZ") {
                let path = line[idx + 6..].trim();
                let pb = PathBuf::from(path);
                if pb.exists() {
                    return Some(pb);
                }
            }
        }
    }
    // 2. Default locations
    for p in [r"C:\Program Files (x86)\Steam", r"C:\Program Files\Steam"] {
        let pb = PathBuf::from(p);
        if pb.exists() {
            return Some(pb);
        }
    }
    None
}

#[cfg(not(windows))]
fn steam_install_path() -> Option<PathBuf> {
    None
}

/// Extracts the `Playtime` value (in minutes) from the `1085660` section of a
/// Steam `localconfig.vdf` file. Returns `None` if the app isn't listed.
fn extract_destiny2_playtime(vdf: &str) -> Option<u64> {
    // Find the Destiny 2 app section: `"1085660" { ... "Playtime" "NNN" ... }`
    // Steam's localconfig.vdf has many occurrences of "1085660"; the one we
    // care about is the nested object with a `Playtime` key inside.
    let needle = format!("\"{}\"", DESTINY_2_APP_ID);
    let mut search_from = 0usize;
    while let Some(idx) = vdf[search_from..].find(&needle) {
        let abs_idx = search_from + idx + needle.len();
        // After the ID, skip whitespace. The real section is followed by
        // `{` (object) whereas the other flat occurrences are followed by a
        // quoted string value.
        let after = vdf[abs_idx..].trim_start();
        if after.starts_with('{') {
            // Find the matching closing brace for this object.
            let obj_start = vdf[abs_idx..].find('{').map(|i| abs_idx + i)?;
            let mut depth = 0i32;
            let mut end = obj_start;
            for (i, c) in vdf[obj_start..].char_indices() {
                if c == '{' {
                    depth += 1;
                } else if c == '}' {
                    depth -= 1;
                    if depth == 0 {
                        end = obj_start + i;
                        break;
                    }
                }
            }
            let section = &vdf[obj_start..end];
            // Parse `"Playtime" "NNN"` inside this section.
            if let Some(p_idx) = section.find("\"Playtime\"") {
                let rest = &section[p_idx + "\"Playtime\"".len()..];
                let rest = rest.trim_start();
                if let Some(stripped) = rest.strip_prefix('"') {
                    if let Some(close) = stripped.find('"') {
                        let value = &stripped[..close];
                        if let Ok(n) = value.parse::<u64>() {
                            return Some(n);
                        }
                    }
                }
            }
        }
        search_from = abs_idx;
    }
    None
}

#[derive(serde::Serialize, Clone)]
pub struct SteamPlaytimeInfo {
    /// Total lifetime playtime in minutes.
    pub total_minutes: u64,
    /// Playtime in the last 14 days (minutes).
    pub two_weeks_minutes: u64,
    /// Unix timestamp (seconds) of last session, or 0 if unknown.
    pub last_played: u64,
    /// Steam user ID (account ID from the userdata folder name).
    pub account_id: String,
}

fn extract_playtime_2wks(vdf: &str, section: &str) -> u64 {
    if let Some(p_idx) = section.find("\"Playtime2wks\"") {
        let rest = &section[p_idx + "\"Playtime2wks\"".len()..];
        let rest = rest.trim_start();
        if let Some(stripped) = rest.strip_prefix('"') {
            if let Some(close) = stripped.find('"') {
                return stripped[..close].parse::<u64>().unwrap_or(0);
            }
        }
    }
    let _ = vdf;
    0
}

fn extract_last_played(section: &str) -> u64 {
    if let Some(p_idx) = section.find("\"LastPlayed\"") {
        let rest = &section[p_idx + "\"LastPlayed\"".len()..];
        let rest = rest.trim_start();
        if let Some(stripped) = rest.strip_prefix('"') {
            if let Some(close) = stripped.find('"') {
                return stripped[..close].parse::<u64>().unwrap_or(0);
            }
        }
    }
    0
}

/// Fetches the live number of Destiny 2 players currently connected on Steam
/// via Valve's public API. Not all platforms — Steam only — but updates in
/// near real-time and is the only concurrent-player count Bungie discloses
/// indirectly. Anyone playing on Epic / Xbox / PS isn't counted here.
#[derive(serde::Serialize)]
pub struct SteamPlayerCount {
    pub player_count: u64,
}

#[tauri::command]
pub async fn steam_destiny2_player_count() -> Result<Option<SteamPlayerCount>, String> {
    let url = format!(
        "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={}",
        DESTINY_2_APP_ID
    );
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = match client.get(&url).send().await {
        Ok(r) => r,
        Err(_) => return Ok(None),
    };
    if !resp.status().is_success() {
        return Ok(None);
    }
    let body: serde_json::Value = match resp.json().await {
        Ok(v) => v,
        Err(_) => return Ok(None),
    };
    let count = body
        .get("response")
        .and_then(|r| r.get("player_count"))
        .and_then(|v| v.as_u64());
    Ok(count.map(|n| SteamPlayerCount { player_count: n }))
}

#[tauri::command]
pub fn steam_destiny2_playtime() -> Result<Option<SteamPlaytimeInfo>, String> {
    let root = match steam_install_path() {
        Some(p) => p,
        None => return Ok(None),
    };
    let userdata = root.join("userdata");
    if !userdata.exists() {
        return Ok(None);
    }

    let mut best: Option<SteamPlaytimeInfo> = None;

    // Iterate userdata/{accountId}/config/localconfig.vdf across accounts.
    let entries = match fs::read_dir(&userdata) {
        Ok(e) => e,
        Err(e) => return Err(e.to_string()),
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let account_id = entry.file_name().to_string_lossy().to_string();
        let vdf_path = path.join("config").join("localconfig.vdf");
        if !vdf_path.exists() {
            continue;
        }
        let content = match fs::read_to_string(&vdf_path) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let Some(minutes) = extract_destiny2_playtime(&content) else {
            continue;
        };

        // Locate the Destiny 2 section once more to extract 2wks and LastPlayed.
        let needle = format!("\"{}\"", DESTINY_2_APP_ID);
        let mut section_str = String::new();
        if let Some(start_idx) = content.find(&needle) {
            let mut cursor = start_idx;
            while let Some(rel) = content[cursor..].find(&needle) {
                let abs = cursor + rel + needle.len();
                let after = content[abs..].trim_start();
                if after.starts_with('{') {
                    if let Some(obj_start) = content[abs..].find('{').map(|i| abs + i) {
                        let mut depth = 0i32;
                        let mut end = obj_start;
                        for (i, c) in content[obj_start..].char_indices() {
                            if c == '{' {
                                depth += 1;
                            } else if c == '}' {
                                depth -= 1;
                                if depth == 0 {
                                    end = obj_start + i;
                                    break;
                                }
                            }
                        }
                        section_str = content[obj_start..end].to_string();
                        break;
                    }
                }
                cursor = abs;
            }
        }

        let info = SteamPlaytimeInfo {
            total_minutes: minutes,
            two_weeks_minutes: extract_playtime_2wks(&content, &section_str),
            last_played: extract_last_played(&section_str),
            account_id,
        };

        // Keep the account with the most total playtime (the real owner).
        best = match best {
            None => Some(info),
            Some(cur) if info.total_minutes > cur.total_minutes => Some(info),
            other => other,
        };
    }

    Ok(best)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_basic_vdf() {
        let vdf = r#"
            "apps" {
                "1085660" {
                    "LastPlayed"    "1776345288"
                    "Playtime2wks"  "276"
                    "Playtime"      "378008"
                }
            }
        "#;
        assert_eq!(extract_destiny2_playtime(vdf), Some(378008));
    }
}
