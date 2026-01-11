import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Mic, Type, Square, Send } from 'lucide-react'

interface CaptureModalProps {
  onClose: () => void
  onCapture: (input: string, isVoice: boolean) => void
}

type CaptureMode = 'voice' | 'text'
type VoiceState = 'idle' | 'recording' | 'stopped'

// Web Speech API types
interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
  start: () => void
  stop: () => void
}

export function CaptureModal({ onClose, onCapture }: CaptureModalProps) {
  const [mode, setMode] = useState<CaptureMode>('voice')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [textInput, setTextInput] = useState('')
  const [duration, setDuration] = useState(0)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const timerRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<number | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcriptText = result[0].transcript
            if (result.isFinal) {
              finalTranscript += transcriptText
            } else {
              interimTranscript += transcriptText
            }
          }

          setTranscript(prev => prev + finalTranscript + interimTranscript)

          // Reset silence timer on speech detection
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
          }
          silenceTimerRef.current = window.setTimeout(() => {
            stopRecording()
          }, 2000) // Stop after 2 seconds of silence
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error)
          stopRecording()
        }

        recognition.onend = () => {
          // Recognition ended - don't restart automatically
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [])

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Safari on iOS or Chrome on desktop.')
      return
    }

    setTranscript('')
    setDuration(0)
    setVoiceState('recording')

    try {
      recognitionRef.current.start()
    } catch {
      // Already started
    }

    timerRef.current = window.setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    setVoiceState('stopped')

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const handleVoiceCapture = () => {
    if (voiceState === 'idle') {
      startRecording()
    } else if (voiceState === 'recording') {
      stopRecording()
    } else if (voiceState === 'stopped' && transcript) {
      onCapture(transcript, true)
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
            <motion.button
              className={`voice-btn ${voiceState === 'recording' ? 'recording' : ''}`}
              onClick={handleVoiceCapture}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {voiceState === 'recording' ? (
                <Square size={40} />
              ) : voiceState === 'stopped' && transcript ? (
                <Send size={40} />
              ) : (
                <Mic size={40} />
              )}
            </motion.button>

            {voiceState === 'recording' && (
              <div className="voice-duration">{formatDuration(duration)}</div>
            )}

            <p className="voice-hint">
              {voiceState === 'idle' && 'Tap to start recording'}
              {voiceState === 'recording' && 'Tap to stop, or pause speaking'}
              {voiceState === 'stopped' && transcript && 'Tap to save your idea'}
            </p>

            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  maxHeight: '120px',
                  overflow: 'auto'
                }}
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
