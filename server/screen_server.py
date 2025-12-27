#!/usr/bin/env python3
"""
WebRTC Screen Streaming Server using aiortc
Captures screen and streams to browser with low latency
"""
import asyncio
import json
import os
import fractions
import time
from pathlib import Path
from aiohttp import web
import logging
import mss
import numpy as np
from av import VideoFrame
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.contrib.media import MediaRelay
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PORT = 8081  # Different port from main server
REMOTE_PASSWORD = os.getenv('REMOTE_PASSWORD', 'changeme')
TARGET_FPS = 30
FRAME_DURATION = 1 / TARGET_FPS

# Track authenticated sessions and peer connections
authenticated_clients = set()
peer_connections = set()
relay = MediaRelay()

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


class ScreenCaptureTrack(VideoStreamTrack):
    """
    A video track that captures the screen.
    Uses mss for fast screen capture.
    """
    kind = "video"

    def __init__(self, width: int = 1280, height: int = 720, fps: int = 30):
        super().__init__()
        self.width = width
        self.height = height
        self.fps = fps
        self.frame_duration = fractions.Fraction(1, fps)
        self._timestamp = 0
        self._start_time = None
        self._frame_count = 0
        self.sct = mss.mss()

        # Get primary monitor
        self.monitor = self.sct.monitors[1]  # 0 is all monitors, 1 is primary
        logger.info(f"📺 Screen capture initialized: {self.monitor['width']}x{self.monitor['height']}")

    async def recv(self):
        """Capture and return a video frame."""
        pts, time_base = await self.next_timestamp()

        # Capture screen
        screenshot = self.sct.grab(self.monitor)

        # Convert to numpy array (BGRA format from mss)
        img = np.array(screenshot)

        # Convert BGRA to RGB
        img = img[:, :, :3]  # Remove alpha channel
        img = img[:, :, ::-1]  # BGR to RGB

        # Resize if needed (for performance)
        if img.shape[1] != self.width or img.shape[0] != self.height:
            # Simple resize using numpy (faster than PIL for this use case)
            from PIL import Image
            pil_img = Image.fromarray(img)
            pil_img = pil_img.resize((self.width, self.height), Image.Resampling.LANCZOS)
            img = np.array(pil_img)

        # Create VideoFrame
        frame = VideoFrame.from_ndarray(img, format="rgb24")
        frame.pts = pts
        frame.time_base = time_base

        self._frame_count += 1

        # Rate limiting - wait to maintain target FPS
        if self._start_time is None:
            self._start_time = time.time()
        else:
            elapsed = time.time() - self._start_time
            expected = self._frame_count / self.fps
            if expected > elapsed:
                await asyncio.sleep(expected - elapsed)

        return frame


async def handle_offer(request):
    """Handle WebRTC offer from client."""
    try:
        params = await request.json()

        # Check authentication
        password = params.get('password', '')
        if password != REMOTE_PASSWORD:
            return web.json_response(
                {"error": "Authentication failed"},
                status=401
            )

        offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

        # Create peer connection
        pc = RTCPeerConnection()
        peer_connections.add(pc)

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            logger.info(f"🔗 Connection state: {pc.connectionState}")
            if pc.connectionState == "failed" or pc.connectionState == "closed":
                await pc.close()
                peer_connections.discard(pc)

        @pc.on("iceconnectionstatechange")
        async def on_iceconnectionstatechange():
            logger.info(f"🧊 ICE state: {pc.iceConnectionState}")

        # Get resolution from params (with defaults)
        width = params.get('width', 1280)
        height = params.get('height', 720)
        fps = params.get('fps', 30)

        # Add screen capture track
        screen_track = ScreenCaptureTrack(width=width, height=height, fps=fps)
        pc.addTrack(screen_track)

        # Set remote description
        await pc.setRemoteDescription(offer)

        # Create answer
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        logger.info(f"✅ WebRTC connection established ({width}x{height} @ {fps}fps)")

        return web.json_response({
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type
        })

    except Exception as e:
        logger.error(f"❌ Error handling offer: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def handle_index(request):
    """Serve a simple test page."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Screen Stream Test</title>
        <style>
            body { margin: 0; background: #111; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            video { max-width: 100%; max-height: 100vh; }
        </style>
    </head>
    <body>
        <video id="video" autoplay playsinline></video>
        <script>
            const password = prompt('Password:');

            async function start() {
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });

                pc.ontrack = (event) => {
                    document.getElementById('video').srcObject = event.streams[0];
                };

                pc.oniceconnectionstatechange = () => {
                    console.log('ICE state:', pc.iceConnectionState);
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                // Wait for ICE gathering
                await new Promise(resolve => {
                    if (pc.iceGatheringState === 'complete') {
                        resolve();
                    } else {
                        pc.onicegatheringstatechange = () => {
                            if (pc.iceGatheringState === 'complete') resolve();
                        };
                    }
                });

                const response = await fetch('/offer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sdp: pc.localDescription.sdp,
                        type: pc.localDescription.type,
                        password: password,
                        width: 1280,
                        height: 720,
                        fps: 30
                    })
                });

                const answer = await response.json();
                if (answer.error) {
                    alert('Error: ' + answer.error);
                    return;
                }

                await pc.setRemoteDescription(answer);
                console.log('Connected!');
            }

            start();
        </script>
    </body>
    </html>
    """
    return web.Response(text=html, content_type='text/html')


async def handle_health(request):
    """Health check endpoint."""
    return web.json_response({
        "status": "ok",
        "connections": len(peer_connections),
        "fps": TARGET_FPS
    })


async def on_shutdown(app):
    """Cleanup on shutdown."""
    # Close all peer connections
    coros = [pc.close() for pc in peer_connections]
    await asyncio.gather(*coros)
    peer_connections.clear()
    logger.info("🧹 All connections closed")


async def main():
    app = web.Application()
    app.on_shutdown.append(on_shutdown)

    # Enable CORS for all origins
    async def cors_middleware(app, handler):
        async def middleware_handler(request):
            if request.method == "OPTIONS":
                response = web.Response()
            else:
                response = await handler(request)

            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
            return response
        return middleware_handler

    app.middlewares.append(cors_middleware)

    # Routes
    app.router.add_get('/', handle_index)
    app.router.add_post('/offer', handle_offer)
    app.router.add_get('/health', handle_health)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()

    print(f"""
╔════════════════════════════════════════════════════════════╗
║      🖥️  Screen Streaming Server (WebRTC)                  ║
╚════════════════════════════════════════════════════════════╝

🔐 Password: {REMOTE_PASSWORD}
📺 Test page: http://localhost:{PORT}
🔌 WebRTC endpoint: http://localhost:{PORT}/offer

💡 This server runs separately from the main control server.
   Start both for full functionality:
   - python server.py (port 8080) - Controls
   - python screen_server.py (port 8081) - Screen streaming

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
