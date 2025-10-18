import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Settings from './components/Settings'
import Home from './components/Home'

// Detect if we're in Tauri (Mac app) or web browser (phone controller)
const isTauri = '__TAURI__' in window

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [serverInfo, setServerInfo] = useState({
    port: 8080,
    ip: '127.0.0.1',
    status: 'starting',
  })

  useEffect(() => {
    if (isTauri) {
      // Initialize server
      const initServer = async () => {
        try {
          const info = await invoke('start_server', {})
          setServerInfo(info as any)
        } catch (error) {
          console.error('Failed to start server:', error)
        }
      }
      initServer()
    }
  }, [])

  // If running in Tauri (Mac app), show settings interface
  if (isTauri) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
        {/* Minimal UI - just the icon/settings button */}
        <div className="fixed top-4 right-4 flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Settings"
          >
            <svg
              className="w-6 h-6 text-gray-400 hover:text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Settings
            serverInfo={serverInfo}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Server Status Overlay */}
        <div className="fixed bottom-4 left-4 bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm">
          <p>
            Server: <span className="text-green-400 font-semibold">{serverInfo.status}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {serverInfo.ip}:{serverInfo.port}
          </p>
        </div>
      </div>
    )
  }

  // If running in web browser (phone), show controller interface
  return <Home />
}
