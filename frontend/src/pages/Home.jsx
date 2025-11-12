import React, { useState } from 'react'
import ChatWindow from '../components/ChatWindow'
import ScreenShare from '../components/ScreenShare'
import { ChatBubbleLeftRightIcon, ComputerDesktopIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'

const Home = ({ onNavigateDocUpload }) => {
  const [isScreenShareRequested, setIsScreenShareRequested] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [activeTab, setActiveTab] = useState('chat') // 'chat' or 'screen'

  const handleScreenShareRequest = () => {
    setIsScreenShareRequested(true)
    // Auto-switch to screen share tab when requested
    setActiveTab('screen')
  }

  const handleScreenShareStart = () => {
    setIsScreenSharing(true)
  }

  const handleScreenShareStop = () => {
    setIsScreenSharing(false)
    setIsScreenShareRequested(false)
    // Switch back to chat when screen sharing stops
    setActiveTab('chat')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Support Assistant</h1>
                <p className="text-sm text-gray-500">Get help with visual guidance</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onNavigateDocUpload}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                title="Upload documentation"
              >
                <DocumentPlusIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Docs</span>
              </button>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${'bg-white text-primary-600 shadow-sm'}`}
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-1.5" />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('screen')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors relative ${
                    activeTab === 'screen'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ComputerDesktopIcon className="w-4 h-4 inline mr-1.5" />
                  Screen Share
                  {isScreenShareRequested && !isScreenSharing && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                  {isScreenSharing && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Mobile Tab View */}
          <div className="lg:hidden min-h-0">
            {activeTab === 'chat' ? (
              <div className="h-full">
                <ChatWindow onScreenShareRequest={handleScreenShareRequest} />
              </div>
            ) : (
              <div className="h-full">
                <ScreenShare
                  isActive={isScreenShareRequested}
                  onStart={handleScreenShareStart}
                  onStop={handleScreenShareStop}
                />
              </div>
            )}
          </div>

          {/* Desktop Dual Panel View */}
          <div className="hidden lg:block h-full min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Chat Assistant</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-500">Online</span>
              </div>
            </div>
            <ChatWindow onScreenShareRequest={handleScreenShareRequest} />
          </div>

          <div className="hidden lg:block h-full min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Screen Sharing</h2>
              {isScreenShareRequested && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isScreenSharing ? 'bg-green-500' : 'bg-orange-500 animate-pulse'
                  }`}></div>
                  <span className="text-sm text-gray-500">
                    {isScreenSharing ? 'Active' : 'Requested'}
                  </span>
                </div>
              )}
            </div>
            <ScreenShare
              isActive={isScreenShareRequested}
              onStart={handleScreenShareStart}
              onStop={handleScreenShareStop}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">AI Assistant: Online</span>
              </div>
              {isScreenShareRequested && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isScreenSharing ? 'bg-green-500' : 'bg-orange-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    Screen Share: {isScreenSharing ? 'Active' : 'Pending'}
                  </span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Prototype v1.0 • Powered by AI & Agora
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home