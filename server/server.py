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
import pyautogui

PORT = 8080

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def get_current_volume() -> int:
    """Get current macOS volume (0-100)"""
    try:
        script = 'output volume of (get volume settings)'
        result = subprocess.run(['osascript', '-e', script], check=True, capture_output=True, text=True)
        volume = int(result.stdout.strip())
        return volume
    except Exception as e:
        logger.error(f'❌ Failed to get volume: {e}')
        return 50  # Default fallback

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
            # Get the actual volume after setting it
            actual_volume = get_current_volume()
            logger.info(f'🔊 Volume set to {actual_volume}%')
            return {"status": "ok", "volume": actual_volume}
        
        elif command == 'togglePlayPause':
            # Send space key to the frontmost application
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
            # Forward 10s - Shift+Right arrow
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
            # Backward 10s - Shift+Left arrow
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
            # Toggle fullscreen - F key
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
            # Execute next episode script
            execute_episode_script('next')
            logger.info(f'➡️ Next episode triggered')
        
        elif command == 'prevEpisode':
            # Execute previous episode script
            execute_episode_script('prev')
            logger.info(f'⬅️ Previous episode triggered')
        
        elif command == 'moveMouse':
            # Move mouse relative to current position
            dx = int(cmd.get('dx', 0))
            dy = int(cmd.get('dy', 0))
            move_mouse(dx, dy)
            logger.info(f'🖱️ Mouse moved: dx={dx}, dy={dy}')
        
        elif command == 'mouseLeftClick':
            # Left click
            mouse_left_click()
            logger.info(f'🖱️ Left click')
        
        elif command == 'mouseRightClick':
            # Right click
            mouse_right_click()
            logger.info(f'🖱️ Right click')
        
        elif command == 'resetMouse':
            # Reset mouse to center
            logger.info(f'🖱️ Mouse reset')
        
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
        # Step 1: Execute the appropriate episode change script
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

    const s = window.currentSeason, e = window.currentEpisode;
    if (s != null && e != null) {
      console.log(`➡️ Épisode actuel: S${String(s).padStart(2,'0')}E${String(e).padStart(2,'0')}`);
    }
  } catch (err) {
    console.error('NEXT snippet error:', err);
  }
})();"""
        else:  # prev
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

    const s = window.currentSeason, e = window.currentEpisode;
    if (s != null && e != null) {
      console.log(`⬅️ Épisode actuel: S${String(s).padStart(2,'0')}E${String(e).padStart(2,'0')}`);
    }
  } catch (err) {
    console.error('PREV snippet error:', err);
  }
})();"""
        
        # Step 2: Inject JavaScript in the browser via AppleScript
        inject_javascript(episode_script)
        
        # Small delay for the script to execute
        import time
        time.sleep(0.5)
        
        # Step 3: Execute fullscreen script
        fullscreen_script = """(() => {
  const el =
    document.getElementById('videoFrame') ||
    document.getElementById('videoModal') ||
    document.documentElement;

  const req =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;

  if (req) req.call(el);
  else console.warn('Fullscreen API indisponible sur cet élément.');
})();"""
        
        inject_javascript(fullscreen_script)
        
    except Exception as e:
        logger.error(f'❌ Episode script execution failed: {e}')

def inject_javascript(js_code: str):
    """Inject JavaScript code into the browser using DevTools console"""
    try:
        # Step 1: Open DevTools console (Cmd+Option+J)
        open_script = '''
        tell application "System Events"
            tell process (first application process whose frontmost is true)
                keystroke "j" using {command down, option down}
            end tell
        end tell
        '''
        subprocess.run(['osascript', '-e', open_script], check=True, capture_output=True)
        logger.info(f'🔧 DevTools console opened')
        
        import time
        time.sleep(0.3)
        
        # Step 2: Paste and execute the JavaScript code
        paste_script = f'''
        tell application "System Events"
            set the clipboard to "{js_code.replace('"', '\\\\"')}"
            tell process (first application process whose frontmost is true)
                keystroke "v" using command down
                delay 0.1
                key code 36
            end tell
        end tell
        '''
        subprocess.run(['osascript', '-e', paste_script], check=True, capture_output=True)
        logger.info(f'✅ JavaScript code executed in console')
        
        time.sleep(0.2)
        
        # Step 3: Close DevTools console (Cmd+Option+J)
        close_script = '''
        tell application "System Events"
            tell process (first application process whose frontmost is true)
                keystroke "j" using {command down, option down}
            end tell
        end tell
        '''
        subprocess.run(['osascript', '-e', close_script], check=True, capture_output=True)
        logger.info(f'🔧 DevTools console closed')
        
    except Exception as e:
        logger.error(f'❌ Failed to inject JavaScript: {e}')

def move_mouse(dx: int, dy: int):
    """Move mouse relative to current position using PyAutoGUI"""
    try:
        current_x, current_y = pyautogui.position()
        new_x = current_x + dx
        new_y = current_y + dy
        pyautogui.moveTo(new_x, new_y, duration=0.05)
        logger.info(f'🖱️ Mouse moved by ({dx}, {dy}) to ({new_x}, {new_y})')
    except Exception as e:
        logger.error(f'❌ Failed to move mouse: {e}')


def mouse_left_click():
    """Simulate a left mouse click using PyAutoGUI"""
    try:
        pyautogui.click()
        logger.info(f'🖱️ Left click performed')
    except Exception as e:
        logger.error(f'❌ Failed to perform left click: {e}')


def mouse_right_click():
    """Simulate a right mouse click using PyAutoGUI"""
    try:
        pyautogui.rightClick()
        logger.info(f'🖱️ Right click performed')
    except Exception as e:
        logger.error(f'❌ Failed to perform right click: {e}')

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

    # Send current volume on connection
    current_volume = get_current_volume()
    await ws.send_json({"type": "volumeUpdate", "volume": current_volume})
    logger.info(f'📤 Sent current volume: {current_volume}%')

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

                    # If volume was updated, send volumeUpdate message
                    if result.get('volume') is not None:
                        await ws.send_json({"type": "volumeUpdate", "volume": result['volume']})
                        logger.info(f'📤 Sent volume update: {result["volume"]}%')
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
