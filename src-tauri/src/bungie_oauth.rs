use serde::{Deserialize, Serialize};

const TOKEN_URL: &str = "https://www.bungie.net/platform/app/oauth/token/";

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
    // Public (PKCE) apps without the offline_access scope don't receive a refresh token.
    #[serde(default)]
    pub refresh_token: Option<String>,
    #[serde(default)]
    pub refresh_expires_in: Option<i64>,
    pub membership_id: String,
}

#[derive(Debug, Serialize)]
pub struct OAuthError {
    pub status: u16,
    pub body: String,
}

async fn post_token(form: &[(&str, &str)]) -> Result<TokenResponse, OAuthError> {
    let client = reqwest::Client::builder()
        .user_agent("CruzerCompagnon/0.1.0")
        .build()
        .map_err(|e| OAuthError {
            status: 0,
            body: e.to_string(),
        })?;

    let res = client
        .post(TOKEN_URL)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(form)
        .send()
        .await
        .map_err(|e| OAuthError {
            status: 0,
            body: e.to_string(),
        })?;

    let status = res.status();
    let body = res.text().await.unwrap_or_default();

    if !status.is_success() {
        return Err(OAuthError {
            status: status.as_u16(),
            body,
        });
    }

    serde_json::from_str(&body).map_err(|e| OAuthError {
        status: status.as_u16(),
        body: format!("Decode error: {}: {}", e, body),
    })
}

#[tauri::command]
pub async fn bungie_exchange_code(
    code: String,
    code_verifier: String,
    client_id: String,
    redirect_uri: String,
) -> Result<TokenResponse, OAuthError> {
    let form: &[(&str, &str)] = &[
        ("grant_type", "authorization_code"),
        ("code", &code),
        ("client_id", &client_id),
        ("code_verifier", &code_verifier),
        ("redirect_uri", &redirect_uri),
    ];
    post_token(form).await
}

#[tauri::command]
pub async fn bungie_refresh_token(
    refresh_token: String,
    client_id: String,
) -> Result<TokenResponse, OAuthError> {
    let form: &[(&str, &str)] = &[
        ("grant_type", "refresh_token"),
        ("refresh_token", &refresh_token),
        ("client_id", &client_id),
    ];
    post_token(form).await
}
