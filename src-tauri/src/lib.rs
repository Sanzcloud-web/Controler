use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Clone)]
pub struct ServerInfo {
    pub port: u16,
    pub ip: String,
    pub status: String,
}

#[tauri::command]
async fn start_server(_app: AppHandle) -> Result<ServerInfo, String> {
    let port = 8080u16;
    
    // Get local IP
    let ip = get_local_ip().unwrap_or_else(|| "127.0.0.1".to_string());
    
    let server_info = ServerInfo {
        port,
        ip: ip.clone(),
        status: "running".to_string(),
    };

    eprintln!("Server info: {}:{}", ip, port);

    Ok(server_info)
}

fn get_local_ip() -> Option<String> {
    // Try to get the local IP by connecting to a public DNS
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
            // Fallback: try to detect via socket
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

