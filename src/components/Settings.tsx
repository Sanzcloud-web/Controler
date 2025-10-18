import { useState } from 'react'

interface SettingsProps {
  serverInfo: {
    port: number
    ip: string
    status: string
  }
  onClose: () => void
}

export default function Settings({ serverInfo, onClose }: SettingsProps) {
  const [port, setPort] = useState(serverInfo.port)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Server Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Server Status
            </label>
            <div className="flex items-center gap-2 bg-gray-700 p-3 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                serverInfo.status === 'running' ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="text-gray-200 capitalize">{serverInfo.status}</span>
            </div>
          </div>

          {/* Server IP */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Server IP
            </label>
            <div className="bg-gray-700 p-3 rounded-lg text-gray-200 font-mono text-sm">
              {serverInfo.ip}
            </div>
          </div>

          {/* Port */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Port
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value))}
              className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Connection URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Access URL
            </label>
            <div className="bg-gray-700 p-3 rounded-lg text-gray-200 font-mono text-xs break-all">
              http://{serverInfo.ip}:{port}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use this URL to access the controller from your phone
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-xs text-gray-300 space-y-1">
              <div className="font-semibold mb-2">How to use:</div>
              <div>1. Note the URL above</div>
              <div>2. Connect your phone to the same WiFi</div>
              <div>3. Open the URL in your browser</div>
              <div>4. Control your video from your phone!</div>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
