import React, { useState, useRef, useEffect } from 'react'
import { 
  ComputerDesktopIcon, 
  StopIcon, 
  ExclamationTriangleIcon,
  UserIcon 
} from '@heroicons/react/24/solid'
import { agoraService } from '../services/agoraService'
import { chatService } from '../services/chatService'

const ScreenShare = ({ isActive, onStart, onStop }) => {
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState(null)
  const [stream, setStream] = useState(null)
  const [isGeneratingToken, setIsGeneratingToken] = useState(false)
  const [agoraToken, setAgoraToken] = useState(null)
  const [channelName, setChannelName] = useState(null)
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false)
  const videoRef = useRef(null)

  // Initialize Agora (placeholder for now)
  useEffect(() => {
    // TODO: Initialize Agora SDK here
    console.log('Agora SDK would be initialized here')
  }, [])

  // Ensure video element attaches srcObject and starts playing when stream changes
  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        try {
          videoRef.current.srcObject = stream
          // Try to play the video (some browsers require a play() call)
          const p = videoRef.current.play()
          if (p && p instanceof Promise) {
            p.catch(() => {
              // ignore autoplay/play promise rejection (user gesture may be required)
            })
          }
        } catch (err) {
          console.warn('Failed to attach stream to video element', err)
        }
      } else {
        videoRef.current.srcObject = null
      }
    }
  }, [stream])

  const startScreenShare = async () => {
    try {
      setError(null)
      setIsGeneratingToken(true)

      // Generate unique channel name
      const channel = agoraService.generateChannelName(`session_${Date.now()}`)
      setChannelName(channel)

      // Get Agora token from backend
      console.log('Generating Agora token for channel:', channel)
      const tokenResponse = await agoraService.generateToken(channel, 0, 1)
      
      if (!tokenResponse.success) {
        throw new Error(tokenResponse.error || 'Failed to generate Agora token')
      }

      setAgoraToken(tokenResponse.data)
      console.log('Agora token generated successfully')
      
      setIsGeneratingToken(false)
      
      // Use browser's native screen capture API for now
      // In production, this would be handled by Agora SDK with the token
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          resizeMode: 'crop-and-scale'
        },
        audio: false
      })

      setStream(screenStream)
      setIsSharing(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream
      }

      // Handle stream end (when user clicks browser's stop sharing button)
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare()
      })

      onStart()
      
    } catch (err) {
      console.error('Error starting screen share:', err)
      setError(`Failed to start screen sharing: ${err.message}`)
      setIsGeneratingToken(false)
    }
  }

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsSharing(false)
    setAgoraToken(null)
    setChannelName(null)
    onStop()
  }

  const switchToHumanAgent = () => {
    // Placeholder for human agent escalation
    alert('Connecting to human agent... (This is a prototype feature)')
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Screen Share Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <ComputerDesktopIcon className="w-6 h-6 text-gray-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Screen Sharing</h3>
            <p className="text-sm text-gray-500">
              {isSharing ? 'Your screen is being shared' : 'Ready to share your screen'}
            </p>
          </div>
        </div>
        
        {isSharing && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-600 font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Screen Share Content */}
      <div className="flex-1 p-4">
        {!isActive ? (
          /* Screen sharing not requested yet */
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <ComputerDesktopIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Screen Sharing Available
              </h3>
              <p className="text-gray-500 mb-4 max-w-md">
                When the AI assistant requests visual assistance, you'll be able to share your screen here.
              </p>
            </div>
          </div>
        ) : !isSharing ? (
          /* Screen sharing requested but not started */
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ComputerDesktopIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Ready to Share Your Screen?
              </h3>
              <p className="text-gray-600 mb-6">
                The AI assistant has requested to see your screen to provide better visual guidance. 
                Click the button below to start screen sharing.
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={startScreenShare}
                  disabled={isGeneratingToken}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingToken ? (
                    <>
                      <div className="w-5 h-5 inline mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Setting up session...
                    </>
                  ) : (
                    <>
                      <ComputerDesktopIcon className="w-5 h-5 inline mr-2" />
                      Share My Screen
                    </>
                  )}
                </button>
                
                <button
                  onClick={switchToHumanAgent}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  <UserIcon className="w-5 h-5 inline mr-2" />
                  Switch to Human Agent
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Screen sharing active */
          <div className="h-full flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Your Shared Screen</h4>
              <button
                onClick={stopScreenShare}
                className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                <StopIcon className="w-4 h-4 inline mr-2" />
                Stop Sharing
              </button>
            </div>
            
            <div className="flex-1 min-h-0 bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain bg-black"
              />
            </div>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                ✅ Your screen is now being shared. The AI can see your screen and provide visual guidance.
              </p>
              {channelName && (
                <p className="text-xs text-green-600 mt-1">
                  Session: {channelName}
                </p>
              )}
              {agoraToken && (
                <p className="text-xs text-green-600">
                  Token expires: {new Date(agoraToken.expires_at).toLocaleTimeString()}
                </p>
              )}
            <div className="mt-3 flex space-x-2">
              <button
                onClick={async () => {
                  if (!videoRef.current) return
                  setIsUploadingScreenshot(true)
                  try {
                    const video = videoRef.current
                    // Use device pixel ratio for higher quality screenshots
                    const dpr = window.devicePixelRatio || 1
                    const canvasWidth = (video.videoWidth || video.offsetWidth || 1280) * dpr
                    const canvasHeight = (video.videoHeight || video.offsetHeight || 720) * dpr
                    const canvas = document.createElement('canvas')
                    canvas.width = canvasWidth
                    canvas.height = canvasHeight
                    const ctx = canvas.getContext('2d')
                    ctx.scale(dpr, dpr)
                    ctx.drawImage(video, 0, 0, canvasWidth / dpr, canvasHeight / dpr)

                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95))
                    const fd = new FormData()
                    fd.append('file', blob, `screenshot-${Date.now()}.png`)

                    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/screenshots`, {
                      method: 'POST',
                      body: fd
                    })
                    const data = await resp.json()
                    if (data.success) {
                      // Send a chat message notifying the AI and include OCR if present
                      const ocrText = data.ocr_text || ''
                      const message = ocrText ? `User sent a screenshot. Extracted text:\n\n${ocrText}` : `User sent a screenshot: ${window.location.origin + data.url}`
                      const resp = await chatService.sendMessage(message, null, 'demo-user')

                      // Dispatch a window event so sibling components (ChatWindow) can react
                      try {
                        const payload = resp.success ? resp.data : { message: { id: `offline-${Date.now()}`, content: message, timestamp: new Date().toISOString(), metadata: { fallback: true } }, conversation_id: null }
                        window.dispatchEvent(new CustomEvent('ai-message', { detail: payload }))
                      } catch (e) {
                        console.warn('Failed to dispatch ai-message event', e)
                      }

                      // TODO: Replace alert with in-app toast/notification
                      alert('Screenshot sent to AI successfully.')
                    } else {
                      alert('Failed to upload screenshot: ' + (data.error || 'unknown'))
                    }
                  } catch (err) {
                    console.error('Screenshot upload failed', err)
                    alert('Screenshot upload failed: ' + err.message)
                  } finally {
                    setIsUploadingScreenshot(false)
                  }
                }}
                className={`py-2 px-4 rounded-md font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isUploadingScreenshot ? 'bg-indigo-700 text-white cursor-wait opacity-80' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                disabled={isUploadingScreenshot}
              >
                {isUploadingScreenshot ? (
                  <>
                    <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8.414A2 2 0 0017.414 7L14 3.586A2 2 0 0012.586 3H4z" /></svg>
                    Send Screenshot
                  </>
                )}
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScreenShare