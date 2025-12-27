import { useEffect, useState, useRef } from "react";
import { Loader, Lock, Eye, EyeOff, QrCode, Server, X } from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import VideoController from "./VideoController";
import MouseController from "./MouseController";
import ScreenMirror from "./ScreenMirror";

type AuthState =
  | "setup"
  | "password"
  | "connecting"
  | "authenticated"
  | "failed";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

interface SavedConnection {
  url: string;
  savedAt: number;
}

function getSavedConnection(): SavedConnection | null {
  try {
    const saved = localStorage.getItem("remoteConnection");
    if (saved) {
      const data: SavedConnection = JSON.parse(saved);
      const now = Date.now();
      // Check if still valid (less than 2 days old)
      if (now - data.savedAt < TWO_DAYS_MS) {
        return data;
      } else {
        // Expired, remove it
        localStorage.removeItem("remoteConnection");
      }
    }
  } catch {
    localStorage.removeItem("remoteConnection");
  }
  return null;
}

function saveConnection(url: string) {
  const data: SavedConnection = {
    url,
    savedAt: Date.now(),
  };
  localStorage.setItem("remoteConnection", JSON.stringify(data));
}

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("setup");
  const [serverUrl, setServerUrl] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"video" | "mouse" | "screen">(
    "video",
  );
  const [showScanner, setShowScanner] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const isLocalMode =
    window.location.port === "8080" || window.location.hostname === "localhost";

  useEffect(() => {
    const savedConnection = getSavedConnection();
    const savedPassword = localStorage.getItem("remotePassword");

    if (isLocalMode) {
      setServerUrl(`${window.location.hostname}:8080`);
      setAuthState("password");
    } else if (savedConnection) {
      setServerUrl(savedConnection.url);
      setAuthState("password");
    }

    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, [isLocalMode]);

  const handleQrScan = (result: { rawValue: string }[]) => {
    if (result && result.length > 0) {
      let url = result[0].rawValue;
      // Remove protocol, whitespace, and trailing slashes
      url = url
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .replace("/ws", "")
        .trim();
      setServerUrl(url);
      saveConnection(url);
      setShowScanner(false);
      setAuthState("password");
    }
  };

  const handleSetupSubmit = () => {
    if (!serverUrl.trim()) {
      setError("Server URL required");
      return;
    }
    const cleanUrl = serverUrl
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    setServerUrl(cleanUrl);
    saveConnection(cleanUrl);
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
      let wsUrl: string;
      if (isLocalMode) {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${window.location.hostname}:8080/ws`;
      } else {
        const cleanUrl = serverUrl
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "");
        const protocol =
          serverUrl.startsWith("https") ||
          cleanUrl.includes(".ngrok") ||
          cleanUrl.includes(".ts.net")
            ? "wss:"
            : "ws:";
        wsUrl = `${protocol}//${cleanUrl}/ws`;
      }

      console.log("Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "authRequired") {
            ws.send(JSON.stringify({ command: "auth", password }));
          } else if (data.type === "authSuccess") {
            setAuthState("authenticated");
            // Save password for 2 days too
            localStorage.setItem("remotePassword", password);
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
        setError("Connection failed - server URL may have changed");
        // Clear saved connection if it fails
        localStorage.removeItem("remoteConnection");
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

  // Setup screen with QR scanner
  if (
    (authState === "setup" || authState === "failed") &&
    !isLocalMode &&
    !serverUrl
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📺</div>
            <h1 className="text-4xl font-bold text-white mb-2">Smart Remote</h1>
            <p className="text-gray-400">Scan QR code or enter server URL</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          {showScanner ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowScanner(false)}
                  className="absolute top-2 right-2 z-10 p-2 bg-gray-800/80 rounded-full text-white"
                >
                  <X size={20} />
                </button>
                <Scanner
                  onScan={handleQrScan}
                  onError={(error) => console.log(error)}
                  constraints={{ facingMode: "environment" }}
                  styles={{
                    container: { width: "100%", borderRadius: "0.5rem" },
                    video: { borderRadius: "0.5rem" },
                  }}
                />
              </div>
              <p className="text-center text-gray-400 text-sm">
                Point camera at QR code in terminal
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scan QR Button */}
              <button
                onClick={() => setShowScanner(true)}
                className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-3"
              >
                <QrCode size={24} />
                Scan QR Code
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="text-gray-500 text-sm">or</span>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>

              {/* Manual URL input */}
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
                  placeholder="abc123.ngrok-free.app"
                  className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleSetupSubmit}
                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Connect Manually
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Password screen
  if (authState === "password" || (authState === "failed" && serverUrl)) {
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
                className="w-full pl-12 pr-12 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
                  localStorage.removeItem("remoteConnection");
                  setServerUrl("");
                  setAuthState("setup");
                }}
                className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm"
              >
                Change server
              </button>
            )}
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            📍 {serverUrl}
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
          <div className="flex items-center justify-center gap-3 text-gray-300 mt-8">
            <Loader size={20} className="animate-spin" />
            <p className="text-lg font-medium">Connecting...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show controller
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 mt-6">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Remote</h1>
          <p className="text-gray-400 text-sm mb-1">📍 {serverUrl}</p>
          <p className="text-xs text-green-400 font-semibold">✅ Connected</p>
        </div>

        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("video")}
            className={`flex-1 py-2 px-3 rounded transition-colors font-semibold text-sm ${
              activeTab === "video"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            📺 Vidéo
          </button>
          <button
            onClick={() => setActiveTab("mouse")}
            className={`flex-1 py-2 px-3 rounded transition-colors font-semibold text-sm ${
              activeTab === "mouse"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🖱️ Souris
          </button>
          <button
            onClick={() => setActiveTab("screen")}
            className={`flex-1 py-2 px-3 rounded transition-colors font-semibold text-sm ${
              activeTab === "screen"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            🖥️ Écran
          </button>
        </div>

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
        {activeTab === "screen" && (
          <ScreenMirror
            serverUrl={
              isLocalMode ? `${window.location.hostname}:8080` : serverUrl
            }
          />
        )}

        <button
          onClick={() => {
            localStorage.removeItem("remotePassword");
            localStorage.removeItem("remoteConnection");
            setAuthState("setup");
            setServerUrl("");
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
