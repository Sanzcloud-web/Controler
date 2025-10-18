use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use std::thread;
use std::time::Duration;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use rdev::{listen, Event, EventType, Key};

#[derive(Serialize, Deserialize, Clone)]
pub struct ServerInfo {
    pub port: u16,
    pub ip: String,
    pub status: String,
}

// Global flag to control listener lifecycle
static LISTENER_RUNNING: AtomicBool = AtomicBool::new(false);

#[tauri::command]
async fn start_server(_app: AppHandle) -> Result<ServerInfo, String> {
    let port = 8080u16;

    let ip = get_local_ip().unwrap_or_else(|| "127.0.0.1".to_string());

    let server_info = ServerInfo {
        port,
        ip: ip.clone(),
        status: "running".to_string(),
    };

    eprintln!("Server info: {}:{}", ip, port);

    // Start keyboard listener in background thread with robust error handling
    if !LISTENER_RUNNING.swap(true, Ordering::SeqCst) {
        thread::spawn(|| {
            let mut retry_count = 0;
            let max_retries = 5;

            loop {
                // Catch panics to prevent app crash
                let result = std::panic::catch_unwind(|| {
                    listen(keyboard_callback)
                });

                match result {
                    Ok(Ok(_)) => {
                        eprintln!("Keyboard listener stopped normally");
                        retry_count = 0;
                    }
                    Ok(Err(e)) => {
                        retry_count += 1;
                        eprintln!("Listen error: {:?} (attempt {}/{})", e, retry_count, max_retries);

                        if retry_count >= max_retries {
                            eprintln!("Max retries reached, backing off...");
                            thread::sleep(Duration::from_secs(10));
                            retry_count = 0;
                        } else {
                            thread::sleep(Duration::from_millis(500 * retry_count));
                        }
                    }
                    Err(panic_info) => {
                        retry_count += 1;
                        eprintln!("Keyboard listener panicked: {:?} (attempt {}/{})",
                                 panic_info, retry_count, max_retries);

                        if retry_count >= max_retries {
                            eprintln!("Keyboard listener disabled after too many panics");
                            break;
                        }

                        thread::sleep(Duration::from_secs(2));
                    }
                }

                // Check if we should continue running
                if !LISTENER_RUNNING.load(Ordering::SeqCst) {
                    eprintln!("Keyboard listener stopping by request");
                    break;
                }
            }
        });
    }

    Ok(server_info)
}

fn keyboard_callback(event: Event) {
    match event.event_type {
        EventType::KeyPress(key) => {
            match key {
                Key::F8 => {
                    // Toggle play/pause
                    eprintln!("🎬 F8 pressed - Toggle Play/Pause");
                    let _ = std::process::Command::new("osascript")
                        .arg("-e")
                        .arg("tell application \"System Events\" to key code 119")
                        .output();
                }
                Key::F11 => {
                    // Decrease volume
                    eprintln!("🔊 F11 pressed - Decrease Volume");
                    let _ = std::process::Command::new("osascript")
                        .arg("-e")
                        .arg("set volume output volume ((output volume of (get volume settings)) - 10)")
                        .output();
                }
                Key::F12 => {
                    // Increase volume
                    eprintln!("🔉 F12 pressed - Increase Volume");
                    let _ = std::process::Command::new("osascript")
                        .arg("-e")
                        .arg("set volume output volume ((output volume of (get volume settings)) + 10)")
                        .output();
                }
                _ => {}
            }
        }
        _ => {}
    }
}

fn get_local_ip() -> Option<String> {
    std::process::Command::new("ipconfig")
        .arg("getifaddr")
        .arg("en0")
        .output()
        .ok()
        .and_then(|output| {
            String::from_utf8(output.stdout).ok()
        })
        .and_then(|ip| {
            let trimmed = ip.trim().to_string();
            if !trimmed.is_empty() {
                Some(trimmed)
            } else {
                None
            }
        })
        .or_else(|| {
            if let Ok(socket) = std::net::UdpSocket::bind("0.0.0.0:0") {
                if socket.connect("8.8.8.8:80").is_ok() {
                    return socket.local_addr().ok().map(|addr| addr.ip().to_string());
                }
            }
            None
        })
        .or_else(|| Some("127.0.0.1".to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_server])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

