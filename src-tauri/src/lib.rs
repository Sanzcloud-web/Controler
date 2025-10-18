use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::stream::StreamExt;

#[derive(Serialize, Deserialize, Clone)]
pub struct ServerInfo {
    pub port: u16,
    pub ip: String,
    pub status: String,
}

#[derive(Serialize, Deserialize)]
pub struct VideoCommand {
    pub command: String,
    pub value: Option<f64>,
}

#[tauri::command]
async fn start_server(app: AppHandle) -> Result<ServerInfo, String> {
    let port = 8080u16;
    
    // Get local IP
    let ip = get_local_ip().unwrap_or_else(|| "127.0.0.1".to_string());
    
    let server_info = ServerInfo {
        port,
        ip: ip.clone(),
        status: "running".to_string(),
    };

    // Start WebSocket server in background
    let app_clone = app.clone();
    
    tokio::spawn(async move {
        if let Err(e) = run_websocket_server(port, app_clone).await {
            eprintln!("WebSocket server error: {}", e);
        }
    });

    Ok(server_info)
}

async fn run_websocket_server(port: u16, app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(&addr).await?;
    
    eprintln!("WebSocket server listening on: {}", addr);
    
    loop {
        let (stream, _) = listener.accept().await?;
        let app = app.clone();
        
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream, app).await {
                eprintln!("Connection error: {}", e);
            }
        });
    }
}

async fn handle_connection(stream: TcpStream, _app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let ws_stream = accept_async(stream).await?;
    let (_ws_sender, mut ws_receiver) = ws_stream.split();

    while let Some(msg) = ws_receiver.next().await {
        match msg? {
            Message::Text(_text) => {
                // Commands will be handled by JavaScript in the video player
                // Just forward them through for now
            }
            Message::Close(_) => break,
            _ => {}
        }
    }

    Ok(())
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
