import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Mic, Type, Square, Send, Play } from 'lucide-react'

interface CaptureModalProps {
  onClose: () => void
  onCapture: (input: string, isVoice: boolean) => void
}

type CaptureMode = 'voice' | 'text'
type VoiceState = 'idle' | 'recording' | 'stopped'

export function CaptureModal({ onClose, onCapture }: CaptureModalProps) {
  const [mode, setMode] = useState<CaptureMode>('voice')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const previousTranscriptRef = useRef('')

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const transcribeAudio = async (audioBlob: Blob) => {
    setVoiceState('stopped')
    setIsTranscribing(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      const newTranscript = previousTranscriptRef.current
        ? previousTranscriptRef.current + ' ' + data.transcript
        : data.transcript
      setTranscript(newTranscript)
      previousTranscriptRef.current = ''
    } catch (error) {
      console.error('Transcription error:', error)
      alert('Failed to transcribe audio. Please try again.')
      setVoiceState('idle')
    } finally {
      setIsTranscribing(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        // Create blob and transcribe
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        })
        await transcribeAudio(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setVoiceState('recording')
      setDuration(0)

      // Start duration timer
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const continueRecording = () => {
    previousTranscriptRef.current = transcript
    setTranscript('')
    startRecording()
  }

  const handleMicClick = () => {
    if (voiceState === 'idle') {
      startRecording()
    } else if (voiceState === 'recording') {
      stopRecording()
    }
  }

  const handleSaveIdea = () => {
    if (transcript.trim()) {
      onCapture(transcript.trim(), true)
    }
  }

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onCapture(textInput.trim(), false)
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      className="capture-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="capture-modal"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="capture-header">
          <h2 className="capture-title">Capture Idea</h2>
          <button className="capture-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="capture-modes">
          <button
            className={`capture-mode ${mode === 'voice' ? 'selected' : ''}`}
            onClick={() => setMode('voice')}
          >
            <Mic className="capture-mode-icon" />
            <span className="capture-mode-label">Voice</span>
          </button>
          <button
            className={`capture-mode ${mode === 'text' ? 'selected' : ''}`}
            onClick={() => setMode('text')}
          >
            <Type className="capture-mode-icon" />
            <span className="capture-mode-label">Text</span>
          </button>
        </div>

        {/* Voice Recording */}
        {mode === 'voice' && (
          <div className="voice-recorder">
            {/* Main record/stop button - hide when transcribing or showing results */}
            {!isTranscribing && !(voiceState === 'stopped' && transcript.trim()) && (
              <motion.button
                className={`voice-btn ${voiceState === 'recording' ? 'recording' : ''}`}
                onClick={handleMicClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {voiceState === 'recording' ? (
                  <Square size={40} />
                ) : (
                  <Mic size={40} />
                )}
              </motion.button>
            )}

            {voiceState === 'recording' && (
              <div className="voice-duration">{formatDuration(duration)}</div>
            )}

            {/* Transcribing indicator */}
            {isTranscribing && (
              <motion.div
                className="transcribing-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="spinner" />
                <span>Transcribing...</span>
              </motion.div>
            )}

            {/* Stopped state: show Continue + Save buttons */}
            {voiceState === 'stopped' && transcript.trim() && !isTranscribing && (
              <motion.div
                className="voice-actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button className="voice-action-btn secondary" onClick={continueRecording}>
                  <Play size={20} />
                  Continue
                </button>
                <button className="voice-action-btn primary" onClick={handleSaveIdea}>
                  <Send size={20} />
                  Save Idea
                </button>
              </motion.div>
            )}

            <p className="voice-hint">
              {voiceState === 'idle' && !isTranscribing && 'Tap to start recording'}
              {voiceState === 'recording' && 'Tap to stop'}
              {isTranscribing && 'Processing your voice...'}
              {voiceState === 'stopped' && transcript.trim() && !isTranscribing && 'Continue recording or save your idea'}
            </p>

            {/* Transcript display */}
            {transcript && !isTranscribing && (
              <motion.div
                className="voice-transcript"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                "{transcript}"
              </motion.div>
            )}
          </div>
        )}

        {/* Text Input */}
        {mode === 'text' && (
          <div className="text-capture">
            <textarea
              className="text-input"
              placeholder="Describe your idea..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              autoFocus
            />
            <button
              className="text-submit"
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              <Send size={16} />
              Save Idea
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
