import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  VolumeX,
  Volume2,
  Maximize,
  Circle,
} from "lucide-react";

interface VideoControllerProps {
  serverUrl: string;
  isLocalMode: boolean;
}

export default function VideoController({
  serverUrl,
  isLocalMode,
}: VideoControllerProps) {
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const forwardIntervalRef = useRef<number | null>(null);
  const backwardIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    connectToServer();

    return () => {
      if (forwardIntervalRef.current) {
        clearTimeout(forwardIntervalRef.current);
        clearInterval(forwardIntervalRef.current);
      }
      if (backwardIntervalRef.current) {
        clearTimeout(backwardIntervalRef.current);
        clearInterval(backwardIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [serverUrl]);

  const connectToServer = () => {
    try {
      const cleanUrl = serverUrl
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .trim();
      // Use wss:// if page is loaded over HTTPS or if using secure tunnels
      const needsSecure =
        window.location.protocol === "https:" ||
        cleanUrl.includes(".ngrok") ||
        cleanUrl.includes(".ts.net");
      const protocol = needsSecure ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${cleanUrl}/ws`;

      console.log("VideoController connecting to:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ VideoController connected");
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
          } else if (data.type === "authSuccess") {
            setConnected(true);
          } else if (
            data.type === "volumeUpdate" &&
            typeof data.volume === "number"
          ) {
            setVolume(data.volume);
          }
        } catch (error) {
          console.error("❌ Failed to parse message:", error);
        }
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(() => connectToServer(), 3000);
      };
    } catch (error) {
      console.error("Connection failed:", error);
      setConnected(false);
    }
  };

  const sendCommand = (command: string, value?: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    wsRef.current.send(JSON.stringify({ command, value }));
  };

  const handlePlayPause = () => {
    sendCommand("togglePlayPause");
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    sendCommand("setVolume", value);
  };

  const handleSkipForwardStart = () => {
    sendCommand("skipForward");
    forwardIntervalRef.current = window.setTimeout(() => {
      forwardIntervalRef.current = window.setInterval(() => {
        sendCommand("skipForward");
      }, 200);
    }, 250);
  };

  const handleSkipForwardEnd = () => {
    if (forwardIntervalRef.current) {
      clearTimeout(forwardIntervalRef.current);
      clearInterval(forwardIntervalRef.current);
      forwardIntervalRef.current = null;
    }
  };

  const handleSkipBackwardStart = () => {
    sendCommand("skipBackward");
    backwardIntervalRef.current = window.setTimeout(() => {
      backwardIntervalRef.current = window.setInterval(() => {
        sendCommand("skipBackward");
      }, 200);
    }, 150);
  };

  const handleSkipBackwardEnd = () => {
    if (backwardIntervalRef.current) {
      clearTimeout(backwardIntervalRef.current);
      clearInterval(backwardIntervalRef.current);
      backwardIntervalRef.current = null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-700">
        <Circle
          size={12}
          className={`${connected ? "fill-green-500 text-green-500" : "fill-red-500 text-red-500"}`}
        />
        <span className="text-sm text-gray-300">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <button
        onClick={handlePlayPause}
        className="w-full py-6 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-3"
      >
        {isPlaying ? <Pause size={32} /> : <Play size={32} />}
      </button>

      <div className="flex gap-4">
        <button
          onMouseDown={handleSkipBackwardStart}
          onMouseUp={handleSkipBackwardEnd}
          onMouseLeave={handleSkipBackwardEnd}
          onTouchStart={handleSkipBackwardStart}
          onTouchEnd={handleSkipBackwardEnd}
          className="flex-1 py-4 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <SkipBack size={24} />
          <div className="text-xs">10s</div>
        </button>

        <button
          onMouseDown={handleSkipForwardStart}
          onMouseUp={handleSkipForwardEnd}
          onMouseLeave={handleSkipForwardEnd}
          onTouchStart={handleSkipForwardStart}
          onTouchEnd={handleSkipForwardEnd}
          className="flex-1 py-4 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <SkipForward size={24} />
          <div className="text-xs">10s</div>
        </button>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => sendCommand("prevEpisode")}
          className="flex-1 py-4 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <SkipBack size={20} />
          <span>Épisode Précédent</span>
        </button>

        <button
          onClick={() => sendCommand("nextEpisode")}
          className="flex-1 py-4 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Épisode Suivant</span>
          <SkipForward size={20} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <label className="text-sm font-medium text-gray-300">Volume</label>
          <span className="text-sm font-semibold text-gray-300">{volume}%</span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <div className="flex gap-2">
          <button
            onClick={() => handleVolumeChange(Math.max(0, volume - 10))}
            className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
          >
            <VolumeX size={20} />
          </button>
          <button
            onClick={() => handleVolumeChange(Math.min(100, volume + 10))}
            className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>

      <button
        onClick={() => sendCommand("fullscreen")}
        className="w-full py-4 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
      >
        <Maximize size={24} />
        <span>Fullscreen</span>
      </button>
    </div>
  );
}
