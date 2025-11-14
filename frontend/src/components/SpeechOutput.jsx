import React, { useState, useRef } from 'react'
import { SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/solid'

const SpeechOutput = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef(null)

  const playAudio = async () => {
    if (!text || !text.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!res.ok) throw new Error('TTS failed')

      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (err) {
      console.error('TTS error:', err)
      alert('Could not play audio. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
      />
      {!isPlaying ? (
        <button
          onClick={playAudio}
          disabled={isLoading}
          className={`p-1.5 rounded transition-all ${
            isLoading
              ? 'bg-gray-100 text-gray-400 cursor-wait'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
          title="Play audio"
        >
          <SpeakerWaveIcon className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={stopAudio}
          className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-all"
          title="Stop audio"
        >
          <StopIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default SpeechOutput
