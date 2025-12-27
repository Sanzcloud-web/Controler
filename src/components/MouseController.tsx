import { useState, useEffect, useRef } from "react";
import { Joystick } from "react-joystick-component";
import { RotateCcw, Zap } from "lucide-react";

interface MouseControllerProps {
  serverUrl: string;
  isLocalMode: boolean;
}

export default function MouseController({
  serverUrl,
  isLocalMode,
}: MouseControllerProps) {
  const [connected, setConnected] = useState(false);
  const [sensitivity, setSensitivity] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);
  const lastSendTime = useRef<number>(0);

  useEffect(() => {
    connectToServer();
    return () => {
      if (wsRef.current) wsRef.current.close();
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

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ MouseController connected");
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
          }
        } catch (e) {
          console.error("Failed to parse message:", e);
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

  const sendCommand = (command: string, value?: object) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    wsRef.current.send(JSON.stringify({ command, ...value }));
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-700">
        <div
          className={`w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
        />
        <span className="text-sm text-gray-300">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white text-center">
        🖱️ Contrôle Souris
      </h3>

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <Joystick
            size={200}
            sticky={false}
            baseColor="rgba(55, 65, 81, 1)"
            stickColor="rgba(59, 130, 246, 1)"
            move={handleJoystickMove}
            stop={() => {}}
            throttle={50}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          Drag pour bouger la souris 👆
        </p>
      </div>

      <div className="space-y-3 bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Zap size={18} />
            Vitesse
          </label>
          <span className="text-sm font-bold text-blue-400">
            {sensitivity.toFixed(1)}x
          </span>
        </div>

        <input
          type="range"
          min="0.3"
          max="20"
          step="0.1"
          value={sensitivity}
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>Lent</span>
          <span>Normal</span>
          <span>Rapide</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => sendCommand("mouseLeftClick")}
          className="py-4 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <span>🖱️</span>
          <span>Clic Gauche</span>
        </button>

        <button
          onClick={() => sendCommand("mouseRightClick")}
          className="py-4 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <span>🖱️</span>
          <span>Clic Droit</span>
        </button>
      </div>

      <button
        onClick={() => sendCommand("resetMouse")}
        className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw size={20} />
        <span>Réinitialiser</span>
      </button>
    </div>
  );
}
