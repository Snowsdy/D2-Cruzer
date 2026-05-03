use serde::{Deserialize, Serialize};

const BASE: &str = "https://www.bungie.net/Platform";

#[derive(Debug, Serialize)]
pub struct BungieError {
    pub status: u16,
    pub error_code: Option<i32>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
struct BungieEnvelope {
    #[serde(rename = "Response")]
    response: Option<serde_json::Value>,
    #[serde(rename = "ErrorCode")]
    error_code: Option<i32>,
    #[serde(rename = "Message")]
    message: Option<String>,
}

fn build_client() -> Result<reqwest::Client, BungieError> {
    reqwest::Client::builder()
        .user_agent("CruzerCompagnon/0.1.0")
        .build()
        .map_err(|e| BungieError {
            status: 0,
            error_code: None,
            message: e.to_string(),
        })
}

#[tauri::command]
pub async fn bungie_get(
    api_key: String,
    access_token: Option<String>,
    path: String,
) -> Result<serde_json::Value, BungieError> {
    let client = build_client()?;
    let url = format!("{}{}", BASE, path);

    let mut req = client.get(&url).header("X-API-Key", &api_key);
    if let Some(token) = access_token {
        req = req.bearer_auth(token);
    }

    let res = req.send().await.map_err(|e| BungieError {
        status: 0,
        error_code: None,
        message: e.to_string(),
    })?;

    let status = res.status().as_u16();
    let body = res.text().await.unwrap_or_default();
    let env: BungieEnvelope = serde_json::from_str(&body).map_err(|e| BungieError {
        status,
        error_code: None,
        message: format!("Decode error: {}: {}", e, body),
    })?;

    if let Some(code) = env.error_code {
        if code != 1 {
            return Err(BungieError {
                status,
                error_code: Some(code),
                message: env.message.unwrap_or_else(|| "Bungie error".into()),
            });
        }
    }
    if status >= 400 {
        return Err(BungieError {
            status,
            error_code: env.error_code,
            message: env.message.unwrap_or_else(|| "HTTP error".into()),
        });
    }

    Ok(env.response.unwrap_or(serde_json::Value::Null))
}

// Fetches a raw JSON file hosted on bungie.net (e.g. manifest definition files).
// These are served as plain JSON, not wrapped in the Bungie API envelope.
#[tauri::command]
pub async fn bungie_fetch_raw(path: String) -> Result<serde_json::Value, BungieError> {
    if !path.starts_with('/') {
        return Err(BungieError {
            status: 0,
            error_code: None,
            message: "Path must start with /".into(),
        });
    }
    let client = build_client()?;
    let url = format!("https://www.bungie.net{}", path);

    let res = client.get(&url).send().await.map_err(|e| BungieError {
        status: 0,
        error_code: None,
        message: e.to_string(),
    })?;
    let status = res.status().as_u16();
    if status >= 400 {
        return Err(BungieError {
            status,
            error_code: None,
            message: format!("HTTP {}", status),
        });
    }
    res.json::<serde_json::Value>()
        .await
        .map_err(|e| BungieError {
            status,
            error_code: None,
            message: e.to_string(),
        })
}
