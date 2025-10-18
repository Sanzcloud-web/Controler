import { useState } from 'react'
import VideoController from './VideoController'

export default function Home() {
  const [serverIp, setServerIp] = useState('')
  const [serverPort, setServerPort] = useState(8080)
  const [connected, setConnected] = useState(false)

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    if (serverIp.trim()) {
      setConnected(true)
    }
  }

  if (connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 mt-6">
            <h1 className="text-3xl font-bold text-white mb-2">Video Controller</h1>
            <p className="text-gray-400 text-sm">
              Connected to {serverIp}:{serverPort}
            </p>
          </div>

          {/* Controller */}
          <VideoController serverIp={serverIp} serverPort={serverPort} />

          {/* Disconnect Button */}
          <button
            onClick={() => {
              setConnected(false)
              setServerIp('')
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
          <p className="text-gray-400">Control your PC video from anywhere</p>
        </div>

        {/* Connection Form */}
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Server IP Address
            </label>
            <input
              type="text"
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value)}
              placeholder="192.168.1.100"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              Find this IP in the settings of your Mac app
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Port
            </label>
            <input
              type="number"
              value={serverPort}
              onChange={(e) => setServerPort(parseInt(e.target.value))}
              placeholder="8080"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={!serverIp.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Connect
          </button>
        </form>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-800 bg-opacity-50 rounded-lg">
          <h3 className="font-semibold text-white mb-3">How to use:</h3>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">1.</span>
              <span>Make sure your Mac app is running</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Click the settings icon in the Mac app</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Copy the IP address and port number</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">4.</span>
              <span>Paste them here and click Connect</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">5.</span>
              <span>Start controlling your video!</span>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          Make sure both devices are on the same WiFi network
        </div>
      </div>
    </div>
  )
}
