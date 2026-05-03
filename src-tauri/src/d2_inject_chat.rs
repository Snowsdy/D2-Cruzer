// Inject a chat command into a running Destiny 2 session by focusing its
// window and typing the full command string via SendInput/Unicode events,
// followed by Enter.
// Note: Destiny 2 runs BattlEye which may filter synthetic keyboard input.
// The Unicode path is usually the least-filtered — if this still fails,
// the user will have to paste manually (clipboard is also populated as a
// fallback by the frontend).

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Emitter;

static CLICK_WATCHER_ACTIVE: AtomicBool = AtomicBool::new(false);

#[cfg(target_os = "windows")]
#[tauri::command]
pub async fn d2_is_running() -> bool {
    windows_impl::find_destiny_window().is_some()
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub async fn d2_is_running() -> bool {
    false
}

#[cfg(target_os = "windows")]
#[tauri::command]
pub async fn d2_inject_join(command: String) -> Result<(), String> {
    validate_chat_command(&command)?;
    windows_impl::inject_command(&command)
}

/// Guard the chat-injection entry point against attacker-controlled
/// payloads. Legitimate Destiny 2 chat commands are short ASCII strings
/// (e.g. "/join abc#1234"). We reject anything with control chars, NULs,
/// or unreasonable length to keep the surface tiny.
fn validate_chat_command(cmd: &str) -> Result<(), String> {
    if cmd.is_empty() {
        return Err("Empty command".into());
    }
    if cmd.len() > 128 {
        return Err("Command too long".into());
    }
    for ch in cmd.chars() {
        // Permit printable ASCII, common punctuation, and Unicode BMP
        // letters / digits (some gamertags use accents). Reject control
        // characters and NUL explicitly.
        if ch.is_control() || ch == '\u{0000}' {
            return Err("Command contains control characters".into());
        }
    }
    Ok(())
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub async fn d2_inject_join(_command: String) -> Result<(), String> {
    Err("Unsupported platform".into())
}

#[cfg(target_os = "windows")]
#[tauri::command]
pub async fn d2_focus(open_director: Option<bool>) -> Result<(), String> {
    windows_impl::focus_destiny(open_director.unwrap_or(false))
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub async fn d2_focus(_open_director: Option<bool>) -> Result<(), String> {
    Err("Unsupported platform".into())
}

#[derive(serde::Serialize)]
pub struct D2WindowRect {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[cfg(target_os = "windows")]
#[tauri::command]
pub async fn d2_window_rect() -> Option<D2WindowRect> {
    windows_impl::get_destiny_rect()
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub async fn d2_window_rect() -> Option<D2WindowRect> {
    None
}

#[cfg(target_os = "windows")]
#[tauri::command]
pub async fn start_click_watcher(app: tauri::AppHandle) -> Result<(), String> {
    if CLICK_WATCHER_ACTIVE.swap(true, Ordering::SeqCst) {
        return Ok(());
    }
    std::thread::spawn(move || {
        use windows::Win32::Foundation::POINT;
        use windows::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState;
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
        const VK_LBUTTON: i32 = 0x01;

        let mut was_down = false;
        while CLICK_WATCHER_ACTIVE.load(Ordering::SeqCst) {
            let state = unsafe { GetAsyncKeyState(VK_LBUTTON) };
            let is_down = (state as u16 & 0x8000) != 0;
            if is_down && !was_down {
                let mut pt = POINT::default();
                let ok = unsafe { GetCursorPos(&mut pt).is_ok() };
                if ok {
                    let _ = app.emit(
                        "cruzer://click",
                        serde_json::json!({ "x": pt.x, "y": pt.y }),
                    );
                }
            }
            was_down = is_down;
            std::thread::sleep(std::time::Duration::from_millis(20));
        }
    });
    Ok(())
}

#[cfg(target_os = "windows")]
#[tauri::command]
pub async fn stop_click_watcher() -> Result<(), String> {
    CLICK_WATCHER_ACTIVE.store(false, Ordering::SeqCst);
    Ok(())
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub async fn start_click_watcher(_app: tauri::AppHandle) -> Result<(), String> {
    Err("Unsupported platform".into())
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub async fn stop_click_watcher() -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "windows")]
mod windows_impl {
    use std::thread::sleep;
    use std::time::Duration;
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM, TRUE};
    use windows::Win32::System::Threading::GetCurrentThreadId;
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS, KEYEVENTF_KEYUP,
        KEYEVENTF_SCANCODE, KEYEVENTF_UNICODE, VIRTUAL_KEY, VK_RETURN,
    };
    const VK_M: VIRTUAL_KEY = VIRTUAL_KEY(0x4D);
    use windows::Win32::Foundation::RECT;
    use windows::Win32::UI::WindowsAndMessaging::{
        BringWindowToTop, EnumWindows, GetForegroundWindow, GetWindowRect, GetWindowTextLengthW,
        GetWindowTextW, GetWindowThreadProcessId, IsIconic, IsWindowVisible, SetForegroundWindow,
        ShowWindow, SW_RESTORE,
    };

    use super::D2WindowRect;

    pub fn get_destiny_rect() -> Option<D2WindowRect> {
        let hwnd = find_destiny_window()?;
        let mut rect = RECT::default();
        unsafe {
            if GetWindowRect(hwnd, &mut rect).is_err() {
                return None;
            }
        }
        Some(D2WindowRect {
            x: rect.left,
            y: rect.top,
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
        })
    }

    #[link(name = "user32")]
    unsafe extern "system" {
        fn AttachThreadInput(id_attach: u32, id_attach_to: u32, f_attach: BOOL) -> BOOL;
    }

    pub fn find_destiny_window() -> Option<HWND> {
        struct Ctx {
            hwnd: Option<HWND>,
        }
        let mut ctx = Ctx { hwnd: None };

        unsafe extern "system" fn cb(hwnd: HWND, lparam: LPARAM) -> BOOL {
            unsafe {
                if !IsWindowVisible(hwnd).as_bool() {
                    return TRUE;
                }
                let len = GetWindowTextLengthW(hwnd);
                if len <= 0 {
                    return TRUE;
                }
                let mut buf = vec![0u16; (len as usize) + 1];
                let read = GetWindowTextW(hwnd, &mut buf);
                if read <= 0 {
                    return TRUE;
                }
                let title = String::from_utf16_lossy(&buf[..read as usize]);
                if title == "Destiny 2" || title.starts_with("Destiny 2") {
                    let ctx = &mut *(lparam.0 as *mut Ctx);
                    ctx.hwnd = Some(hwnd);
                    return BOOL(0);
                }
                TRUE
            }
        }

        unsafe {
            let _ = EnumWindows(Some(cb), LPARAM(&mut ctx as *mut _ as isize));
        }
        ctx.hwnd
    }

    fn force_foreground(hwnd: HWND) -> bool {
        unsafe {
            let current_tid = GetCurrentThreadId();
            let target_tid = GetWindowThreadProcessId(hwnd, None);

            if IsIconic(hwnd).as_bool() {
                let _ = ShowWindow(hwnd, SW_RESTORE);
            }

            if target_tid != 0 && target_tid != current_tid {
                let _ = AttachThreadInput(current_tid, target_tid, BOOL(1));
                let _ = BringWindowToTop(hwnd);
                let _ = SetForegroundWindow(hwnd);
                let _ = AttachThreadInput(current_tid, target_tid, BOOL(0));
            } else {
                let _ = BringWindowToTop(hwnd);
                let _ = SetForegroundWindow(hwnd);
            }

            // Wait until the OS actually transfers foreground, up to ~1s.
            for _ in 0..20 {
                if GetForegroundWindow() == hwnd {
                    return true;
                }
                sleep(Duration::from_millis(50));
            }
            GetForegroundWindow() == hwnd
        }
    }

    fn send_scan(vk: VIRTUAL_KEY, up: bool) {
        use windows::Win32::UI::Input::KeyboardAndMouse::{MapVirtualKeyW, MAPVK_VK_TO_VSC};
        let scan = unsafe { MapVirtualKeyW(vk.0 as u32, MAPVK_VK_TO_VSC) } as u16;
        let mut flags = KEYEVENTF_SCANCODE;
        if up {
            flags |= KEYEVENTF_KEYUP;
        }
        let input = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VIRTUAL_KEY(0),
                    wScan: scan,
                    dwFlags: flags,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };
        unsafe {
            SendInput(&[input], std::mem::size_of::<INPUT>() as i32);
        }
    }

    fn tap_scan(vk: VIRTUAL_KEY) {
        send_scan(vk, false);
        sleep(Duration::from_millis(45));
        send_scan(vk, true);
    }

    fn send_unicode_char(ch: u16, up: bool) {
        let mut flags = KEYEVENTF_UNICODE;
        if up {
            flags |= KEYEVENTF_KEYUP;
        }
        let input = INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VIRTUAL_KEY(0),
                    wScan: ch,
                    dwFlags: flags,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };
        unsafe {
            SendInput(&[input], std::mem::size_of::<INPUT>() as i32);
        }
    }

    fn type_string(s: &str) {
        for unit in s.encode_utf16() {
            send_unicode_char(unit, false);
            sleep(Duration::from_millis(12));
            send_unicode_char(unit, true);
            sleep(Duration::from_millis(18));
        }
    }

    pub fn focus_destiny(open_director: bool) -> Result<(), String> {
        let hwnd = find_destiny_window().ok_or("d2_not_running")?;
        if !force_foreground(hwnd) {
            return Err("d2_focus_failed".into());
        }
        if open_director {
            // Let the OS settle foreground before sending input, otherwise
            // the key press can hit the previous foreground window.
            sleep(Duration::from_millis(350));
            tap_scan(VK_M);
        }
        Ok(())
    }

    pub fn inject_command(command: &str) -> Result<(), String> {
        let hwnd = find_destiny_window().ok_or("d2_not_running")?;

        let focused = force_foreground(hwnd);
        if !focused {
            return Err("d2_focus_failed".into());
        }

        // Let the game settle after taking focus.
        sleep(Duration::from_millis(450));

        // Open chat.
        tap_scan(VK_RETURN);
        sleep(Duration::from_millis(320));

        // Type the full command character-by-character via Unicode events.
        type_string(command);
        sleep(Duration::from_millis(180));

        // Submit.
        tap_scan(VK_RETURN);

        // Silence unused import warning on some builds.
        let _ = PCWSTR::null();
        let _ = KEYBD_EVENT_FLAGS;
        Ok(())
    }
}
