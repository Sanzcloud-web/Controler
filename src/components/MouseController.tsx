import { useState, useEffect, useRef } from 'react'
import { Mouse, RotateCcw } from 'lucide-react'

interface MouseControllerProps {
  serverIp: string
}

export default function MouseController({ serverIp }: MouseControllerProps) {
  const [connected, setConnected] = useState(false)
  const [joystickPosition, setJoystickPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const joystickRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

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

  const sendCommand = (command: string, value?: number | object) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }

    const msg = typeof value === 'object' ? { command, ...value } : { command, value }
    console.log('📤 Sending command:', msg)
    wsRef.current.send(JSON.stringify(msg))
  }

  const handleJoystickMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return // Left button only
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !joystickRef.current) return

    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate distance from center
    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = Math.min(centerX, centerY) * 0.7

    // Limit to joystick circle
    const limitedDx = dx / distance * Math.min(distance, maxDistance)
    const limitedDy = dy / distance * Math.min(distance, maxDistance)

    const posX = 50 + (limitedDx / centerX) * 50
    const posY = 50 + (limitedDy / centerY) * 50

    setJoystickPosition({ x: posX, y: posY })

    // Send mouse movement command
    const sensitivity = 10 // pixels per unit
    const moveX = Math.round((limitedDx / centerX) * sensitivity)
    const moveY = Math.round((limitedDy / centerY) * sensitivity)

    if (moveX !== 0 || moveY !== 0) {
      sendCommand('moveMouse', { dx: moveX, dy: moveY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setJoystickPosition({ x: 50, y: 50 })
  }

  const handleLeftClick = () => {
    sendCommand('mouseLeftClick')
  }

  const handleRightClick = () => {
    sendCommand('mouseRightClick')
  }

  const handleReset = () => {
    setJoystickPosition({ x: 50, y: 50 })
    sendCommand('resetMouse')
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-700">
        <div
          className={`w-3 h-3 rounded-full ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-gray-300">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Joystick */}
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Mouse size={24} />
          Souris
        </h3>

        <div
          ref={joystickRef}
          onMouseDown={handleJoystickMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative w-64 h-64 bg-gray-700 rounded-full border-4 border-gray-600 cursor-grab active:cursor-grabbing flex items-center justify-center"
        >
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-800" />

          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full">
            <circle cx="50%" cy="50%" r="30%" fill="none" stroke="gray" strokeWidth="1" opacity="0.3" />
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="gray" strokeWidth="1" opacity="0.2" />
            <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="gray" strokeWidth="1" opacity="0.2" />
          </svg>

          {/* Center dot */}
          <div className="absolute w-3 h-3 bg-gray-500 rounded-full" />

          {/* Joystick knob */}
          <div
            className="absolute w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full shadow-lg transition-transform"
            style={{
              left: `${joystickPosition.x}%`,
              top: `${joystickPosition.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>

      {/* Click Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleLeftClick}
          className="py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <span>🖱️</span>
          <span>Clic Gauche</span>
        </button>

        <button
          onClick={handleRightClick}
          className="py-4 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
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
