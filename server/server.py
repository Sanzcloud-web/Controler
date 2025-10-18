#!/usr/bin/env python3
"""
HTTP + WebSocket server for Video Remote Controller using aiohttp
"""
import asyncio
import socket
import json
from pathlib import Path
from aiohttp import web
import logging

PORT = 8080

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

async def handle_index(request):
    """Serve index.html for the web app"""
    dist_path = Path('..')  if Path('../dist').exists() else Path('.')
    index_file = dist_path / 'dist' / 'index.html'
    
    if index_file.exists():
        with open(index_file, 'r') as f:
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
                    # Echo back confirmation
                    await ws.send_json({"status": "ok"})
                except json.JSONDecodeError:
                    logger.error(f'❌ Invalid JSON: {msg.data}')
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
