#!/usr/bin/env python3
"""
Screen Streaming Server using WebSocket + MJPEG
Captures screen and streams to browser with good performance
No FFmpeg compilation required!
"""
import asyncio
import json
import os
import io
import time
import base64
from aiohttp import web
import logging
import mss
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PORT = 8081
REMOTE_PASSWORD = os.getenv('REMOTE_PASSWORD', 'changeme')
TARGET_FPS = 30
QUALITY = 60  # JPEG quality (1-100)
MAX_WIDTH = 1280
MAX_HEIGHT = 720

# Track authenticated clients
authenticated_clients = set()
streaming_tasks = {}

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


class ScreenStreamer:
    """Captures screen and streams as MJPEG over WebSocket."""

    def __init__(self, ws, width=1280, height=720, fps=30, quality=60):
        self.ws = ws
        self.width = width
        self.height = height
        self.fps = fps
        self.quality = quality
        self.running = False
        self.sct = mss.mss()
        self.monitor = self.sct.monitors[1]  # Primary monitor
        self.frame_count = 0
        self.start_time = None

    async def start(self):
        """Start streaming."""
        self.running = True
        self.start_time = time.time()
        frame_interval = 1.0 / self.fps

        logger.info(f"📺 Starting stream: {self.width}x{self.height} @ {self.fps}fps")

        try:
            while self.running:
                frame_start = time.time()

                # Capture screen
                screenshot = self.sct.grab(self.monitor)

                # Convert to PIL Image
                img = Image.frombytes('RGB', screenshot.size, screenshot.bgra, 'raw', 'BGRX')

                # Resize if needed
                if img.width != self.width or img.height != self.height:
                    img = img.resize((self.width, self.height), Image.Resampling.LANCZOS)

                # Encode as JPEG
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=self.quality, optimize=True)
                frame_data = base64.b64encode(buffer.getvalue()).decode('utf-8')

                # Send frame
                try:
                    await self.ws.send_json({
                        "type": "frame",
                        "data": frame_data,
                        "timestamp": time.time(),
                        "frame": self.frame_count
                    })
                except Exception as e:
                    logger.error(f"Failed to send frame: {e}")
                    break

                self.frame_count += 1

                # Calculate actual FPS every second
                if self.frame_count % self.fps == 0:
                    elapsed = time.time() - self.start_time
                    actual_fps = self.frame_count / elapsed
                    logger.info(f"📊 Streaming: {actual_fps:.1f} FPS")

                # Rate limiting
                elapsed = time.time() - frame_start
                sleep_time = frame_interval - elapsed
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

        except asyncio.CancelledError:
            logger.info("🛑 Stream cancelled")
        except Exception as e:
            logger.error(f"❌ Stream error: {e}")
        finally:
            self.running = False
            logger.info(f"📺 Stream ended after {self.frame_count} frames")

    def stop(self):
        """Stop streaming."""
        self.running = False


async def websocket_handler(request):
    """Handle WebSocket connections for streaming."""
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    client_id = id(ws)
    streamer = None
    logger.info(f'🔌 New screen client: {request.remote}')

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    command = data.get('command')

                    # Authentication
                    if command == 'auth':
                        password = data.get('password', '')
                        if password == REMOTE_PASSWORD:
                            authenticated_clients.add(client_id)
                            await ws.send_json({"type": "authSuccess"})
                            logger.info(f'✅ Screen client authenticated: {request.remote}')
                        else:
                            await ws.send_json({"type": "authFailed"})
                            logger.warning(f'❌ Auth failed: {request.remote}')
                        continue

                    # Check auth
                    if client_id not in authenticated_clients:
                        await ws.send_json({"type": "authRequired"})
                        continue

                    # Start streaming
                    if command == 'startStream':
                        if streamer and streamer.running:
                            streamer.stop()

                        width = min(data.get('width', MAX_WIDTH), MAX_WIDTH)
                        height = min(data.get('height', MAX_HEIGHT), MAX_HEIGHT)
                        fps = min(data.get('fps', TARGET_FPS), 60)
                        quality = data.get('quality', QUALITY)

                        streamer = ScreenStreamer(ws, width, height, fps, quality)
                        streaming_tasks[client_id] = asyncio.create_task(streamer.start())

                        await ws.send_json({
                            "type": "streamStarted",
                            "width": width,
                            "height": height,
                            "fps": fps
                        })

                    # Stop streaming
                    elif command == 'stopStream':
                        if streamer:
                            streamer.stop()
                        if client_id in streaming_tasks:
                            streaming_tasks[client_id].cancel()
                            del streaming_tasks[client_id]
                        await ws.send_json({"type": "streamStopped"})

                    # Update settings
                    elif command == 'setQuality':
                        if streamer:
                            streamer.quality = data.get('quality', QUALITY)

                    elif command == 'setFps':
                        if streamer:
                            streamer.fps = min(data.get('fps', TARGET_FPS), 60)

                except json.JSONDecodeError:
                    await ws.send_json({"type": "error", "message": "Invalid JSON"})

            elif msg.type == web.WSMsgType.ERROR:
                logger.error(f'❌ WebSocket error: {ws.exception()}')

    except Exception as e:
        logger.error(f'❌ Connection error: {e}')
    finally:
        # Cleanup
        if streamer:
            streamer.stop()
        if client_id in streaming_tasks:
            streaming_tasks[client_id].cancel()
            del streaming_tasks[client_id]
        authenticated_clients.discard(client_id)
        logger.info(f'❌ Screen client disconnected: {request.remote}')

    return ws


async def handle_index(request):
    """Serve a simple test page."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Screen Stream Test</title>
        <style>
            body { margin: 0; background: #111; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            #screen { max-width: 100%; max-height: 80vh; border: 2px solid #333; }
            .stats { color: #0f0; margin: 10px; font-family: monospace; }
            button { margin: 5px; padding: 10px 20px; font-size: 16px; cursor: pointer; }
        </style>
    </head>
    <body>
        <img id="screen" alt="Screen stream will appear here">
        <div class="stats" id="stats">Disconnected</div>
        <div>
            <button onclick="startStream()">Start Stream</button>
            <button onclick="stopStream()">Stop Stream</button>
        </div>
        <script>
            let ws;
            let frameCount = 0;
            let startTime;

            function connect() {
                const password = prompt('Password:');
                ws = new WebSocket('ws://' + location.host + '/ws');

                ws.onopen = () => {
                    ws.send(JSON.stringify({ command: 'auth', password }));
                };

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);

                    if (data.type === 'authSuccess') {
                        document.getElementById('stats').textContent = 'Authenticated - Click Start Stream';
                    } else if (data.type === 'authFailed') {
                        alert('Authentication failed');
                    } else if (data.type === 'frame') {
                        document.getElementById('screen').src = 'data:image/jpeg;base64,' + data.data;
                        frameCount++;
                        if (!startTime) startTime = Date.now();
                        const elapsed = (Date.now() - startTime) / 1000;
                        const fps = frameCount / elapsed;
                        document.getElementById('stats').textContent = `FPS: ${fps.toFixed(1)} | Frames: ${frameCount}`;
                    } else if (data.type === 'streamStarted') {
                        frameCount = 0;
                        startTime = null;
                        document.getElementById('stats').textContent = 'Stream started...';
                    }
                };

                ws.onclose = () => {
                    document.getElementById('stats').textContent = 'Disconnected';
                    setTimeout(connect, 2000);
                };
            }

            function startStream() {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ command: 'startStream', width: 1280, height: 720, fps: 30, quality: 60 }));
                }
            }

            function stopStream() {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ command: 'stopStream' }));
                }
            }

            connect();
        </script>
    </body>
    </html>
    """
    return web.Response(text=html, content_type='text/html')


async def handle_health(request):
    """Health check endpoint."""
    return web.json_response({
        "status": "ok",
        "clients": len(authenticated_clients),
        "streams": len(streaming_tasks),
        "target_fps": TARGET_FPS
    })


async def on_shutdown(app):
    """Cleanup on shutdown."""
    for task in streaming_tasks.values():
        task.cancel()
    streaming_tasks.clear()
    logger.info("🧹 All streams stopped")


async def main():
    app = web.Application()
    app.on_shutdown.append(on_shutdown)

    # CORS middleware
    @web.middleware
    async def cors_middleware(request, handler):
        if request.method == "OPTIONS":
            response = web.Response()
        else:
            response = await handler(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    app.middlewares.append(cors_middleware)

    # Routes
    app.router.add_get('/', handle_index)
    app.router.add_get('/ws', websocket_handler)
    app.router.add_get('/health', handle_health)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()

    print(f"""
╔════════════════════════════════════════════════════════════╗
║      🖥️  Screen Streaming Server (WebSocket + MJPEG)       ║
╚════════════════════════════════════════════════════════════╝

🔐 Password: {REMOTE_PASSWORD}
📺 Test page: http://localhost:{PORT}
🔌 WebSocket: ws://localhost:{PORT}/ws

📊 Settings: {MAX_WIDTH}x{MAX_HEIGHT} @ {TARGET_FPS}fps (JPEG quality: {QUALITY})

💡 Run both servers:
   python server.py          (port 8080 - controls)
   python screen_server.py   (port 8081 - screen)

Press Ctrl+C to stop
""")

    logger.info(f'🚀 Screen server started on port {PORT}')

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\n\n✋ Screen server stopped")
    finally:
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
