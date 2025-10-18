#!/usr/bin/env python3
"""
HTTP + WebSocket server for Video Remote Controller
"""
import asyncio
import os
import socket
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread
import websockets
import json

PORT = 8080
HTTP_PORT = 8000
WS_PORT = 8080

class VideoControllerHTTPHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Serve from dist directory
        if self.path == '/' or self.path == '/index.html':
            self.path = '/index.html'
        
        # Change to project root to serve dist
        dist_path = Path('../dist') if Path('../dist').exists() else Path('dist')
        
        file_path = dist_path / self.path.lstrip('/')
        
        if file_path.exists() and file_path.is_file():
            content_type = self.get_content_type(str(file_path))
            
            with open(file_path, 'rb') as f:
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', file_path.stat().st_size)
                self.end_headers()
                self.wfile.write(f.read())
        else:
            # Serve index.html for SPA routing
            index_file = dist_path / 'index.html'
            if index_file.exists():
                with open(index_file, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Content-Length', len(content))
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_error(404)

    def get_content_type(self, file_path):
        if file_path.endswith('.html'):
            return 'text/html'
        elif file_path.endswith('.css'):
            return 'text/css'
        elif file_path.endswith('.js'):
            return 'application/javascript'
        elif file_path.endswith('.json'):
            return 'application/json'
        elif file_path.endswith('.png'):
            return 'image/png'
        elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
            return 'image/jpeg'
        elif file_path.endswith('.svg'):
            return 'image/svg+xml'
        else:
            return 'application/octet-stream'
    
    def log_message(self, format, *args):
        # Custom logging
        print(f'{self.client_address[0]} - - [{self.log_date_time_string()}] {format % args}')

async def handle_websocket(websocket, path):
    """Handle WebSocket connections"""
    print(f'✅ WebSocket client connected: {websocket.remote_address}')
    try:
        async for message in websocket:
            try:
                cmd = json.loads(message)
                print(f'📥 Command received: {cmd}')
                # Here you can handle the command
                # For now, just echo back
                await websocket.send(json.dumps({"status": "ok"}))
            except json.JSONDecodeError:
                print(f'❌ Invalid JSON: {message}')
    except websockets.exceptions.ConnectionClosed:
        print(f'❌ WebSocket client disconnected: {websocket.remote_address}')

def start_http_server():
    """Start HTTP server in a thread"""
    server_address = ('0.0.0.0', HTTP_PORT)
    httpd = HTTPServer(server_address, VideoControllerHTTPHandler)
    print(f'🌐 HTTP server started on port {HTTP_PORT}')
    httpd.serve_forever()

async def start_websocket_server():
    """Start WebSocket server"""
    async with websockets.serve(handle_websocket, '0.0.0.0', WS_PORT):
        print(f'🔌 WebSocket server started on port {WS_PORT}')
        await asyncio.Future()  # Run forever

def get_local_ip():
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def main():
    ip = get_local_ip()
    
    print(f"""
╔════════════════════════════════════════════════════════════╗
║      📺 Video Remote Controller Server (HTTP + WS)        ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on: http://{ip}:{HTTP_PORT}
🔌 WebSocket on: ws://{ip}:{WS_PORT}

📱 On your phone:
   1. Open browser
   2. Go to: http://{ip}:{HTTP_PORT}
   3. Make sure you're on the same WiFi!

Press Ctrl+C to stop the server
""")
    
    # Start HTTP server in background thread
    http_thread = Thread(target=start_http_server, daemon=True)
    http_thread.start()
    
    # Start WebSocket server in main thread
    try:
        asyncio.run(start_websocket_server())
    except KeyboardInterrupt:
        print("\n\n✋ Server stopped")

if __name__ == "__main__":
    main()
