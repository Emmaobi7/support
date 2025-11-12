import React, { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, UserIcon, CpuChipIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { chatService } from '../services/chatService'

const ChatWindow = ({ onScreenShareRequest }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI support assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
      metadata: { provider: 'system', greeting: true }
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('checking') // 'checking', 'connected', 'offline'
  const [currentProvider, setCurrentProvider] = useState('openai')
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Check backend connection on mount
    checkBackendConnection()

    // Listen for ai-message events dispatched by other components (e.g. ScreenShare)
    const handler = (e) => {
      try {
        const data = e.detail
        if (!data || !data.message) return

        // Update conversation ID if present
        if (!conversationId && data.conversation_id) {
          setConversationId(data.conversation_id)
        }

        const aiMessage = {
          id: data.message.id || `ai-${Date.now()}`,
          text: data.message.content,
          sender: 'ai',
          timestamp: new Date(data.message.timestamp || Date.now()),
          metadata: data.message.metadata || {}
        }

        setMessages(prev => [...prev, aiMessage])
      } catch (err) {
        console.error('Failed to handle ai-message event', err)
      }
    }

    window.addEventListener('ai-message', handler)

    return () => {
      window.removeEventListener('ai-message', handler)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const checkBackendConnection = async () => {
    setConnectionStatus('checking')
    try {
      const healthCheck = await chatService.checkHealth()
      if (healthCheck.success) {
        setConnectionStatus('connected')
        
        // Get current AI provider
        const providerInfo = await chatService.getCurrentProvider()
        if (providerInfo.success) {
          setCurrentProvider(providerInfo.data.provider || 'openai')
        }
      } else {
        setConnectionStatus('offline')
      }
    } catch (error) {
      console.error('Backend connection failed:', error)
      setConnectionStatus('offline')
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputMessage
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      // Send message to backend
      const response = await chatService.sendMessage(messageToSend, conversationId, 'demo-user')
      
      if (response.success) {
        const { data } = response
        
        // Update conversation ID if new
        if (!conversationId && data.conversation_id) {
          setConversationId(data.conversation_id)
        }

        // Create AI message from backend response
        const aiMessage = {
          id: data.message.id || `ai-${Date.now()}`,
          text: data.message.content,
          sender: 'ai',
          timestamp: new Date(data.message.timestamp),
          metadata: data.message.metadata || {}
        }

        setMessages(prev => [...prev, aiMessage])
        
        // Check if AI requested screen sharing
        if (data.should_request_screen_share) {
          onScreenShareRequest()
        }

        // Update connection status
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected')
        }

      } else {
        // Use fallback response
        const fallbackData = response.fallback
        const aiMessage = {
          id: fallbackData.message.id,
          text: fallbackData.message.content,
          sender: 'ai',
          timestamp: new Date(fallbackData.message.timestamp),
          metadata: { ...fallbackData.message.metadata, error: true }
        }

        setMessages(prev => [...prev, aiMessage])
        setError('Unable to connect to AI service. Using offline mode.')
        setConnectionStatus('offline')

        // Check if fallback suggests screen sharing
        if (fallbackData.should_request_screen_share) {
          onScreenShareRequest()
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Show error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        sender: 'ai',
        timestamp: new Date(),
        metadata: { error: true, fallback: true }
      }

      setMessages(prev => [...prev, errorMessage])
      setError('Connection error. Please check your internet connection.')
      setConnectionStatus('offline')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <CpuChipIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">AI Support Assistant</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <p className="text-sm text-gray-500">
                {connectionStatus === 'connected' ? `Online • ${currentProvider}` :
                 connectionStatus === 'checking' ? 'Connecting...' : 'Offline Mode'}
              </p>
            </div>
          </div>
        </div>
        
        {connectionStatus === 'connected' && (
          <button
            onClick={checkBackendConnection}
            className="text-sm text-primary-600 hover:text-primary-700 px-2 py-1 rounded"
            title="Refresh connection"
          >
            🔄
          </button>
        )}
        {/* Debug: load existing conversation by ID (helps confirm messages from backend) */}
        <button
          onClick={async () => {
            try {
              const id = window.prompt('Enter conversation ID to load (or leave empty to cancel)')
              if (!id) return
              const resp = await chatService.getConversation(id)
              if (resp.success && resp.data && resp.data.messages) {
                const mapped = resp.data.messages.map(m => ({
                  id: m.id,
                  text: m.content,
                  sender: m.role === 'user' ? 'user' : 'ai',
                  timestamp: new Date(m.timestamp),
                  metadata: m.metadata || {}
                }))
                setConversationId(resp.data.conversation_id)
                setMessages(mapped)
                setConnectionStatus('connected')
                setError(null)
              } else {
                window.alert('Failed to load conversation: ' + (resp.error || 'unknown'))
              }
            } catch (e) {
              console.error('Load conversation failed', e)
              window.alert('Error loading conversation; see console')
            }
          }}
          className="ml-2 text-sm text-primary-600 hover:text-primary-700 px-2 py-1 rounded"
          title="Load conversation by ID"
        >
          📂 Load
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

  {/* Messages Area */}
  <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              } space-x-2`}
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user'
                      ? 'bg-primary-500'
                      : 'bg-gray-300'
                  }`}
                >
                  {message.sender === 'user' ? (
                    <UserIcon className="w-5 h-5 text-white" />
                  ) : (
                    <CpuChipIcon className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary-500 text-white'
                    : message.metadata?.error
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : message.metadata?.fallback
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${
                    message.sender === 'user' ? 'text-primary-100' : 
                    message.metadata?.error ? 'text-red-600' :
                    message.metadata?.fallback ? 'text-yellow-600' :
                    'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  {message.metadata?.token_usage && (
                    <p className="text-xs text-gray-400">
                      {message.metadata.token_usage.total_tokens} tokens
                    </p>
                  )}
                </div>
                {message.metadata?.model && (
                  <p className="text-xs text-gray-400 mt-1">
                    {message.metadata.model}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex flex-row space-x-2 max-w-xs lg:max-w-md xl:max-w-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300">
                  <CpuChipIcon className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              <div className="px-4 py-2 rounded-lg bg-gray-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="flex-shrink-0 bg-primary-500 text-white p-2 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow