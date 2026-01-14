import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, Send, Check, Clock, FileText, MessageCircle, Loader2, X, Eye, Mic } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Idea, Message } from '../lib/types'
import { getChatMessages, sendChatMessage, regenerateAnalysisFromChat, markIdeaViewed } from '../lib/api'

type DetailTab = 'analysis' | 'chat'

interface IdeaDetailPageProps {
  idea: Idea
  onBack: () => void
  onStatusChange: (ideaId: string, status: 'pursuing' | 'deferred' | 'ready') => void
}

// Hook to handle keyboard visibility on mobile (especially Android Chrome)
function useKeyboardOffset() {
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      // Calculate keyboard height by comparing viewport height to window height
      const keyboardHeight = window.innerHeight - viewport.height
      setKeyboardOffset(keyboardHeight > 0 ? keyboardHeight : 0)
    }

    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      viewport.removeEventListener('scroll', handleResize)
    }
  }, [])

  return keyboardOffset
}

export function IdeaDetailPage({ idea, onBack, onStatusChange }: IdeaDetailPageProps) {
  // Local status for optimistic UI updates (shows change immediately)
  const [localStatus, setLocalStatus] = useState(idea.status)

  // Sync local status when prop changes (e.g., from server response)
  useEffect(() => {
    setLocalStatus(idea.status)
  }, [idea.status])

  const handleStatusToggle = (targetStatus: 'pursuing' | 'deferred') => {
    const newStatus = localStatus === targetStatus ? 'ready' : targetStatus
    setLocalStatus(newStatus) // Immediate UI update
    onStatusChange(idea.id, newStatus) // Async server update
  }

  const [activeTab, setActiveTab] = useState<DetailTab>('analysis')
  const [showTranscript, setShowTranscript] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const keyboardOffset = useKeyboardOffset()

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
    }
  }, [inputValue])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load chat messages and mark idea as viewed on mount
  useEffect(() => {
    async function initialize() {
      try {
        // Mark idea as viewed
        await markIdeaViewed(idea.id)

        // Load existing chat messages
        const existingMessages = await getChatMessages(idea.id)
        setMessages(existingMessages)
      } catch (err) {
        console.error('Failed to initialize:', err)
      } finally {
        setLoadingMessages(false)
      }
    }
    initialize()
  }, [idea.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom()
    }
  }, [messages, activeTab])

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsSending(true)

    // Optimistically add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      // Send message to API
      const result = await sendChatMessage(idea.id, userMessage)

      // Update messages with the full history from server
      setMessages(result.messages)
      setHasNewMessages(true)
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1))
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordingStreamRef.current = stream
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        setIsTranscribing(true)
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error('Transcription failed')
          }

          const { transcript } = await response.json()
          // Append to existing input (don't replace)
          setInputValue(prev => prev ? `${prev} ${transcript}` : transcript)
        } catch (err) {
          console.error('Transcription error:', err)
          alert('Failed to transcribe audio. Please try again.')
        } finally {
          setIsTranscribing(false)
        }

        // Stop all audio tracks and cleanup
        recordingStreamRef.current?.getTracks().forEach(t => t.stop())
        recordingStreamRef.current = null
        setMediaRecorder(null)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  // Cleanup recording resources on unmount
  useEffect(() => {
    return () => {
      recordingStreamRef.current?.getTracks().forEach(t => t.stop())
      recordingStreamRef.current = null
    }
  }, [])

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Simple tab change - no regeneration on tab switch
  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab)
  }

  // Handle back navigation - regenerate analysis if there are new messages (fire-and-forget)
  const handleBack = useCallback(() => {
    if (hasNewMessages) {
      // Fire and forget - don't await, just trigger in background
      regenerateAnalysisFromChat(idea.id).catch(err => {
        console.error('Failed to update analysis:', err)
      })
    }
    onBack() // Navigate immediately
  }, [hasNewMessages, idea.id, onBack])

  const statusLabel = {
    processing: 'Processing',
    ready: 'Ready to Review',
    pursuing: 'Pursuing',
    deferred: 'Deferred'
  }

  return (
    <motion.div
      className="detail-page"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <header className="detail-header">
        <div className="detail-header-top">
          <button className="detail-back" onClick={handleBack}>
            <ArrowLeft size={18} />
          </button>
          <div className="detail-title-area">
            <div className="detail-status">{statusLabel[idea.status]}</div>
            <h1 className="detail-title">{idea.title}</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          <button
            className={`detail-tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => handleTabChange('analysis')}
          >
            <FileText size={16} />
            Analysis
            {hasNewMessages && (
              <span className="detail-tab-badge" title="Analysis will update when you leave" />
            )}
          </button>
          <button
            className={`detail-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            <MessageCircle size={16} />
            Chat
            {messages.length > 0 && (
              <span style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginLeft: '4px'
              }}>
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="detail-content">
        <AnimatePresence mode="wait">
          {activeTab === 'analysis' ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AnalysisView
                idea={idea}
                showTranscript={showTranscript}
                onToggleTranscript={() => setShowTranscript(!showTranscript)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="chat-view"
            >
              {/* View Analysis Button - Quick access while chatting */}
              {idea.analysis && (
                <button
                  className="view-analysis-btn"
                  onClick={() => setShowAnalysisModal(true)}
                >
                  <Eye size={14} />
                  View Analysis
                </button>
              )}
              <ChatMessagesView
                messages={messages}
                messagesEndRef={messagesEndRef}
                isLoading={loadingMessages}
                isSending={isSending}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Bar - Input + Action Buttons */}
      <div
        className="detail-bottom-bar"
        style={{
          transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined
        }}
      >
        {/* Chat Input - only shown on chat tab */}
        {activeTab === 'chat' && (
          <div className="chat-input-section">
            <div className="chat-input-wrapper">
              <button
                className={`chat-mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                disabled={isSending || isTranscribing}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isTranscribing ? (
                  <Loader2 size={20} className="spin" />
                ) : (
                  <Mic size={20} />
                )}
              </button>
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Ask a question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isSending}
              />
              <button
                className="chat-send"
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
              >
                {isSending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions - hide when keyboard is open, show for all statuses except processing */}
        {keyboardOffset === 0 && idea.status !== 'processing' && (
          <div className="detail-footer-actions">
            <button
              className={`action-btn secondary ${localStatus === 'deferred' ? 'active-defer' : ''}`}
              onClick={() => handleStatusToggle('deferred')}
            >
              <Clock size={16} />
              {localStatus === 'deferred' ? 'Deferred ✓' : 'Defer'}
            </button>
            <button
              className={`action-btn secondary ${localStatus === 'pursuing' ? 'active-pursue' : ''}`}
              onClick={() => handleStatusToggle('pursuing')}
            >
              <Check size={16} />
              {localStatus === 'pursuing' ? 'Pursuing ✓' : 'Pursue'}
            </button>
          </div>
        )}
      </div>

      {/* Analysis Modal - View analysis while in chat */}
      <AnimatePresence>
        {showAnalysisModal && idea.analysis && (
          <motion.div
            className="analysis-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowAnalysisModal(false)}
          >
            <motion.div
              className="analysis-modal"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="analysis-modal-header">
                <h3>Analysis</h3>
                <button
                  className="analysis-modal-close"
                  onClick={() => setShowAnalysisModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="analysis-modal-content markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {idea.analysis.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface AnalysisViewProps {
  idea: Idea
  showTranscript: boolean
  onToggleTranscript: () => void
}

function AnalysisView({ idea, showTranscript, onToggleTranscript }: AnalysisViewProps) {
  return (
    <>
      {/* Original Transcript */}
      <div className="transcript-section">
        <button
          className={`transcript-toggle ${showTranscript ? 'expanded' : ''}`}
          onClick={onToggleTranscript}
        >
          <ChevronDown size={14} />
          Original transcript
        </button>

        <AnimatePresence>
          {showTranscript && (
            <motion.div
              className="transcript-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              "{idea.rawInput}"
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Analysis - Markdown document */}
      {idea.analysis && (
        <div className="analysis-document markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {idea.analysis.content}
          </ReactMarkdown>
        </div>
      )}
    </>
  )
}

interface ChatMessagesViewProps {
  messages: Message[]
  messagesEndRef: React.RefObject<HTMLDivElement>
  isLoading: boolean
  isSending: boolean
}

function ChatMessagesView({ messages, messagesEndRef, isLoading, isSending }: ChatMessagesViewProps) {
  if (isLoading) {
    return (
      <div className="chat-empty">
        <Loader2 className="chat-empty-icon spin" />
        <p className="chat-empty-text">Loading messages...</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="chat-empty">
        <MessageCircle className="chat-empty-icon" />
        <p className="chat-empty-text">
          Ask questions or add context to refine the analysis
        </p>
      </div>
    )
  }

  return (
    <div className="chat-messages">
      {messages.map((message, index) => (
        <motion.div
          key={index}
          className={`chat-message ${message.role}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {message.content}
        </motion.div>
      ))}
      {isSending && (
        <motion.div
          className="chat-message assistant"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Loader2 size={16} className="spin" style={{ display: 'inline-block' }} />
        </motion.div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
