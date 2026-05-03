use serde::{Deserialize, Serialize};
use serde_json::Value;

const UA: &str =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const BASE: &str = "https://d2checkpoint.com/_actions";

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Bot {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub steam: String,
    #[serde(default, rename = "membershipId")]
    pub membership_id: String,
    #[serde(default, rename = "activityHash")]
    pub activity_hash: i64,
    #[serde(default)]
    pub encounter: i64,
    #[serde(default)]
    pub premium: bool,
}

async fn call_action(action: &str) -> Result<Value, String> {
    let client = reqwest::Client::builder()
        .user_agent(UA)
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .post(format!("{}/{}", BASE, action))
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .body("{}")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = resp.status();
    if status == reqwest::StatusCode::NO_CONTENT {
        return Ok(Value::Array(vec![]));
    }
    if !status.is_success() {
        return Err(format!("HTTP {}", status));
    }
    let body = resp.text().await.map_err(|e| e.to_string())?;
    if body.trim().is_empty() {
        return Ok(Value::Array(vec![]));
    }
    devalue_parse(&body)
}

#[tauri::command]
pub async fn d2checkpoint_bots() -> Result<Vec<Bot>, String> {
    let v = call_action("bots.getBotsFromDb").await?;
    match v {
        Value::Array(_) => serde_json::from_value(v).map_err(|e| e.to_string()),
        Value::Null => Ok(vec![]),
        _ => Ok(vec![]),
    }
}

#[tauri::command]
pub async fn d2checkpoint_alerts() -> Result<Value, String> {
    call_action("alerts.getAlertsFromDb").await
}

// Astro "devalue" format parser.
// The response is a flat array where index 0 is the root and values
// inside objects/arrays are integer indices pointing back into the array.
fn devalue_parse(s: &str) -> Result<Value, String> {
    let root: Value = serde_json::from_str(s).map_err(|e| e.to_string())?;
    let arr = match root {
        Value::Array(a) => a,
        other => return Ok(other),
    };
    if arr.is_empty() {
        return Ok(Value::Array(vec![]));
    }
    let mut cache: Vec<Option<Value>> = vec![None; arr.len()];
    resolve(0, &arr, &mut cache)
}

fn resolve(idx: i64, arr: &[Value], cache: &mut Vec<Option<Value>>) -> Result<Value, String> {
    match idx {
        -1 | -2 | -3 | -4 | -5 => return Ok(Value::Null),
        -6 => return Ok(Value::Number(serde_json::Number::from(0))),
        i if i < 0 => return Ok(Value::Null),
        _ => {}
    }
    let u = idx as usize;
    if u >= arr.len() {
        return Err(format!("devalue: index {} out of bounds", u));
    }
    if let Some(c) = &cache[u] {
        return Ok(c.clone());
    }
    let v = &arr[u];
    let resolved = match v {
        Value::Object(map) => {
            let mut out = serde_json::Map::with_capacity(map.len());
            for (k, val) in map {
                let child_idx = val.as_i64().unwrap_or(-1);
                out.insert(k.clone(), resolve(child_idx, arr, cache)?);
            }
            Value::Object(out)
        }
        Value::Array(inner) => {
            if matches!(inner.first(), Some(Value::String(_))) {
                // Typed value (Date, Set, Map, URL, etc.) — return as-is.
                v.clone()
            } else {
                let mut out = Vec::with_capacity(inner.len());
                for item in inner {
                    let child_idx = item.as_i64().unwrap_or(-1);
                    out.push(resolve(child_idx, arr, cache)?);
                }
                Value::Array(out)
            }
        }
        _ => v.clone(),
    };
    cache[u] = Some(resolved.clone());
    Ok(resolved)
}
