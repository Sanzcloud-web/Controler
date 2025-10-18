import { useEffect, useState } from 'react'
import VideoController from './VideoController'

export default function Home() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Automatically get IP from browser location
    const serverIp = window.location.hostname
    const serverPort = window.location.port ? parseInt(window.location.port) : 8080
    
    // Auto-connect
    setTimeout(() => {
      setConnected(true)
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📺</div>
          <h1 className="text-3xl font-bold text-white mb-4">Connecting...</h1>
          <div className="animate-pulse text-gray-400">
            <p>Detecting server...</p>
          </div>
        </div>
      </div>
    )
  }

  if (connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 mt-6">
            <h1 className="text-3xl font-bold text-white mb-2">Video Controller</h1>
            <p className="text-gray-400 text-sm">
              Connected to {window.location.hostname}:{window.location.port || 8080}
            </p>
          </div>

          {/* Controller */}
          <VideoController 
            serverIp={window.location.hostname} 
            serverPort={window.location.port ? parseInt(window.location.port) : 8080}
          />

          {/* Disconnect Button */}
          <button
            onClick={() => {
              setConnected(false)
              setLoading(true)
            }}
            className="w-full mt-8 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📺</div>
          <h1 className="text-4xl font-bold text-white mb-2">Video Controller</h1>
          <p className="text-gray-400">Reconnecting...</p>
        </div>

        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          Reconnect
        </button>
      </div>
    </div>
  )
}
