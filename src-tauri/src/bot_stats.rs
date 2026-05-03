//! Local bot-stats reader for dev. The published Cruzer bot writes
//! `bot-stats.json` into its working directory every 60 s; when the app
//! is running on the same machine (typical during development), the
//! dashboard can grab those stats without a round-trip to cruzer.gg.
//!
//! Paths tried, in order:
//!   1. `CRUZER_BOT_STATS_PATH` env var (explicit override, wins).
//!   2. `<cwd>/bot/bot-stats.json` — Cruzer repo default.
//!   3. `<cwd>/bot-stats.json` — bot running straight from its own dir.
//!
//! Returns the raw JSON body so the frontend can parse once, keeping
//! the Rust side schema-agnostic (the stats shape may drift independently).

use std::path::PathBuf;

fn candidate_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    if let Ok(explicit) = std::env::var("CRUZER_BOT_STATS_PATH") {
        paths.push(PathBuf::from(explicit));
    }
    if let Ok(cwd) = std::env::current_dir() {
        paths.push(cwd.join("bot").join("bot-stats.json"));
        paths.push(cwd.join("bot-stats.json"));
        // Running from src-tauri/ in dev — walk up one level.
        if let Some(parent) = cwd.parent() {
            paths.push(parent.join("bot").join("bot-stats.json"));
        }
    }
    paths
}

#[tauri::command]
pub async fn read_local_bot_stats() -> Result<String, String> {
    for path in candidate_paths() {
        if path.exists() {
            return std::fs::read_to_string(&path)
                .map_err(|e| format!("read {}: {}", path.display(), e));
        }
    }
    Err("bot-stats.json not found in any candidate path".into())
}
