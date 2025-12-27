#!/usr/bin/env python3
"""
HTTP + WebSocket server for Video Remote Controller using aiohttp
With QR code, password auth, and tunnel support
"""
import asyncio
import socket
import json
import subprocess
import os
from pathlib import Path
from aiohttp import web
import logging
import pyautogui
import segno
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PORT = 8080
REMOTE_PASSWORD = os.getenv('REMOTE_PASSWORD', 'changeme')

# Track authenticated sessions
authenticated_clients = set()

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


def print_qr_code(url: str):
    """Print QR code in terminal"""
    qr = segno.make(url)
    qr.terminal(compact=True)


def get_current_volume() -> int:
    """Get current macOS volume (0-100)"""
    try:
        script = 'output volume of (get volume settings)'
        result = subprocess.run(['osascript', '-e', script], check=True, capture_output=True, text=True)
        volume = int(result.stdout.strip())
        return volume
    except Exception as e:
        logger.error(f'❌ Failed to get volume: {e}')
        return 50


def execute_command(cmd: dict):
    """Execute system commands to control Mac"""
    command = cmd.get('command')
    value = cmd.get('value')

    try:
        if command == 'setVolume':
            volume = max(0, min(100, value))
            script = f'set volume output volume {volume}'
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            actual_volume = get_current_volume()
            logger.info(f'🔊 Volume set to {actual_volume}%')
            return {"status": "ok", "volume": actual_volume}

        elif command == 'togglePlayPause':
            script = '''
            tell application "System Events"
                tell process (first application process whose frontmost is true)
                    key code 49
                end tell
            end tell
            '''
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            logger.info(f'🎬 Play/Pause toggled')

        elif command == 'skipForward':
            script = '''
            tell application "System Events"
                tell process (first application process whose frontmost is true)
                    key code 124 using shift down
                end tell
            end tell
            '''
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            logger.info(f'⏩ Skip forward')

        elif command == 'skipBackward':
            script = '''
            tell application "System Events"
                tell process (first application process whose frontmost is true)
                    key code 123 using shift down
                end tell
            end tell
            '''
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            logger.info(f'⏪ Skip backward')

        elif command == 'fullscreen':
            script = '''
            tell application "System Events"
                tell process (first application process whose frontmost is true)
                    key code 3
                end tell
            end tell
            '''
            subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
            logger.info(f'🖥️ Fullscreen toggled')

        elif command == 'nextEpisode':
            execute_episode_script('next')
            logger.info(f'➡️ Next episode triggered')

        elif command == 'prevEpisode':
            execute_episode_script('prev')
            logger.info(f'⬅️ Previous episode triggered')

        elif command == 'moveMouse':
            dx = int(cmd.get('dx', 0))
            dy = int(cmd.get('dy', 0))
            move_mouse(dx, dy)

        elif command == 'mouseLeftClick':
            mouse_left_click()

        elif command == 'mouseRightClick':
            mouse_right_click()

        elif command == 'resetMouse':
            pass

        return {"status": "ok"}

    except subprocess.CalledProcessError as e:
        logger.error(f'❌ Command failed: {e}')
        return {"status": "error", "message": str(e)}
    except Exception as e:
        logger.error(f'❌ Unexpected error: {e}')
        return {"status": "error", "message": str(e)}


def execute_episode_script(direction: str):
    """Execute episode navigation script via JavaScript injection"""
    try:
        if direction == 'next':
            episode_script = """(() => {
  try {
    const modal = document.getElementById('videoModal');
    const wasOpen = modal && modal.classList.contains('active');
    if (typeof window.changeEpisode === 'function') {
      window.changeEpisode('next');
    } else {
      document.getElementById('modalNextEpisodeBtn')?.click();
    }
    if (!wasOpen && typeof window.openVideoModal === 'function') {
      window.openVideoModal();
    }
  } catch (err) { console.error('NEXT error:', err); }
})();"""
        else:
            episode_script = """(() => {
  try {
    const modal = document.getElementById('videoModal');
    const wasOpen = modal && modal.classList.contains('active');
    if (typeof window.changeEpisode === 'function') {
      window.changeEpisode('prev');
    } else {
      document.getElementById('modalPrevEpisodeBtn')?.click();
    }
    if (!wasOpen && typeof window.openVideoModal === 'function') {
      window.openVideoModal();
    }
  } catch (err) { console.error('PREV error:', err); }
})();"""

        fullscreen_script = """(() => {
  const el = document.getElementById('videoFrame') || document.getElementById('videoModal') || document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (req) req.call(el);
})();"""

        inject_javascript(episode_script + "\n" + fullscreen_script)

    except Exception as e:
        logger.error(f'❌ Episode script execution failed: {e}')


def inject_javascript(js_code: str):
    """Inject JavaScript code into the browser using DevTools console"""
    import time
    try:
        # Open DevTools console (Cmd+Option+J)
        open_script = '''
        tell application "System Events"
            tell process (first application process whose frontmost is true)
                keystroke "j" using {command down, option down}
            end tell
        end tell
        '''
        subprocess.run(['osascript', '-e', open_script], check=True, capture_output=True)
        time.sleep(0.3)

        # Paste and execute
        escaped_js = js_code.replace('"', '\\"')
        paste_script = f'''
        tell application "System Events"
            set the clipboard to "{escaped_js}"
            tell process (first application process whose frontmost is true)
                keystroke "v" using command down
                delay 0.1
                key code 36
            end tell
        end tell
        '''
        subprocess.run(['osascript', '-e', paste_script], check=True, capture_output=True)
        time.sleep(0.2)

        # Close DevTools
        subprocess.run(['osascript', '-e', open_script], check=True, capture_output=True)

    except Exception as e:
        logger.error(f'❌ Failed to inject JavaScript: {e}')


def move_mouse(dx: int, dy: int):
    """Move mouse relative to current position"""
    try:
        current_x, current_y = pyautogui.position()
        pyautogui.moveTo(current_x + dx, current_y + dy, duration=0.05)
    except Exception as e:
        logger.error(f'❌ Failed to move mouse: {e}')


def mouse_left_click():
    try:
        pyautogui.click()
    except Exception as e:
        logger.error(f'❌ Failed to perform left click: {e}')


def mouse_right_click():
    try:
        pyautogui.rightClick()
    except Exception as e:
        logger.error(f'❌ Failed to perform right click: {e}')


async def handle_index(request):
    """Serve index.html for the web app"""
    dist_path = Path('..') if Path('../dist').exists() else Path('.')
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
    dist_path = Path('..') if Path('../dist').exists() else Path('.')
    file_path = dist_path / 'dist' / path

    if file_path.exists() and file_path.is_file():
        content_type = get_content_type(str(file_path))
        with open(file_path, 'rb') as f:
            return web.Response(body=f.read(), content_type=content_type)
    return web.Response(text="404 Not Found", status=404)


def get_content_type(file_path: str) -> str:
    """Get content type based on file extension"""
    extensions = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
    }
    for ext, mime in extensions.items():
        if file_path.endswith(ext):
            return mime
    return 'application/octet-stream'


async def websocket_handler(request):
    """Handle WebSocket connections with password authentication"""
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    client_id = id(ws)
    logger.info(f'🔌 New WebSocket connection: {request.remote}')

    # Request authentication
    await ws.send_json({"type": "authRequired"})

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)

                    # Handle authentication
                    if data.get('command') == 'auth':
                        password = data.get('password', '')
                        if password == REMOTE_PASSWORD:
                            authenticated_clients.add(client_id)
                            await ws.send_json({"type": "authSuccess"})
                            logger.info(f'✅ Client authenticated: {request.remote}')

                            # Send current volume after auth
                            current_volume = get_current_volume()
                            await ws.send_json({"type": "volumeUpdate", "volume": current_volume})
                        else:
                            await ws.send_json({"type": "authFailed", "message": "Invalid password"})
                            logger.warning(f'❌ Auth failed for: {request.remote}')
                        continue

                    # Check if authenticated
                    if client_id not in authenticated_clients:
                        await ws.send_json({"type": "authRequired"})
                        continue

                    # Execute command
                    result = execute_command(data)
                    await ws.send_json(result)

                    if result.get('volume') is not None:
                        await ws.send_json({"type": "volumeUpdate", "volume": result['volume']})

                except json.JSONDecodeError:
                    await ws.send_json({"status": "error", "message": "Invalid JSON"})

            elif msg.type == web.WSMsgType.ERROR:
                logger.error(f'❌ WebSocket error: {ws.exception()}')

    except Exception as e:
        logger.error(f'❌ Connection error: {e}')
    finally:
        authenticated_clients.discard(client_id)
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
    local_url = f'http://{ip}:{PORT}'

    print(f"""
╔════════════════════════════════════════════════════════════╗
║      📺 Video Remote Controller Server                     ║
╚════════════════════════════════════════════════════════════╝

🔐 Password: {REMOTE_PASSWORD}

✅ Server: {local_url}
🔌 WebSocket: ws://{ip}:{PORT}/ws

📱 Scan QR code to connect:
""")

    print_qr_code(local_url)

    print(f"""
⚠️  Same WiFi required for local mode

🌍 For remote access with STABLE URL, run in another terminal:
   tailscale funnel {PORT}

   This gives you a permanent URL like:
   https://your-machine.tailnet-name.ts.net

Press Ctrl+C to stop the server
""")

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()

    logger.info(f'🚀 Server started on port {PORT}')

    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        print("\n\n✋ Server stopped")
    finally:
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
