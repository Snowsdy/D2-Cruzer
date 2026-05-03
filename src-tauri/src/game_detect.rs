//! Unified detection for supported games (Destiny 2 + Marathon).
//!
//! The existing `d2_inject` module handles Destiny 2 specifically. This one
//! exposes a single `game_status` command used by the frontend's overlay
//! window: it polls every couple of seconds to decide whether to show the
//! overlay on top of the game, and where. Marathon detection is best-effort
//! — the game is still in pre-release — and matches common expected window
//! titles. As soon as Marathon ships with a stable title we can narrow this.
//!
//! The Tauri command returns a flat JSON shape the frontend can interpret
//! without any ceremony:
//!   { game: "destiny2" | "marathon" | null, rect?: { x, y, width, height } }

use serde::Serialize;

#[derive(Serialize, Clone, Copy, Debug)]
#[serde(rename_all = "snake_case")]
pub enum DetectedGame {
    Destiny2,
    Marathon,
}

#[derive(Serialize)]
pub struct GameRect {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[derive(Serialize)]
pub struct GameStatus {
    pub game: Option<DetectedGame>,
    pub rect: Option<GameRect>,
}

#[cfg(target_os = "windows")]
#[tauri::command]
pub async fn game_status() -> GameStatus {
    windows_impl::detect()
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub async fn game_status() -> GameStatus {
    GameStatus {
        game: None,
        rect: None,
    }
}

#[cfg(target_os = "windows")]
mod windows_impl {
    use super::{DetectedGame, GameRect, GameStatus};
    use windows::Win32::Foundation::{CloseHandle, BOOL, HWND, LPARAM, RECT, TRUE};
    use windows::Win32::System::ProcessStatus::GetModuleFileNameExW;
    use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetForegroundWindow, GetWindowRect, GetWindowThreadProcessId, IsWindowVisible,
    };

    /// Executable file-name (case-insensitive, ends_with) → game. We match
    /// on the process image, not the window title, so a browser tab or a
    /// Discord Rich Presence status called "Destiny 2" never triggers the
    /// overlay by accident.
    const EXE_CANDIDATES: &[(&str, DetectedGame)] = &[
        ("destiny2.exe", DetectedGame::Destiny2),
        // Marathon's final exe name isn't public yet; we match conservative
        // variants. Update when Bungie ships the real binary.
        ("marathon.exe", DetectedGame::Marathon),
        ("marathon-shipping.exe", DetectedGame::Marathon),
    ];

    /// Return the full path of the executable owning `hwnd`, if we can get
    /// it. Failing quietly is fine — a None here means "skip this window".
    fn exe_path(hwnd: HWND) -> Option<String> {
        let mut pid: u32 = 0;
        unsafe {
            GetWindowThreadProcessId(hwnd, Some(&mut pid));
        }
        if pid == 0 {
            return None;
        }
        unsafe {
            let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
            let mut buf = [0u16; 1024];
            // hmodule=HMODULE::default() asks for the main executable's
            // path (equivalent to passing the process's base module).
            // Using the fully qualified path lets us
            // `.ends_with("\\destiny2.exe")` safely.
            let len = GetModuleFileNameExW(
                handle,
                windows::Win32::Foundation::HMODULE::default(),
                &mut buf,
            );
            let _ = CloseHandle(handle);
            if len == 0 {
                return None;
            }
            Some(String::from_utf16_lossy(&buf[..len as usize]))
        }
    }

    fn match_game_by_exe(hwnd: HWND) -> Option<DetectedGame> {
        let path = exe_path(hwnd)?.to_ascii_lowercase();
        // Normalize separators for robust suffix matching across devices.
        let path = path.replace('/', "\\");
        for (exe, game) in EXE_CANDIDATES {
            if path.ends_with(&format!("\\{exe}")) || path == *exe {
                return Some(*game);
            }
        }
        None
    }

    fn find_game_window() -> Option<(HWND, DetectedGame)> {
        struct Ctx {
            hit: Option<(HWND, DetectedGame)>,
        }
        let mut ctx = Ctx { hit: None };

        unsafe extern "system" fn cb(hwnd: HWND, lparam: LPARAM) -> BOOL {
            unsafe {
                if !IsWindowVisible(hwnd).as_bool() {
                    return TRUE;
                }
                if let Some(game) = match_game_by_exe(hwnd) {
                    let ctx = &mut *(lparam.0 as *mut Ctx);
                    ctx.hit = Some((hwnd, game));
                    return BOOL(0);
                }
                TRUE
            }
        }

        unsafe {
            let _ = EnumWindows(Some(cb), LPARAM(&mut ctx as *mut _ as isize));
        }
        ctx.hit
    }

    pub fn detect() -> GameStatus {
        // Strict policy: the overlay appears if and only if the game
        // itself is the foreground window. If the user alt-tabs to the
        // main Cruzer window (or anything else), the overlay retreats so
        // the two windows never stack on top of each other. The trade-off
        // is that clicking INTO the overlay will hide it on the next poll
        // — which is fine because the main window carries all the real
        // interaction; the overlay is a glance-at surface.
        let Some((hwnd, game)) = find_game_window() else {
            return GameStatus {
                game: None,
                rect: None,
            };
        };

        let fg = unsafe { GetForegroundWindow() };
        let fg_is_game = if fg.0.is_null() {
            false
        } else {
            match_game_by_exe(fg).is_some()
        };

        if !fg_is_game {
            return GameStatus {
                game: None,
                rect: None,
            };
        }

        let mut rect = RECT::default();
        let rect_ok = unsafe { GetWindowRect(hwnd, &mut rect).is_ok() };
        let gr = if rect_ok {
            Some(GameRect {
                x: rect.left,
                y: rect.top,
                width: rect.right - rect.left,
                height: rect.bottom - rect.top,
            })
        } else {
            None
        };

        GameStatus {
            game: Some(game),
            rect: gr,
        }
    }
}
