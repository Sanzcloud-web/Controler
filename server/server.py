#!/usr/bin/env python3
"""
HTTP + WebSocket server for Video Remote Controller using aiohttp
"""
import asyncio
import socket
import json
import subprocess
from pathlib import Path
from aiohttp import web
import logging

PORT = 8080

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def execute_command(cmd: dict):
    """Execute system commands to control Mac"""
    command = cmd.get('command')
    value = cmd.get('value')
    
    try:
        if command == 'setVolume':
            # Set volume (0-100)
            volume = max(0, min(100, value))
            script = f'set volume output volume {volume}'
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            logger.info(f'🔊 Volume set to {volume}%')
        
        elif command == 'togglePlayPause':
            # Send space key to toggle play/pause
            script = 'tell application "System Events" to key code 49'  # Space key
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            logger.info(f'🎬 Play/Pause toggled')
        
        elif command == 'skipForward':
            # Forward 10s
            script = 'tell application "System Events" to key code 124 using shift down'  # Shift+Right
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            logger.info(f'⏩ Skip forward')
        
        elif command == 'skipBackward':
            # Backward 10s
            script = 'tell application "System Events" to key code 123 using shift down'  # Shift+Left
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            logger.info(f'⏪ Skip backward')
        
        elif command == 'fullscreen':
            # Toggle fullscreen (F key)
            script = 'tell application "System Events" to key code 3'  # F key
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            logger.info(f'🖥️ Fullscreen toggled')
        
        return {"status": "ok"}
    
    except subprocess.CalledProcessError as e:
        logger.error(f'❌ Command failed: {e}')
        return {"status": "error", "message": str(e)}
    except Exception as e:
        logger.error(f'❌ Unexpected error: {e}')
        return {"status": "error", "message": str(e)}

async def handle_index(request):
    """Serve index.html for the web app"""
    dist_path = Path('..')  if Path('../dist').exists() else Path('.')
    index_file = dist_path / 'dist' / 'index.html'
    
    if index_file.exists():
        with open(index_file, 'r') as f:
            return web.Response(text=f.read(), content_type='text/html')
    return web.Response(text="404 Not Found", status=404)

async def handle_video(request):
    """Serve the video player page"""
    video_file = Path('../public/video.html')
    
    if video_file.exists():
        with open(video_file, 'r') as f:
            return web.Response(text=f.read(), content_type='text/html')
    return web.Response(text="404 Not Found", status=404)

async def handle_static(request):
    """Serve static files from dist"""
    path = request.match_info['path']
    dist_path = Path('..')  if Path('../dist').exists() else Path('.')
    file_path = dist_path / 'dist' / path
    
    if file_path.exists() and file_path.is_file():
        content_type = get_content_type(str(file_path))
        with open(file_path, 'rb') as f:
            return web.Response(body=f.read(), content_type=content_type)
    return web.Response(text="404 Not Found", status=404)

def get_content_type(file_path: str) -> str:
    """Get content type based on file extension"""
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

async def websocket_handler(request):
    """Handle WebSocket connections"""
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    logger.info(f'✅ WebSocket client connected: {request.remote}')
    
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    cmd = json.loads(msg.data)
                    logger.info(f'📥 Command received: {cmd}')
                    
                    # Execute the command
                    result = execute_command(cmd)
                    
                    # Send response back
                    await ws.send_json(result)
                except json.JSONDecodeError:
                    logger.error(f'❌ Invalid JSON: {msg.data}')
                    await ws.send_json({"status": "error", "message": "Invalid JSON"})
            elif msg.type == web.WSMsgType.ERROR:
                logger.error(f'❌ WebSocket error: {ws.exception()}')
    except Exception as e:
        logger.error(f'❌ Connection error: {e}')
    finally:
        logger.info(f'❌ WebSocket client disconnected: {request.remote}')
    
    return ws

def get_local_ip() -> str:
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

async def main():
    app = web.Application()
    
    # Routes
    app.router.add_get('/', handle_index)
    app.router.add_get('/ws', websocket_handler)
    app.router.add_get('/video', handle_video)
    app.router.add_get('/{path:.*}', handle_static)
    
    ip = get_local_ip()
    
    print(f"""
╔════════════════════════════════════════════════════════════╗
║      📺 Video Remote Controller Server (aiohttp)          ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on: http://{ip}:{PORT}
🔌 WebSocket on: ws://{ip}:{PORT}/ws

📱 On your phone:
   1. Open browser
   2. Go to: http://{ip}:{PORT}
   3. Make sure you're on the same WiFi!

Press Ctrl+C to stop the server
""")
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()
    
    logger.info(f'🚀 Server started on port {PORT}')
    
    try:
        await asyncio.Future()  # Run forever
    except KeyboardInterrupt:
        print("\n\n✋ Server stopped")
    finally:
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
