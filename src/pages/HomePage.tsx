import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Sparkles, ChevronRight, Lightbulb, Mic, X, Play, Pencil, Check } from 'lucide-react'
import type { Idea, TabType } from '../lib/types'

interface HomePageProps {
  ideas: Idea[]
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onSelectIdea: (idea: Idea) => void
  onCapture: (input: string, isVoice: boolean) => Promise<void>
}

export function HomePage({
  ideas,
  activeTab,
  onTabChange,
  onSelectIdea,
  onCapture
}: HomePageProps) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [showReviewScreen, setShowReviewScreen] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecordingInReview, setIsRecordingInReview] = useState(false)
  const [isTranscribingInReview, setIsTranscribingInReview] = useState(false)
  const [reviewKeyboardOffset, setReviewKeyboardOffset] = useState(0)

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStreamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // Keyboard detection for review modal
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      const offset = window.innerHeight - viewport.height
      setReviewKeyboardOffset(offset > 0 ? offset : 0)
    }

    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      viewport.removeEventListener('scroll', handleResize)
    }
  }, [])

  const filteredIdeas = ideas.filter(idea => {
    if (activeTab === 'active') return idea.status === 'processing' || idea.status === 'ready'
    if (activeTab === 'pursuing') return idea.status === 'pursuing'
    if (activeTab === 'deferred') return idea.status === 'deferred'
    return false
  })

  const counts = {
    active: ideas.filter(i => i.status === 'processing' || i.status === 'ready').length,
    pursuing: ideas.filter(i => i.status === 'pursuing').length,
    deferred: ideas.filter(i => i.status === 'deferred').length
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordingStreamRef.current = stream
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Stop stream tracks
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(t => t.stop())
          recordingStreamRef.current = null
        }

        // Create blob and transcribe
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType
        })

        setIsTranscribing(true)
        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error('Transcription failed')
          }

          const data = await response.json()
          // Append to existing transcript with space
          setTranscript(prev => prev ? `${prev} ${data.transcript}` : data.transcript)
          setShowReviewScreen(true)
        } catch (error) {
          console.error('Transcription error:', error)
          alert('Failed to transcribe audio. Please try again.')
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Could not access microphone. Please allow microphone access and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleCaptureClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Start recording within the review modal
  const startRecordingInReview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordingStreamRef.current = stream
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Stop stream tracks
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(t => t.stop())
          recordingStreamRef.current = null
        }

        // Create blob and transcribe
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType
        })

        setIsTranscribingInReview(true)
        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error('Transcription failed')
          }

          const data = await response.json()
          // Append to existing transcript with space
          setTranscript(prev => prev ? `${prev} ${data.transcript}` : data.transcript)
        } catch (error) {
          console.error('Transcription error:', error)
          alert('Failed to transcribe audio. Please try again.')
        } finally {
          setIsTranscribingInReview(false)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecordingInReview(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Could not access microphone. Please allow microphone access and try again.')
    }
  }

  const stopRecordingInReview = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecordingInReview(false)
    }
  }

  const handleContinue = () => {
    if (isRecordingInReview) {
      // Stop recording if already recording
      stopRecordingInReview()
    } else {
      // Start recording within the review modal
      startRecordingInReview()
    }
  }

  const handleEdit = () => {
    setIsEditing(!isEditing)
  }

  const handleSave = async () => {
    if (!transcript.trim()) return

    setIsSaving(true)
    try {
      await onCapture(transcript.trim(), true)
      // Reset all state on successful save
      setTranscript('')
      setShowReviewScreen(false)
      setIsEditing(false)
      setIsRecordingInReview(false)
      setIsTranscribingInReview(false)
    } catch (err) {
      alert('Failed to save idea. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Stop any ongoing recording in review
    if (isRecordingInReview) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(t => t.stop())
        recordingStreamRef.current = null
      }
    }
    setTranscript('')
    setShowReviewScreen(false)
    setIsEditing(false)
    setIsRecordingInReview(false)
    setIsTranscribingInReview(false)
  }

  return (
    <>
      <header className="header safe-area-inset-top">
        <div className="header-content">
          <h1 className="logo">IdeaFlow</h1>
          <div className="header-actions">
            <button className="icon-btn" aria-label="Settings">
              <Settings />
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="tabs">
          <TabButton
            active={activeTab === 'active'}
            count={counts.active}
            onClick={() => onTabChange('active')}
          >
            Active
          </TabButton>
          <TabButton
            active={activeTab === 'pursuing'}
            count={counts.pursuing}
            onClick={() => onTabChange('pursuing')}
          >
            Pursuing
          </TabButton>
          <TabButton
            active={activeTab === 'deferred'}
            count={counts.deferred}
            onClick={() => onTabChange('deferred')}
          >
            Deferred
          </TabButton>
        </div>

        {filteredIdeas.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <motion.div
            className="ideas-list"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.03
                }
              }
            }}
          >
            {filteredIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onClick={() => onSelectIdea(idea)}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Capture FAB - transforms when recording */}
      <div className="capture-fab-container">
        <motion.button
          className={`capture-fab ${isRecording ? 'recording' : ''} ${isTranscribing ? 'transcribing' : ''}`}
          onClick={handleCaptureClick}
          whileTap={{ scale: 0.95 }}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <>
              <div className="capture-fab-spinner" />
              <span className="capture-fab-text">Transcribing...</span>
            </>
          ) : isRecording ? (
            <>
              <Mic className="capture-fab-icon" />
              <span className="capture-fab-text">Tap to Stop</span>
            </>
          ) : (
            <>
              <Sparkles className="capture-fab-icon" />
              <span className="capture-fab-text">Capture Idea</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Review Screen Overlay */}
      <AnimatePresence>
        {showReviewScreen && (
          <motion.div
            className="review-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="review-screen"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                paddingBottom: isEditing && reviewKeyboardOffset > 0
                  ? `calc(var(--space-4) + env(safe-area-inset-bottom) + ${reviewKeyboardOffset}px)`
                  : undefined
              }}
            >
              <div className="review-header">
                <h2 className="review-title">Your Idea</h2>
                <button className="review-close" onClick={handleCancel}>
                  <X size={18} />
                </button>
              </div>

              <div className="review-content">
                {isEditing ? (
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="review-textarea"
                    autoFocus
                  />
                ) : (
                  <p className="review-transcript">{transcript}</p>
                )}
              </div>

              <div className="review-actions">
                <button
                  className={`review-action-btn ${isRecordingInReview ? 'recording-mic' : 'secondary'} ${isTranscribingInReview ? 'transcribing' : ''}`}
                  onClick={handleContinue}
                  disabled={isSaving || isTranscribingInReview}
                >
                  {isTranscribingInReview ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Transcribing...</span>
                    </>
                  ) : isRecordingInReview ? (
                    <>
                      <Mic size={18} />
                      <span>Tap to Stop</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      <span>Continue</span>
                    </>
                  )}
                </button>
                <button
                  className="review-action-btn secondary"
                  onClick={handleEdit}
                  disabled={isSaving || isRecordingInReview || isTranscribingInReview}
                >
                  {isEditing ? <Check size={18} /> : <Pencil size={18} />}
                  <span>{isEditing ? 'Done' : 'Edit'}</span>
                </button>
                <button
                  className="review-action-btn primary"
                  onClick={handleSave}
                  disabled={!transcript.trim() || isSaving || isRecordingInReview || isTranscribingInReview}
                >
                  {isSaving ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface TabButtonProps {
  active: boolean
  count: number
  onClick: () => void
  children: React.ReactNode
}

function TabButton({ active, count, onClick, children }: TabButtonProps) {
  return (
    <button
      className={`tab ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
      {count > 0 && <span className="tab-count">{count}</span>}
    </button>
  )
}

interface IdeaCardProps {
  idea: Idea
  onClick: () => void
}

function IdeaCard({ idea, onClick }: IdeaCardProps) {
  const isUnread = idea.status === 'ready' && !idea.analysisViewedAt

  return (
    <motion.div
      className="idea-card"
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {isUnread && <div className="idea-card-unread-dot" />}
      <div className="idea-card-content">
        <div className="idea-card-header">
          <h3 className="idea-card-title">{idea.title}</h3>
          <StatusBadge status={idea.status} />
        </div>
        <span className="idea-card-meta">
          {formatRelativeTime(idea.updatedAt)}
        </span>
      </div>
      <ChevronRight className="idea-card-arrow" />
    </motion.div>
  )
}

function StatusBadge({ status }: { status: Idea['status'] }) {
  if (status === 'processing') {
    return (
      <span className="idea-card-status processing">
        <span className="idea-card-status-dot" />
        Analyzing...
      </span>
    )
  }

  if (status === 'ready') {
    return (
      <span className="idea-card-status ready">
        <span className="idea-card-status-dot" />
        Ready
      </span>
    )
  }

  return null
}

function EmptyState({ tab }: { tab: TabType }) {
  const messages = {
    active: {
      title: 'No active ideas',
      text: 'Capture your first idea using the button below'
    },
    pursuing: {
      title: 'Nothing in pursuit',
      text: 'Ideas you decide to pursue will appear here'
    },
    deferred: {
      title: 'No deferred ideas',
      text: 'Ideas you set aside for later will appear here'
    }
  }

  return (
    <div className="ideas-empty">
      <Lightbulb className="ideas-empty-icon" />
      <h2 className="ideas-empty-title">{messages[tab].title}</h2>
      <p className="ideas-empty-text">{messages[tab].text}</p>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
