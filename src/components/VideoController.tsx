import { useState, useEffect, useRef } from 'react'

interface VideoControllerProps {
  serverIp: string
  serverPort: number
}

export default function VideoController({ serverIp, serverPort }: VideoControllerProps) {
  const [connected, setConnected] = useState(false)
  const [volume, setVolume] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    connectToServer()
  }, [serverIp, serverPort])

  const connectToServer = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${serverIp}:${serverPort}`
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Connected to server')
        setConnected(true)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnected(false)
      }

      ws.onclose = () => {
        console.log('Disconnected from server')
        setConnected(false)
      }
    } catch (error) {
      console.error('Connection failed:', error)
      setConnected(false)
    }
  }

  const sendCommand = (command: string, value?: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }

    const msg = { command, value }
    wsRef.current.send(JSON.stringify(msg))
  }

  const handlePlayPause = () => {
    sendCommand('togglePlayPause')
    setIsPlaying(!isPlaying)
  }

  const handleVolumeChange = (value: number) => {
    setVolume(value)
    sendCommand('setVolume', value)
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-300">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className="w-full py-6 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-xl rounded-lg transition-all transform active:scale-95 shadow-lg"
      >
        {isPlaying ? (
          <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.75 1.5a.5.5 0 0 0-.5.5v16a.5.5 0 0 0 .5.5h2.5a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-.5-.5h-2.5zm6 0a.5.5 0 0 0-.5.5v16a.5.5 0 0 0 .5.5h2.5a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-.5-.5h-2.5z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3.993C2 2.894 3.107 2 4.5 2c.9 0 1.694.527 2.028 1.272.226.516.75.855 1.347.855.597 0 1.12-.34 1.347-.855A2.5 2.5 0 0 1 15.5 2c1.393 0 2.5.893 2.5 1.993v12.014c0 1.1-1.107 1.993-2.5 1.993a2.5 2.5 0 0 1-2.278-1.272 1.5 1.5 0 0 0-2.694 0A2.5 2.5 0 0 1 4.5 18c-1.393 0-2.5-.893-2.5-1.993V3.993zm5.836 2.02l6.34 4.487-6.34 4.487V6.013z" />
          </svg>
        )}
      </button>

      {/* Skip Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => sendCommand('skipBackward')}
          className="flex-1 py-4 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors active:scale-95"
        >
          <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7.5 4a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-4.5h4.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5H9V4.5a.5.5 0 0 0-.5-.5h-1z" />
          </svg>
          <div className="text-xs mt-1">-10s</div>
        </button>

        <button
          onClick={() => sendCommand('skipForward')}
          className="flex-1 py-4 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors active:scale-95"
        >
          <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M12.5 4a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-4.5H6.5a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h4.5V4.5a.5.5 0 0 1 .5-.5h1z" />
          </svg>
          <div className="text-xs mt-1">+10s</div>
        </button>
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Volume: {volume}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #374151 ${volume}%, #374151 100%)`
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleVolumeChange(Math.max(0, volume - 10))}
            className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.707 6.707a1 1 0 0 0-1.414 1.414L8.586 10l-3.293 3.293a1 1 0 1 0 1.414 1.414L10 11.414l3.293 3.293a1 1 0 0 0 1.414-1.414L11.414 10l3.293-3.293a1 1 0 0 0-1.414-1.414L10 8.586 6.707 5.293z" />
            </svg>
          </button>
          <button
            onClick={() => handleVolumeChange(Math.min(100, volume + 10))}
            className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.293 3.293a1 1 0 0 1 1.414 0l2 2a1 1 0 0 1-1.414 1.414L11 5.414V15a1 1 0 1 1-2 0V5.414L9.707 6.707a1 1 0 0 1-1.414-1.414l2-2zM5 10a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1zm8 0a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fullscreen Button */}
      <button
        onClick={() => sendCommand('fullscreen')}
        className="w-full py-4 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors active:scale-95"
      >
        <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H5v3a1 1 0 0 1-2 0V4zm12 0a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V5h-3a1 1 0 0 1 0-2h4zm0 12a1 1 0 0 1-1 1h-4a1 1 0 0 1 0-2h3v-3a1 1 0 0 1 2 0v4zM4 16a1 1 0 0 1-1-1v-4a1 1 0 0 1 2 0v3h3a1 1 0 0 1 0 2H4z" />
        </svg>
        <div className="text-xs mt-1">Fullscreen</div>
      </button>
    </div>
  )
}
