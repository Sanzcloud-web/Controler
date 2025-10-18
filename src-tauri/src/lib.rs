use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::stream::StreamExt;
use std::path::PathBuf;

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
async fn start_server(_app: AppHandle) -> Result<ServerInfo, String> {
    let port = 8080u16;
    
    // Get local IP
    let ip = get_local_ip().unwrap_or_else(|| "127.0.0.1".to_string());
    
    let server_info = ServerInfo {
        port,
        ip: ip.clone(),
        status: "running".to_string(),
    };

    // Start server in background
    tokio::spawn(async move {
        if let Err(e) = run_server(port).await {
            eprintln!("Server error: {}", e);
        }
    });

    Ok(server_info)
}

async fn run_server(port: u16) -> Result<(), Box<dyn std::error::Error>> {
    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(&addr).await?;
    
    eprintln!("Server listening on: {}", addr);
    
    loop {
        let (stream, _) = listener.accept().await?;
        
        tokio::spawn(async move {
            if let Err(e) = handle_client(stream).await {
                eprintln!("Client error: {}", e);
            }
        });
    }
}

async fn handle_client(mut stream: TcpStream) -> Result<(), Box<dyn std::error::Error>> {
    let mut buffer = [0; 4096];
    let n = stream.read(&mut buffer).await?;
    
    let request = String::from_utf8_lossy(&buffer[..n]);
    
    // Parse the request line
    let lines: Vec<&str> = request.lines().collect();
    if lines.is_empty() {
        return Ok(());
    }
    
    let request_line = lines[0];
    
    // Check if it's a WebSocket upgrade request
    if request.contains("Upgrade: websocket") && request.contains("Connection: Upgrade") {
        // Handle WebSocket
        if let Ok(ws_stream) = accept_async(stream).await {
            let (_ws_sender, mut ws_receiver) = ws_stream.split();
            
            while let Some(msg) = ws_receiver.next().await {
                match msg {
                    Ok(Message::Text(_text)) => {
                        // Just receive, don't need to do anything
                    }
                    Ok(Message::Close(_)) => break,
                    Err(_) => break,
                    _ => {}
                }
            }
        }
    } else if request_line.starts_with("GET") {
        // Parse the path from GET request
        let parts: Vec<&str> = request_line.split_whitespace().collect();
        let path = if parts.len() > 1 { parts[1] } else { "/" };
        
        // Serve HTTP file
        let response = serve_file(path).await;
        stream.write_all(response.as_bytes()).await?;
    }
    
    Ok(())
}

fn get_dist_path() -> PathBuf {
    // Try multiple locations for the dist folder
    let possible_paths = vec![
        PathBuf::from("dist"),
        PathBuf::from("../dist"),
        PathBuf::from("../../dist"),
    ];
    
    for path in possible_paths {
        if path.exists() && path.is_dir() {
            eprintln!("Found dist at: {:?}", path);
            return path;
        }
    }
    
    // Fallback to current dir
    eprintln!("Current dir: {:?}", std::env::current_dir());
    PathBuf::from("dist")
}

async fn serve_file(path: &str) -> String {
    let dist_dir = get_dist_path();
    
    // Normalize the path
    let file_path = if path == "/" {
        dist_dir.join("index.html")
    } else {
        // Remove leading slash and join
        let clean_path = path.trim_start_matches('/');
        dist_dir.join(clean_path)
    };
    
    eprintln!("Trying to serve: {:?}", file_path);
    
    // Try to read the file
    match tokio::fs::read(&file_path).await {
        Ok(contents) => {
            let mime_type = get_mime_type(path);
            format!(
                "HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                mime_type,
                contents.len(),
                String::from_utf8_lossy(&contents)
            )
        }
        Err(e) => {
            eprintln!("File read error for {:?}: {}", file_path, e);
            
            // File not found, serve 404 with index.html as fallback for SPA
            if path.starts_with("/assets/") || path.starts_with("/api/") {
                format!(
                    "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found"
                )
            } else {
                // For any other path, serve index.html (SPA routing)
                let index_path = dist_dir.join("index.html");
                match tokio::fs::read(&index_path).await {
                    Ok(contents) => {
                        format!(
                            "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                            contents.len(),
                            String::from_utf8_lossy(&contents)
                        )
                    }
                    Err(e) => {
                        eprintln!("Failed to serve index.html: {}", e);
                        format!(
                            "HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\nContent-Length: 21\r\nConnection: close\r\n\r\nInternal Server Error"
                        )
                    }
                }
            }
        }
    }
}

fn get_mime_type(path: &str) -> &'static str {
    if path.ends_with(".html") {
        "text/html; charset=utf-8"
    } else if path.ends_with(".css") {
        "text/css"
    } else if path.ends_with(".js") {
        "application/javascript"
    } else if path.ends_with(".json") {
        "application/json"
    } else if path.ends_with(".png") {
        "image/png"
    } else if path.ends_with(".jpg") || path.ends_with(".jpeg") {
        "image/jpeg"
    } else if path.ends_with(".gif") {
        "image/gif"
    } else if path.ends_with(".svg") {
        "image/svg+xml"
    } else if path.ends_with(".woff") {
        "font/woff"
    } else if path.ends_with(".woff2") {
        "font/woff2"
    } else if path.ends_with(".ico") {
        "image/x-icon"
    } else {
        "application/octet-stream"
    }
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
