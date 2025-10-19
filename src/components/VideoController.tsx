import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, VolumeX, Volume2, Maximize, Circle } from 'lucide-react'

interface VideoControllerProps {
  serverIp: string
  serverPort: number
}

export default function VideoController({ serverIp }: VideoControllerProps) {
  const [connected, setConnected] = useState(false)
  const [volume, setVolume] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const forwardIntervalRef = useRef<number | null>(null)
  const backwardIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    connectToServer()

    // Cleanup function to clear intervals on unmount
    return () => {
      if (forwardIntervalRef.current) {
        clearTimeout(forwardIntervalRef.current)
        clearInterval(forwardIntervalRef.current)
      }
      if (backwardIntervalRef.current) {
        clearTimeout(backwardIntervalRef.current)
        clearInterval(backwardIntervalRef.current)
      }
    }
  }, [serverIp])

  const connectToServer = () => {
    try {
      // WebSocket toujours sur le port 8080 (le serveur WebSocket)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${serverIp}:8080/ws`
      
      console.log('Connecting to WebSocket:', wsUrl)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ Connected to server')
        setConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📥 Received message:', data)

          if (data.type === 'volumeUpdate' && typeof data.volume === 'number') {
            setVolume(data.volume)
            console.log('🔊 Volume updated to:', data.volume)
          }
        } catch (error) {
          console.error('❌ Failed to parse message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setConnected(false)
      }

      ws.onclose = () => {
        console.log('❌ Disconnected from server')
        setConnected(false)
        // Try to reconnect after 3 seconds
        setTimeout(() => connectToServer(), 3000)
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
    console.log('📤 Sending command:', msg)
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

  const handleSkipForwardStart = () => {
    // Send immediate command
    sendCommand('skipForward')

    // Start continuous sending after 150ms
    forwardIntervalRef.current = window.setTimeout(() => {
      forwardIntervalRef.current = window.setInterval(() => {
        sendCommand('skipForward')
      }, 200) // Repeat every 200ms
    }, 250) // Wait 150ms before starting continuous
  }

  const handleSkipForwardEnd = () => {
    // Clear all intervals
    if (forwardIntervalRef.current) {
      clearTimeout(forwardIntervalRef.current)
      clearInterval(forwardIntervalRef.current)
      forwardIntervalRef.current = null
    }
  }

  const handleSkipBackwardStart = () => {
    // Send immediate command
    sendCommand('skipBackward')

    // Start continuous sending after 150ms
    backwardIntervalRef.current = window.setTimeout(() => {
      backwardIntervalRef.current = window.setInterval(() => {
        sendCommand('skipBackward')
      }, 200) // Repeat every 200ms
    }, 150) // Wait 150ms before starting continuous
  }

  const handleSkipBackwardEnd = () => {
    // Clear all intervals
    if (backwardIntervalRef.current) {
      clearTimeout(backwardIntervalRef.current)
      clearInterval(backwardIntervalRef.current)
      backwardIntervalRef.current = null
    }
  }

  const handleNextEpisode = () => {
    sendCommand('nextEpisode')
  }

  const handlePrevEpisode = () => {
    sendCommand('prevEpisode')
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-700">
        <Circle 
          size={12} 
          className={`${connected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
        />
        <span className="text-sm text-gray-300">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className="w-full py-6 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-3"
      >
        {isPlaying ? (
          <Pause size={32} />
        ) : (
          <Play size={32} />
        )}
      </button>

      {/* Skip Buttons */}
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

      {/* Episode Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handlePrevEpisode}
          className="flex-1 py-4 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <SkipBack size={20} />
          <span>Épisode Précédent</span>
        </button>

        <button
          onClick={handleNextEpisode}
          className="flex-1 py-4 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Épisode Suivant</span>
          <SkipForward size={20} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <label className="text-sm font-medium text-gray-300">
            Volume
          </label>
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

      {/* Fullscreen Button */}
      <button
        onClick={() => sendCommand('fullscreen')}
        className="w-full py-4 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
      >
        <Maximize size={24} />
        <span>Fullscreen</span>
      </button>
    </div>
  )
}
