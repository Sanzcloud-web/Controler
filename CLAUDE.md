# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Video Remote Controller - A macOS multimedia remote control system using WebSocket communication. Control video playback, volume, and mouse from a mobile phone over WiFi or remotely via ngrok tunnel.

## Quick Start (Raycast Snippet)

```bash
osascript -e 'tell app "Terminal" to do script "cd ~/Desktop/APP/Controler && source venv/bin/activate && cd server && python3 server.py"' -e 'tell app "Terminal" to do script "sleep 2 && ngrok http 8080"'
```

## Commands

### Development
```bash
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Build frontend to dist/
npm run server       # Start Python WebSocket server (port 8080)
```

### Backend Setup
```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 server.py          # Main control server (port 8080)
python3 screen_server.py   # Screen streaming server (port 8081) - run in separate terminal
```

### Deployment
```bash
npm run build
vercel --prod --yes   # Deploy frontend to Vercel
```

## Architecture

### Four-Part Design
- **Python Server** (`server/server.py`): WebSocket server on port 8080 with password auth, QR code generation, ngrok detection
- **Screen Server** (`server/screen_server.py`): WebRTC server on port 8081 for real-time screen streaming (30-60 fps)
- **React Frontend** (`src/`): Mobile-optimized UI with QR scanner, deployed to Vercel
- **ngrok Tunnel**: Exposes local server to internet for remote access

### Communication Flow
```
Phone Browser → Vercel Frontend → WebSocket (wss://) → ngrok → Python Server → macOS
```

### Key Components

**Frontend (`src/components/`):**
- `Home.tsx`: Authentication flow, QR code scanner, connection management, localStorage persistence
- `VideoController.tsx`: Playback controls (play/pause, skip, volume, fullscreen, episode navigation)
- `MouseController.tsx`: Virtual joystick for cursor control, left/right click buttons
- `ScreenMirror.tsx`: Real-time screen viewing with WebRTC, integrated joystick for mouse control, fullscreen mode

**Backend (`server/server.py`):**
- Password authentication via `.env` file (`REMOTE_PASSWORD`)
- QR code generation using `segno` library
- Auto-detection of ngrok URL via local API (`http://127.0.0.1:4040/api/tunnels`)
- `execute_command()`: Routes WebSocket commands to appropriate handlers
- Uses AppleScript for media controls (sends key codes to frontmost app)
- Uses PyAutoGUI for mouse control

**Screen Server (`server/screen_server.py`):**
- WebRTC server using `aiortc` for low-latency video streaming
- Screen capture using `mss` library (fast, cross-platform)
- Configurable resolution and FPS (default: 1280x720 @ 30fps)
- Password authentication (same as main server)
- Runs on port 8081 (separate from main server)

### WebSocket Protocol

**Authentication:**
```json
// Server sends
{"type": "authRequired"}
// Client responds
{"command": "auth", "password": "..."}
// Server confirms
{"type": "authSuccess"} or {"type": "authFailed"}
```

**Commands:**
```json
{"command": "commandName", "value": optionalValue}
```

Commands: `togglePlayPause`, `setVolume`, `skipForward`, `skipBackward`, `fullscreen`, `nextEpisode`, `prevEpisode`, `moveMouse` (with dx/dy), `mouseLeftClick`, `mouseRightClick`

## Configuration

### Environment Variables (`server/.env`)
```
REMOTE_PASSWORD=your_password_here
```

### Key URLs
- **Vercel Frontend**: https://smart-remote-bay.vercel.app
- **Local Server**: http://<mac-ip>:8080
- **ngrok Dashboard**: http://127.0.0.1:4040

## Important Details

- Server binds to `0.0.0.0:8080` - accessible from any device on the local network
- Password and connection URL saved in `localStorage` for 2 days
- Uses `wss://` automatically when page loaded over HTTPS or via ngrok/Tailscale
- ngrok URL changes each restart (free tier limitation)
- QR code scanner uses `@yudiel/react-qr-scanner` for iOS compatibility
- Volume is synchronized bidirectionally (server sends current volume on auth success)
- Mouse movement uses relative coordinates with configurable sensitivity
- Episode navigation works by injecting JavaScript into Chrome DevTools console

## Dependencies

**Frontend:**
- React + TypeScript + Vite
- Tailwind CSS
- `@yudiel/react-qr-scanner` - QR code scanning
- `react-joystick-component` - Mouse control joystick
- `lucide-react` - Icons

**Backend:**
- `aiohttp` - Async HTTP/WebSocket server
- `pyautogui` - Mouse control
- `segno` - QR code generation
- `python-dotenv` - Environment variables
- `aiortc` - WebRTC implementation for Python (screen streaming)
- `mss` - Fast cross-platform screen capture
- `numpy` + `Pillow` - Image processing
- `av` - Video frame encoding
