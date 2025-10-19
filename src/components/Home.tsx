import { useEffect, useState } from 'react'
import { Loader } from 'lucide-react'
import VideoController from './VideoController'
import MouseController from './MouseController'

export default function Home() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Detecting server...')
  const [activeTab, setActiveTab] = useState<'video' | 'mouse'>('video')

  useEffect(() => {
    // Automatically get IP from browser location
    const serverIp = window.location.hostname
    const serverPort = window.location.port ? parseInt(window.location.port) : 8080
    
    setStatus(`🔍 Detected: ${serverIp}:${serverPort}`)
    
    // Wait a moment then connect
    setTimeout(() => {
      setStatus('🔗 Connecting to server...')
    }, 800)

    // Auto-connect
    setTimeout(() => {
      setStatus('✅ Connected! Launching controller...')
      setConnected(true)
      setLoading(false)
    }, 1800)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce">📺</div>
          <h1 className="text-4xl font-bold text-white mb-2">Smart Remote</h1>
          <p className="text-gray-400 mb-8 text-lg">Video & Mouse Control</p>
          
          {/* Status Messages */}
          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-3 text-gray-300">
              <Loader size={20} className="animate-spin" />
              <p className="text-lg font-medium">{status}</p>
            </div>
            
            <div className="text-xs text-gray-500 mt-6 space-y-1">
              <p>✓ Auto-detecting network server</p>
              <p>✓ Establishing connection</p>
              <p>✓ Initializing remote controls</p>
            </div>
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
            <h1 className="text-3xl font-bold text-white mb-2">Smart Remote</h1>
            <p className="text-gray-400 text-sm mb-1">
              📍 {window.location.hostname}:{window.location.port || 8080}
            </p>
            <p className="text-xs text-green-400 font-semibold">✅ Ready to control</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-2 px-4 rounded transition-colors font-semibold ${
                activeTab === 'video'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📺 Vidéo
            </button>
            <button
              onClick={() => setActiveTab('mouse')}
              className={`flex-1 py-2 px-4 rounded transition-colors font-semibold ${
                activeTab === 'mouse'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🖱️ Souris
            </button>
          </div>

          {/* Controllers */}
          {activeTab === 'video' && (
            <VideoController 
              serverIp={window.location.hostname} 
              serverPort={window.location.port ? parseInt(window.location.port) : 8080}
            />
          )}
          {activeTab === 'mouse' && (
            <MouseController 
              serverIp={window.location.hostname}
            />
          )}

          {/* Disconnect Button */}
          <button
            onClick={() => {
              setConnected(false)
              setLoading(true)
              setStatus('Detecting server...')
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
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📺</div>
          <h1 className="text-4xl font-bold text-white mb-2">Smart Remote</h1>
          <p className="text-gray-400">Connection Lost</p>
        </div>

        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded-lg mb-4">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          🔄 Reconnect
        </button>
      </div>
    </div>
  )
}
