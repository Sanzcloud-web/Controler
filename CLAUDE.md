# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Video Remote Controller - A macOS multimedia remote control system using WebSocket communication. Control video playback, volume, and mouse from a mobile phone over WiFi.

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
python3 server.py
```

### Production Flow
1. Build frontend: `npm run build`
2. Start server: `npm run server`
3. Access via `http://<mac-ip>:8080` from phone

## Architecture

### Two-Process Design
- **Python Server** (`server/server.py`): WebSocket server on port 8080 that serves the React app and handles commands
- **React Frontend** (`src/`): Mobile-optimized UI that connects to the server via WebSocket

### Communication Flow
```
Phone Browser → WebSocket (port 8080) → Python Server → macOS (AppleScript/PyAutoGUI)
```

### Key Components

**Frontend (`src/components/`):**
- `Home.tsx`: Main container with tab navigation between Video and Mouse controllers
- `VideoController.tsx`: Playback controls (play/pause, skip, volume, fullscreen, episode navigation)
- `MouseController.tsx`: Virtual joystick for cursor control, left/right click buttons

**Backend (`server/server.py`):**
- `execute_command()`: Routes WebSocket commands to appropriate handlers
- Uses AppleScript for media controls (sends key codes to frontmost app)
- Uses PyAutoGUI for mouse control
- `inject_javascript()`: Episode navigation via DevTools console injection

### WebSocket Protocol
All commands follow this structure:
```json
{"command": "commandName", "value": optionalValue}
```

Commands: `togglePlayPause`, `setVolume`, `skipForward`, `skipBackward`, `fullscreen`, `nextEpisode`, `prevEpisode`, `moveMouse` (with dx/dy), `mouseLeftClick`, `mouseRightClick`

## Important Details

- Server binds to `0.0.0.0:8080` - accessible from any device on the local network
- Volume is synchronized bidirectionally (server sends current volume on WebSocket connect)
- Mouse movement uses relative coordinates with configurable sensitivity
- Episode navigation works by injecting JavaScript into Chrome DevTools console
- Frontend uses `window.location.hostname` to auto-detect server IP
