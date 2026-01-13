import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Mic, Type, Square, Send, Play } from 'lucide-react'

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
  const [finalTranscript, setFinalTranscript] = useState('') // Only confirmed text
  const [interimTranscript, setInterimTranscript] = useState('') // Live preview
  const [textInput, setTextInput] = useState('')
  const [duration, setDuration] = useState(0)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const timerRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<number | null>(null)
  const voiceStateRef = useRef<VoiceState>('idle') // Track current state for callbacks
  const baseTranscriptRef = useRef('') // Transcript at session start (for "Continue" feature)

  // Keep ref in sync with state
  useEffect(() => {
    voiceStateRef.current = voiceState
  }, [voiceState])

  // Initialize speech recognition (once on mount)
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
          let finalText = ''
          let interimText = ''

          // Rebuild transcript from ALL results in current session
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i]
            const transcriptText = result[0].transcript

            if (result.isFinal) {
              finalText += transcriptText + ' '
            } else {
              interimText += transcriptText
            }
          }

          // Combine base transcript (from "Continue") with current session's results
          setFinalTranscript(baseTranscriptRef.current + finalText)
          setInterimTranscript(interimText)

          // Reset silence timer on speech detection
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
          }
          silenceTimerRef.current = window.setTimeout(() => {
            // Use the ref to get current state
            if (voiceStateRef.current === 'recording') {
              setVoiceState('stopped')
              setInterimTranscript('')
              if (recognitionRef.current) {
                recognitionRef.current.stop()
              }
              if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
              }
            }
          }, 3000) // Stop after 3 seconds of silence
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error)
          // Don't auto-stop on all errors - some are recoverable
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVoiceState('idle')
            alert('Microphone access denied. Please allow microphone access and try again.')
          }
        }

        recognition.onend = () => {
          // Recognition ended - just stop, don't auto-restart (fixes Android duplication)
          if (voiceStateRef.current === 'recording') {
            setVoiceState('stopped')
            setInterimTranscript('')
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current)
              silenceTimerRef.current = null
            }
          }
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // Already stopped
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, []) // Empty deps - initialize once

  const startRecording = (keepTranscript = false) => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Try Safari on iOS or Chrome on desktop.')
      return
    }

    if (!keepTranscript) {
      setFinalTranscript('')
      baseTranscriptRef.current = '' // Fresh start
      setDuration(0)
    } else {
      // "Continue" - preserve existing transcript as base for this session
      baseTranscriptRef.current = finalTranscript
    }
    setInterimTranscript('')
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
    setInterimTranscript('') // Clear any remaining interim

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

  const continueRecording = () => {
    startRecording(true) // Keep existing transcript
  }

  const handleMainButtonClick = () => {
    if (voiceState === 'idle') {
      startRecording()
    } else if (voiceState === 'recording') {
      stopRecording()
    }
  }

  const handleSaveIdea = () => {
    if (finalTranscript.trim()) {
      onCapture(finalTranscript.trim(), true)
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

  // Combined display: final + interim (interim shown differently)
  const displayTranscript = finalTranscript + interimTranscript

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
            {/* Main record/stop button - only show when not stopped with transcript */}
            {!(voiceState === 'stopped' && finalTranscript.trim()) && (
              <motion.button
                className={`voice-btn ${voiceState === 'recording' ? 'recording' : ''}`}
                onClick={handleMainButtonClick}
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

            {/* Stopped state: show Continue + Save buttons */}
            {voiceState === 'stopped' && finalTranscript.trim() && (
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
              {voiceState === 'idle' && 'Tap to start recording'}
              {voiceState === 'recording' && 'Tap to stop, or pause speaking'}
              {voiceState === 'stopped' && finalTranscript.trim() && 'Continue recording or save your idea'}
            </p>

            {displayTranscript && (
              <motion.div
                className="voice-transcript"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span>"{finalTranscript}</span>
                {interimTranscript && (
                  <span style={{ opacity: 0.5 }}>{interimTranscript}</span>
                )}
                <span>"</span>
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
