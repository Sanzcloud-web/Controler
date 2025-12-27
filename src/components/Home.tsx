import { useEffect, useState, useRef } from "react";
import { Loader, Lock, Eye, EyeOff, Server, Wifi } from "lucide-react";
import VideoController from "./VideoController";
import MouseController from "./MouseController";

type AuthState =
  | "setup"
  | "password"
  | "connecting"
  | "authenticated"
  | "failed";

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("setup");
  const [serverUrl, setServerUrl] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"video" | "mouse">("video");
  const wsRef = useRef<WebSocket | null>(null);

  // Check if we're on the same host as the server (local mode)
  const isLocalMode =
    window.location.port === "8080" || window.location.hostname === "localhost";

  useEffect(() => {
    // Load saved server URL
    const savedUrl = localStorage.getItem("remoteServerUrl");
    const savedPassword = sessionStorage.getItem("remotePassword");

    if (isLocalMode) {
      // Local mode - use current host
      setServerUrl(`${window.location.hostname}:8080`);
      setAuthState("password");
    } else if (savedUrl) {
      setServerUrl(savedUrl);
      setAuthState("password");
    }

    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, [isLocalMode]);

  const handleSetupSubmit = () => {
    if (!serverUrl.trim()) {
      setError("Server URL required");
      return;
    }
    localStorage.setItem("remoteServerUrl", serverUrl.trim());
    setError("");
    setAuthState("password");
  };

  const handleConnect = () => {
    if (!password.trim()) {
      setError("Password required");
      return;
    }

    setAuthState("connecting");
    setError("");

    try {
      // Determine WebSocket URL
      let wsUrl: string;
      if (isLocalMode) {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${window.location.hostname}:8080/ws`;
      } else {
        // Remote mode - use saved server URL
        const cleanUrl = serverUrl
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "");
        const protocol =
          serverUrl.startsWith("https") || cleanUrl.includes(".ts.net")
            ? "wss:"
            : "ws:";
        wsUrl = `${protocol}//${cleanUrl}/ws`;
      }

      console.log("Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected, waiting for auth request...");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📥 Received:", data);

          if (data.type === "authRequired") {
            ws.send(JSON.stringify({ command: "auth", password }));
          } else if (data.type === "authSuccess") {
            setAuthState("authenticated");
            sessionStorage.setItem("remotePassword", password);
          } else if (data.type === "authFailed") {
            setError(data.message || "Invalid password");
            setAuthState("failed");
            ws.close();
          }
        } catch (e) {
          console.error("Failed to parse message:", e);
        }
      };

      ws.onerror = () => {
        setError("Connection failed - check server URL");
        setAuthState("failed");
      };

      ws.onclose = () => {
        if (authState === "connecting") {
          setError("Connection closed");
          setAuthState("failed");
        }
      };
    } catch (e) {
      setError("Failed to connect");
      setAuthState("failed");
    }
  };

  // Setup screen (remote mode only)
  if (authState === "setup" && !isLocalMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📺</div>
            <h1 className="text-4xl font-bold text-white mb-2">Smart Remote</h1>
            <p className="text-gray-400">Configure your server connection</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Server
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetupSubmit()}
                placeholder="your-mac.tailnet.ts.net"
                className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <p className="text-xs text-gray-500 text-center">
              Enter your Tailscale Funnel URL (e.g., your-mac.tailnet.ts.net)
            </p>

            <button
              onClick={handleSetupSubmit}
              className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Wifi size={20} />
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Password screen
  if (authState === "password" || authState === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📺</div>
            <h1 className="text-4xl font-bold text-white mb-2">Smart Remote</h1>
            <p className="text-gray-400">Enter password to connect</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              onClick={handleConnect}
              className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Lock size={20} />
              Connect
            </button>

            {!isLocalMode && (
              <button
                onClick={() => {
                  localStorage.removeItem("remoteServerUrl");
                  setAuthState("setup");
                  setServerUrl("");
                }}
                className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm"
              >
                Change server URL
              </button>
            )}
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            📍 {isLocalMode ? `${window.location.hostname}:8080` : serverUrl}
          </p>
        </div>
      </div>
    );
  }

  // Connecting screen
  if (authState === "connecting") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">📺</div>
          <h1 className="text-4xl font-bold text-white mb-2">Smart Remote</h1>
          <p className="text-gray-400 mb-8 text-lg">Connecting...</p>

          <div className="flex items-center justify-center gap-3 text-gray-300">
            <Loader size={20} className="animate-spin" />
            <p className="text-lg font-medium">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show controller
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-6">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Remote</h1>
          <p className="text-gray-400 text-sm mb-1">
            📍 {isLocalMode ? `${window.location.hostname}:8080` : serverUrl}
          </p>
          <p className="text-xs text-green-400 font-semibold">✅ Connected</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("video")}
            className={`flex-1 py-2 px-4 rounded transition-colors font-semibold ${
              activeTab === "video"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            📺 Vidéo
          </button>
          <button
            onClick={() => setActiveTab("mouse")}
            className={`flex-1 py-2 px-4 rounded transition-colors font-semibold ${
              activeTab === "mouse"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🖱️ Souris
          </button>
        </div>

        {/* Controllers - pass the server URL for WebSocket connection */}
        {activeTab === "video" && (
          <VideoController
            serverUrl={
              isLocalMode ? `${window.location.hostname}:8080` : serverUrl
            }
            isLocalMode={isLocalMode}
          />
        )}
        {activeTab === "mouse" && (
          <MouseController
            serverUrl={
              isLocalMode ? `${window.location.hostname}:8080` : serverUrl
            }
            isLocalMode={isLocalMode}
          />
        )}

        {/* Disconnect Button */}
        <button
          onClick={() => {
            sessionStorage.removeItem("remotePassword");
            setAuthState("password");
            setPassword("");
            if (wsRef.current) {
              wsRef.current.close();
            }
          }}
          className="w-full mt-8 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
