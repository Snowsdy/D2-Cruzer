use serde::{Deserialize, Serialize};

const BASE: &str = "https://www.bungie.net/Platform";

#[derive(Debug, Serialize)]
pub struct ActionError {
    pub status: u16,
    pub error_code: Option<i32>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
struct Envelope {
    #[serde(rename = "ErrorCode")]
    error_code: Option<i32>,
    #[serde(rename = "Message")]
    message: Option<String>,
}

async fn post_action(
    api_key: &str,
    access_token: &str,
    path: &str,
    body: serde_json::Value,
) -> Result<(), ActionError> {
    let client = reqwest::Client::builder()
        .user_agent("CruzerCompagnon/0.1.0")
        .build()
        .map_err(|e| ActionError {
            status: 0,
            error_code: None,
            message: e.to_string(),
        })?;

    let res = client
        .post(format!("{}{}", BASE, path))
        .header("X-API-Key", api_key)
        .bearer_auth(access_token)
        .json(&body)
        .send()
        .await
        .map_err(|e| ActionError {
            status: 0,
            error_code: None,
            message: e.to_string(),
        })?;

    let status = res.status().as_u16();
    let text = res.text().await.unwrap_or_default();
    let env: Envelope = serde_json::from_str(&text).unwrap_or(Envelope {
        error_code: None,
        message: Some(text.clone()),
    });

    if let Some(code) = env.error_code {
        if code != 1 {
            return Err(ActionError {
                status,
                error_code: Some(code),
                message: env.message.unwrap_or_else(|| "Bungie error".into()),
            });
        }
    }
    if status >= 400 {
        return Err(ActionError {
            status,
            error_code: env.error_code,
            message: env.message.unwrap_or_else(|| "HTTP error".into()),
        });
    }
    Ok(())
}

/// Equip an item on a character (must already be in that character's inventory).
#[tauri::command]
pub async fn equip_item(
    api_key: String,
    access_token: String,
    item_id: String, // itemInstanceId
    character_id: String,
    membership_type: i32,
) -> Result<(), ActionError> {
    post_action(
        &api_key,
        &access_token,
        "/Destiny2/Actions/Items/EquipItem/",
        serde_json::json!({
            "itemId": item_id,
            "characterId": character_id,
            "membershipType": membership_type,
        }),
    )
    .await
}

/// Pull an item from the character's postmaster into their inventory.
#[tauri::command]
pub async fn pull_from_postmaster(
    api_key: String,
    access_token: String,
    item_reference_hash: u32,
    stack_size: i32,
    item_id: String,
    character_id: String,
    membership_type: i32,
) -> Result<(), ActionError> {
    post_action(
        &api_key,
        &access_token,
        "/Destiny2/Actions/Items/PullFromPostmaster/",
        serde_json::json!({
            "itemReferenceHash": item_reference_hash,
            "stackSize": stack_size,
            "itemId": item_id,
            "characterId": character_id,
            "membershipType": membership_type,
        }),
    )
    .await
}

/// Equip all items from a saved in-game loadout slot onto the character.
#[tauri::command]
pub async fn equip_loadout(
    api_key: String,
    access_token: String,
    loadout_index: i32,
    character_id: String,
    membership_type: i32,
) -> Result<(), ActionError> {
    post_action(
        &api_key,
        &access_token,
        "/Destiny2/Actions/Loadouts/EquipLoadout/",
        serde_json::json!({
            "loadoutIndex": loadout_index,
            "characterId": character_id,
            "membershipType": membership_type,
        }),
    )
    .await
}

/// Snapshot the character's currently equipped items to a loadout slot.
#[tauri::command]
pub async fn snapshot_loadout(
    api_key: String,
    access_token: String,
    loadout_index: i32,
    character_id: String,
    membership_type: i32,
    color_hash: Option<u32>,
    icon_hash: Option<u32>,
    name_hash: Option<u32>,
) -> Result<(), ActionError> {
    post_action(
        &api_key,
        &access_token,
        "/Destiny2/Actions/Loadouts/SnapshotLoadout/",
        serde_json::json!({
            "loadoutIndex": loadout_index,
            "characterId": character_id,
            "membershipType": membership_type,
            "colorHash": color_hash,
            "iconHash": icon_hash,
            "nameHash": name_hash,
        }),
    )
    .await
}

/// Rename / recolor an existing loadout slot.
#[tauri::command]
pub async fn update_loadout(
    api_key: String,
    access_token: String,
    loadout_index: i32,
    character_id: String,
    membership_type: i32,
    color_hash: u32,
    icon_hash: u32,
    name_hash: u32,
) -> Result<(), ActionError> {
    post_action(
        &api_key,
        &access_token,
        "/Destiny2/Actions/Loadouts/UpdateLoadoutIdentifiers/",
        serde_json::json!({
            "loadoutIndex": loadout_index,
            "characterId": character_id,
            "membershipType": membership_type,
            "colorHash": color_hash,
            "iconHash": icon_hash,
            "nameHash": name_hash,
        }),
    )
    .await
}

/// Clear a loadout slot.
#[tauri::command]
pub async fn clear_loadout(
    api_key: String,
    access_token: String,
    loadout_index: i32,
    character_id: String,
    membership_type: i32,
) -> Result<(), ActionError> {
    post_action(
        &api_key,
        &access_token,
        "/Destiny2/Actions/Loadouts/ClearLoadout/",
        serde_json::json!({
            "loadoutIndex": loadout_index,
            "characterId": character_id,
            "membershipType": membership_type,
        }),
    )
    .await
}

/// Transfer an item between a character and the vault.
/// `to_vault = true` moves from character → vault.
/// `to_vault = false` moves from vault → character.
#[tauri::command]
pub async fn transfer_item(
    api_key: String,
    access_token: String,
    item_reference_hash: u32,
    stack_size: i32,
    transfer_to_vault: bool,
    item_id: String, // itemInstanceId
    character_id: String,
    membership_type: i32,
) -> Result<(), ActionError> {
    post_action(
        &api_key,
        &access_token,
        "/Destiny2/Actions/Items/TransferItem/",
        serde_json::json!({
            "itemReferenceHash": item_reference_hash,
            "stackSize": stack_size,
            "transferToVault": transfer_to_vault,
            "itemId": item_id,
            "characterId": character_id,
            "membershipType": membership_type,
        }),
    )
    .await
}
