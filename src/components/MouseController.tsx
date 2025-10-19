import { useState, useEffect, useRef } from 'react'
import { Joystick } from 'react-joystick-component'
import { RotateCcw } from 'lucide-react'

interface MouseControllerProps {
  serverIp: string
}

export default function MouseController({ serverIp }: MouseControllerProps) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const lastSendTime = useRef<number>(0)

  useEffect(() => {
    connectToServer()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [serverIp])

  const connectToServer = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${serverIp}:8080/ws`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ Connected to mouse controller')
        setConnected(true)
      }

      ws.onerror = () => {
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        setTimeout(() => connectToServer(), 3000)
      }
    } catch (error) {
      console.error('Connection failed:', error)
      setConnected(false)
    }
  }

  const sendCommand = (command: string, value?: object) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }

    const msg = { command, ...value }
    console.log('📤 Sending:', msg)
    wsRef.current.send(JSON.stringify(msg))
  }

  const handleJoystickMove = (event: any) => {
    // Send movement every 50ms to avoid spam
    const now = Date.now()
    if (now - lastSendTime.current > 50) {
      const moveX = event.x ? Math.round(event.x) : 0
      const moveY = event.y ? Math.round(event.y) : 0

      if (moveX !== 0 || moveY !== 0) {
        console.log(`🎮 Joystick move: x=${moveX}, y=${moveY}`)
        sendCommand('moveMouse', { dx: moveX, dy: moveY })
        lastSendTime.current = now
      }
    }
  }

  const handleJoystickStop = () => {
    console.log('🎮 Joystick stopped')
  }

  const handleLeftClick = () => {
    sendCommand('mouseLeftClick', {})
  }

  const handleRightClick = () => {
    sendCommand('mouseRightClick', {})
  }

  const handleReset = () => {
    sendCommand('resetMouse', {})
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-700">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-300">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Joystick Title */}
      <h3 className="text-lg font-semibold text-white text-center">
        🖱️ Contrôle Souris
      </h3>

      {/* Joystick Component */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <Joystick
            size={200}
            sticky={false}
            baseColor="rgba(55, 65, 81, 1)"
            stickColor="rgba(59, 130, 246, 1)"
            move={handleJoystickMove}
            stop={handleJoystickStop}
            throttle={50}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">
          Drag pour bouger la souris 👆
        </p>
      </div>

      {/* Click Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleLeftClick}
          className="py-4 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <span>🖱️</span>
          <span>Clic Gauche</span>
        </button>

        <button
          onClick={handleRightClick}
          className="py-4 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <span>🖱️</span>
          <span>Clic Droit</span>
        </button>
      </div>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw size={20} />
        <span>Réinitialiser</span>
      </button>
    </div>
  )
}
