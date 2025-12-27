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
} from "lucide-react";

interface ScreenMirrorProps {
  serverUrl: string;
  screenServerPort?: number;
}

type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";

export default function ScreenMirror({
  serverUrl,
  screenServerPort = 8081,
}: ScreenMirrorProps) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sensitivity, setSensitivity] = useState(15);
  const [showControls, setShowControls] = useState(true);
  const [stats, setStats] = useState({ fps: 0, latency: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastSendTime = useRef<number>(0);
  const statsIntervalRef = useRef<number | null>(null);

  // Build screen server URL
  const getScreenServerUrl = useCallback(() => {
    const cleanUrl = serverUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // For ngrok/tunnel, we need to use the same host but different port won't work
    // So we'll use the main server URL and expect screen_server to run on a subdomain or same host
    if (cleanUrl.includes(".ngrok") || cleanUrl.includes(".ts.net")) {
      // For tunnels, replace the port or use path-based routing
      // This assumes ngrok is configured to forward to screen_server
      const protocol = "https:";
      return `${protocol}//${cleanUrl.replace(":8080", "")}`;
    }

    // For local network
    const host = cleanUrl.split(":")[0];
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    return `${protocol}//${host}:${screenServerPort}`;
  }, [serverUrl, screenServerPort]);

  // Connect to WebRTC
  const connect = useCallback(async () => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    setConnectionState("connecting");

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log("Received track:", event.track.kind);
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        switch (pc.connectionState) {
          case "connected":
            setConnectionState("connected");
            startStatsMonitoring();
            break;
          case "disconnected":
          case "failed":
            setConnectionState("failed");
            stopStatsMonitoring();
            break;
          case "closed":
            setConnectionState("disconnected");
            stopStatsMonitoring();
            break;
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
      };

      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false,
      });
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", checkState);
          // Timeout after 5 seconds
          setTimeout(resolve, 5000);
        }
      });

      // Send offer to server
      const screenServerUrl = getScreenServerUrl();
      const storedPassword = localStorage.getItem("remotePassword") || "";

      console.log("Connecting to screen server:", screenServerUrl);

      const response = await fetch(`${screenServerUrl}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: pc.localDescription?.sdp,
          type: pc.localDescription?.type,
          password: storedPassword,
          width: 1280,
          height: 720,
          fps: 30,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Connection failed");
      }

      const answer = await response.json();
      await pc.setRemoteDescription(
        new RTCSessionDescription({
          sdp: answer.sdp,
          type: answer.type,
        }),
      );

      console.log("WebRTC connection established");
    } catch (error) {
      console.error("Failed to connect:", error);
      setConnectionState("failed");
    }
  }, [getScreenServerUrl]);

  // Stats monitoring
  const startStatsMonitoring = () => {
    if (statsIntervalRef.current) return;

    statsIntervalRef.current = window.setInterval(async () => {
      if (!pcRef.current) return;

      try {
        const stats = await pcRef.current.getStats();
        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.kind === "video") {
            const fps = report.framesPerSecond || 0;
            setStats((prev) => ({ ...prev, fps: Math.round(fps) }));
          }
        });
      } catch (e) {
        // Ignore stats errors
      }
    }, 1000);
  };

  const stopStatsMonitoring = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  };

  // Disconnect
  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopStatsMonitoring();
    setConnectionState("disconnected");
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

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

  // Connect to main WebSocket for mouse control
  useEffect(() => {
    const connectWs = () => {
      const cleanUrl = serverUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const needsSecure =
        window.location.protocol === "https:" ||
        cleanUrl.includes(".ngrok") ||
        cleanUrl.includes(".ts.net");
      const protocol = needsSecure ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${cleanUrl}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Mouse control WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "authRequired") {
            const storedPassword = localStorage.getItem("remotePassword");
            if (storedPassword) {
              ws.send(
                JSON.stringify({ command: "auth", password: storedPassword }),
              );
            }
          }
        } catch (e) {
          console.error("Failed to parse message:", e);
        }
      };

      ws.onclose = () => {
        setTimeout(connectWs, 3000);
      };
    };

    connectWs();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [serverUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

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
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    wsRef.current.send(JSON.stringify({ command, ...value }));
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
        {connectionState === "connected" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Monitor size={64} className="mb-4 opacity-50" />
            <p className="text-lg">
              {connectionState === "connecting"
                ? "Connecting..."
                : connectionState === "failed"
                  ? "Connection failed"
                  : "Click Connect to start"}
            </p>
          </div>
        )}

        {/* Stats overlay */}
        {connectionState === "connected" && (
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
              {connectionState === "connected" ? (
                <Wifi size={18} className="text-green-500" />
              ) : (
                <WifiOff size={18} className="text-red-500" />
              )}
              <span className="text-sm text-gray-300">
                {connectionState === "connected"
                  ? `Connected (${stats.fps} FPS)`
                  : connectionState === "connecting"
                    ? "Connecting..."
                    : "Disconnected"}
              </span>
            </div>

            {connectionState === "connected" ? (
              <button
                onClick={disconnect}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={connect}
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
            disabled={connectionState !== "connected"}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Maximize2 size={20} />
            Plein écran avec contrôles
          </button>

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
              disabled={connectionState !== "connected"}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <MousePointerClick size={18} />
              Clic Gauche
            </button>

            <button
              onClick={() => sendCommand("mouseRightClick")}
              disabled={connectionState !== "connected"}
              className="py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <MousePointer size={18} />
              Clic Droit
            </button>
          </div>

          {/* Joystick for non-fullscreen mode */}
          {connectionState === "connected" && (
            <div className="flex flex-col items-center justify-center space-y-2 bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400">
                Contrôle souris (ou utilisez le plein écran)
              </p>
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
