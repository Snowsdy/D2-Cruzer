use tauri::webview::PageLoadEvent;
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_updater::UpdaterExt;

mod bot_stats;
mod bungie_actions;
mod bungie_api;
mod bungie_oauth;
mod d2_inject_chat;
mod d2checkpoint;
mod game_detect;
mod news;
mod steam;

fn external_navigation_plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::<R>::new("external-navigation")
        .on_navigation(|webview, url| {
            let is_internal_host = matches!(
                url.host_str(),
                Some("localhost") | Some("127.0.0.1") | Some("tauri.localhost") | Some("::1")
            );

            let is_internal = url.scheme() == "tauri" || is_internal_host;

            if is_internal {
                return true;
            }

            let is_external_link = matches!(url.scheme(), "http" | "https" | "mailto" | "tel");

            if is_external_link {
                log::info!("opening external link in system browser: {}", url);
                let _ = webview.opener().open_url(url.as_str(), None::<&str>);
                return false;
            }

            true
        })
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(external_navigation_plugin())
        .setup(|app| {
            use tauri_plugin_deep_link::DeepLinkExt;

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                update(handle).await.unwrap();
            });

            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            app.deep_link().register_all()?;

            #[cfg(desktop)]
            app.deep_link().register("cruzer")?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            bungie_oauth::bungie_exchange_code,
            bungie_oauth::bungie_refresh_token,
            bungie_api::bungie_get,
            bungie_api::bungie_fetch_raw,
            news::fetch_news,
            news::fetch_tweets,
            news::fetch_article_body,
            bungie_actions::equip_item,
            bungie_actions::transfer_item,
            bungie_actions::pull_from_postmaster,
            bungie_actions::equip_loadout,
            bungie_actions::snapshot_loadout,
            bungie_actions::update_loadout,
            bungie_actions::clear_loadout,
            d2checkpoint::d2checkpoint_bots,
            d2checkpoint::d2checkpoint_alerts,
            d2_inject_chat::d2_is_running,
            d2_inject_chat::d2_inject_join,
            d2_inject_chat::d2_focus,
            d2_inject_chat::d2_window_rect,
            d2_inject_chat::start_click_watcher,
            d2_inject_chat::stop_click_watcher,
            steam::steam_destiny2_playtime,
            steam::steam_destiny2_player_count,
            bot_stats::read_local_bot_stats,
            game_detect::game_status,
        ])
        .on_page_load(|webview, payload| {
            if webview.label() == "main" && matches!(payload.event(), PageLoadEvent::Finished) {
                let _ = webview.window().show();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;

        // alternatively we could also call update.download() and update.install() separately
        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    log::info!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    log::info!("download finished");
                },
            )
            .await?;

        log::info!("update installed");
        app.restart();
    } else {
        log::info!("No update required.")
    }

    Ok(())
}
