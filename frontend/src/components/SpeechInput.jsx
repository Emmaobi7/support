import React, { useState, useRef } from 'react'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid'

const SpeechInput = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' })
        
        try {
          const formData = new FormData()
          formData.append('file', audioBlob, 'audio.wav')

          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/v1/transcribe`, {
            method: 'POST',
            body: formData
          })
          const data = await res.json()
          
          if (data.success && data.transcript) {
            onTranscript(data.transcript)
          } else {
            console.error('Transcription failed:', data.error)
          }
        } catch (err) {
          console.error('Upload failed:', err)
        } finally {
          setIsProcessing(false)
        }

        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isProcessing}
          className={`p-2 rounded-lg transition-all ${
            isProcessing
              ? 'bg-gray-200 text-gray-400 cursor-wait'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
          title="Start recording"
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all animate-pulse"
          title="Stop recording"
        >
          <StopIcon className="w-5 h-5" />
        </button>
      )}
      {isRecording && <span className="text-xs text-red-600 font-medium">Recording...</span>}
      {isProcessing && <span className="text-xs text-gray-600">Processing...</span>}
    </div>
  )
}

export default SpeechInput
