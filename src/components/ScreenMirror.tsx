import { useState, useEffect, useRef, useCallback } from "react";
import { Joystick } from "react-joystick-component";
import {
  Monitor,
  Maximize2,
  Minimize2,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  MousePointer,
  MousePointerClick,
  Settings,
} from "lucide-react";

interface ScreenMirrorProps {
  serverUrl: string;
  screenServerPort?: number;
}

type ConnectionState = "disconnected" | "connecting" | "streaming" | "failed";

export default function ScreenMirror({
  serverUrl,
  screenServerPort = 8081,
}: ScreenMirrorProps) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sensitivity, setSensitivity] = useState(15);
  const [showControls, setShowControls] = useState(true);
  const [stats, setStats] = useState({ fps: 0, frames: 0 });
  const [quality, setQuality] = useState(60);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const screenWsRef = useRef<WebSocket | null>(null);
  const controlWsRef = useRef<WebSocket | null>(null);
  const lastSendTime = useRef<number>(0);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  // Build screen server WebSocket URL
  const getScreenWsUrl = useCallback(() => {
    const cleanUrl = serverUrl
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .trim();
    const host = cleanUrl.split(":")[0];

    // For ngrok/tunnels - screen server needs separate tunnel
    if (cleanUrl.includes(".ngrok") || cleanUrl.includes(".ts.net")) {
      // Use same protocol but warn user
      const protocol = "wss:";
      return `${protocol}//${cleanUrl.replace(":8080", "")}/ws`;
    }

    // For local network
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${host}:${screenServerPort}/ws`;
  }, [serverUrl, screenServerPort]);

  // Connect to screen streaming server
  const connectScreen = useCallback(() => {
    if (screenWsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState("connecting");
    const wsUrl = getScreenWsUrl();
    console.log("Connecting to screen server:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      screenWsRef.current = ws;

      ws.onopen = () => {
        console.log("Screen WebSocket connected");
        // Authenticate
        const password = localStorage.getItem("remotePassword") || "";
        ws.send(JSON.stringify({ command: "auth", password }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "authSuccess":
              console.log("Screen server authenticated");
              // Start streaming
              ws.send(
                JSON.stringify({
                  command: "startStream",
                  width: 1280,
                  height: 720,
                  fps: 30,
                  quality: quality,
                }),
              );
              break;

            case "authFailed":
              console.error("Screen auth failed");
              setConnectionState("failed");
              break;

            case "streamStarted":
              console.log("Stream started:", data);
              setConnectionState("streaming");
              frameCountRef.current = 0;
              startTimeRef.current = Date.now();
              break;

            case "frame":
              // Display frame
              if (imgRef.current) {
                imgRef.current.src = `data:image/jpeg;base64,${data.data}`;
              }
              frameCountRef.current++;

              // Update FPS stats
              if (startTimeRef.current) {
                const elapsed = (Date.now() - startTimeRef.current) / 1000;
                const fps = frameCountRef.current / elapsed;
                setStats({
                  fps: Math.round(fps),
                  frames: frameCountRef.current,
                });
              }
              break;

            case "streamStopped":
              setConnectionState("disconnected");
              break;
          }
        } catch (e) {
          console.error("Failed to parse screen message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("Screen WebSocket error:", error);
        setConnectionState("failed");
      };

      ws.onclose = () => {
        console.log("Screen WebSocket closed");
        if (connectionState === "streaming") {
          setConnectionState("disconnected");
        }
      };
    } catch (error) {
      console.error("Failed to connect to screen server:", error);
      setConnectionState("failed");
    }
  }, [getScreenWsUrl, quality, connectionState]);

  // Disconnect from screen server
  const disconnectScreen = useCallback(() => {
    if (screenWsRef.current) {
      if (screenWsRef.current.readyState === WebSocket.OPEN) {
        screenWsRef.current.send(JSON.stringify({ command: "stopStream" }));
      }
      screenWsRef.current.close();
      screenWsRef.current = null;
    }
    setConnectionState("disconnected");
    setStats({ fps: 0, frames: 0 });
  }, []);

  // Connect to main server for mouse control
  useEffect(() => {
    const connectControl = () => {
      const cleanUrl = serverUrl
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .trim();
      const needsSecure =
        window.location.protocol === "https:" ||
        cleanUrl.includes(".ngrok") ||
        cleanUrl.includes(".ts.net");
      const protocol = needsSecure ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${cleanUrl}/ws`;

      const ws = new WebSocket(wsUrl);
      controlWsRef.current = ws;

      ws.onopen = () => {
        console.log("Control WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "authRequired") {
            const password = localStorage.getItem("remotePassword");
            if (password) {
              ws.send(JSON.stringify({ command: "auth", password }));
            }
          }
        } catch (e) {
          console.error("Control parse error:", e);
        }
      };

      ws.onclose = () => {
        setTimeout(connectControl, 3000);
      };
    };

    connectControl();

    return () => {
      controlWsRef.current?.close();
    };
  }, [serverUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectScreen();
    };
  }, [disconnectScreen]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error("Fullscreen error:", e);
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Send mouse command
  const sendCommand = (command: string, value?: object) => {
    if (
      !controlWsRef.current ||
      controlWsRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    controlWsRef.current.send(JSON.stringify({ command, ...value }));
  };

  // Joystick handler
  const handleJoystickMove = (event: { x?: number; y?: number }) => {
    const now = Date.now();
    if (now - lastSendTime.current > 50) {
      const moveX = event.x ? Math.round(event.x * sensitivity) : 0;
      const moveY = event.y ? Math.round(-event.y * sensitivity) : 0;

      if (moveX !== 0 || moveY !== 0) {
        sendCommand("moveMouse", { dx: moveX, dy: moveY });
        lastSendTime.current = now;
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Video display */}
      <div
        className={`relative bg-black rounded-lg overflow-hidden ${
          isFullscreen ? "fixed inset-0 z-50" : "aspect-video"
        }`}
        onClick={() => isFullscreen && setShowControls(!showControls)}
      >
        {connectionState === "streaming" ? (
          <img
            ref={imgRef}
            alt="Screen stream"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Monitor size={64} className="mb-4 opacity-50" />
            <p className="text-lg">
              {connectionState === "connecting"
                ? "Connexion..."
                : connectionState === "failed"
                  ? "Connexion échouée"
                  : "Cliquez sur Connect"}
            </p>
            {connectionState === "failed" && (
              <p className="text-sm mt-2 text-red-400">
                Vérifiez que screen_server.py tourne sur le port{" "}
                {screenServerPort}
              </p>
            )}
          </div>
        )}

        {/* Stats overlay */}
        {connectionState === "streaming" && (
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-green-400">
            {stats.fps} FPS
          </div>
        )}

        {/* Fullscreen controls overlay */}
        {isFullscreen && showControls && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              {/* Joystick */}
              <div className="flex-shrink-0">
                <Joystick
                  size={120}
                  sticky={false}
                  baseColor="rgba(55, 65, 81, 0.8)"
                  stickColor="rgba(59, 130, 246, 1)"
                  move={handleJoystickMove}
                  stop={() => {}}
                  throttle={50}
                />
              </div>

              {/* Click buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => sendCommand("mouseLeftClick")}
                  className="p-4 bg-blue-600/80 hover:bg-blue-700 rounded-full transition-colors active:scale-95"
                >
                  <MousePointerClick size={24} className="text-white" />
                </button>
                <button
                  onClick={() => sendCommand("mouseRightClick")}
                  className="p-4 bg-red-600/80 hover:bg-red-700 rounded-full transition-colors active:scale-95"
                >
                  <MousePointer size={24} className="text-white" />
                </button>
              </div>

              {/* Exit fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-3 bg-gray-700/80 hover:bg-gray-600 rounded-full transition-colors"
              >
                <Minimize2 size={20} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls (non-fullscreen) */}
      {!isFullscreen && (
        <div className="mt-4 space-y-4">
          {/* Connection status */}
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-700">
            <div className="flex items-center gap-2">
              {connectionState === "streaming" ? (
                <Wifi size={18} className="text-green-500" />
              ) : (
                <WifiOff size={18} className="text-red-500" />
              )}
              <span className="text-sm text-gray-300">
                {connectionState === "streaming"
                  ? `Streaming (${stats.fps} FPS)`
                  : connectionState === "connecting"
                    ? "Connexion..."
                    : "Déconnecté"}
              </span>
            </div>

            {connectionState === "streaming" ? (
              <button
                onClick={disconnectScreen}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={connectScreen}
                disabled={connectionState === "connecting"}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors flex items-center gap-1"
              >
                {connectionState === "connecting" ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Monitor size={14} />
                )}
                Connect
              </button>
            )}
          </div>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            disabled={connectionState !== "streaming"}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Maximize2 size={20} />
            Plein écran avec contrôles
          </button>

          {/* Quality slider */}
          <div className="space-y-3 bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Settings size={18} />
                Qualité JPEG
              </label>
              <span className="text-sm font-bold text-blue-400">
                {quality}%
              </span>
            </div>

            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-xs text-gray-500">
              <span>Rapide</span>
              <span>Équilibré</span>
              <span>Qualité</span>
            </div>
          </div>

          {/* Sensitivity slider */}
          <div className="space-y-3 bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Zap size={18} />
                Vitesse souris
              </label>
              <span className="text-sm font-bold text-blue-400">
                {sensitivity}
              </span>
            </div>

            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-xs text-gray-500">
              <span>Précis</span>
              <span>Normal</span>
              <span>Rapide</span>
            </div>
          </div>

          {/* Quick mouse controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => sendCommand("mouseLeftClick")}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <MousePointerClick size={18} />
              Clic Gauche
            </button>

            <button
              onClick={() => sendCommand("mouseRightClick")}
              className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <MousePointer size={18} />
              Clic Droit
            </button>
          </div>

          {/* Joystick for non-fullscreen mode */}
          {connectionState === "streaming" && (
            <div className="flex flex-col items-center justify-center space-y-2 bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Contrôle souris</p>
              <Joystick
                size={150}
                sticky={false}
                baseColor="rgba(55, 65, 81, 1)"
                stickColor="rgba(59, 130, 246, 1)"
                move={handleJoystickMove}
                stop={() => {}}
                throttle={50}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
