import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, Send, Check, Clock } from 'lucide-react'
import type { Idea, Message } from '../lib/types'
import { mockMessages } from '../lib/mock-data'

interface IdeaDetailPageProps {
  idea: Idea
  onBack: () => void
  onStatusChange: (ideaId: string, status: 'pursuing' | 'deferred') => void
}

export function IdeaDetailPage({ idea, onBack, onStatusChange }: IdeaDetailPageProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [messages, setMessages] = useState<Message[]>(
    idea.id === '1' ? mockMessages : []
  )
  const [inputValue, setInputValue] = useState('')

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: "I'm processing your input and will update the analysis accordingly. Is there anything specific you'd like me to focus on?",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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
      <header className="detail-header">
        <button className="detail-back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-title-area">
          <div className="detail-status">{statusLabel[idea.status]}</div>
          <h1 className="detail-title">{idea.title}</h1>
        </div>
      </header>

      <div className="detail-content">
        {/* Original Transcript */}
        <div className="transcript-section">
          <button
            className={`transcript-toggle ${showTranscript ? 'expanded' : ''}`}
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <ChevronDown size={16} />
            Original transcript
          </button>

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
        </div>

        {/* Analysis Sections */}
        {idea.analysis && (
          <motion.div
            className="analysis-sections"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            <AnalysisCard label="Summary" delay={0}>
              {idea.analysis.summary}
            </AnalysisCard>

            <AnalysisCard label="Problem it Solves" delay={1}>
              {idea.analysis.problemItSolves}
            </AnalysisCard>

            <AnalysisCard label="How it Would Work" delay={2}>
              {idea.analysis.howItWouldWork}
            </AnalysisCard>

            <AnalysisCard label="Effort Estimate" delay={3}>
              {idea.analysis.effortEstimate}
            </AnalysisCard>

            <AnalysisCard label="Potential Value" delay={4}>
              {idea.analysis.potentialValue}
            </AnalysisCard>

            <AnalysisCard label="Challenges" delay={5}>
              {idea.analysis.challenges}
            </AnalysisCard>

            <AnalysisCard label="How to Accomplish" delay={6}>
              {idea.analysis.howToAccomplish}
            </AnalysisCard>

            <AnalysisCard label="Next Steps" delay={7}>
              {idea.analysis.nextSteps}
            </AnalysisCard>

            {idea.analysis.questionsForYou.length > 0 && (
              <AnalysisCard label="Questions for You" delay={8}>
                <ul>
                  {idea.analysis.questionsForYou.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </AnalysisCard>
            )}
          </motion.div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="chat-messages" style={{ marginTop: 'var(--space-6)' }}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="chat-section">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Ask a question or add context..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="chat-send"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      {(idea.status === 'ready' || idea.status === 'processing') && (
        <div className="detail-actions safe-area-inset-bottom">
          <button
            className="action-btn secondary"
            onClick={() => onStatusChange(idea.id, 'deferred')}
          >
            <Clock size={18} />
            Defer
          </button>
          <button
            className="action-btn primary"
            onClick={() => onStatusChange(idea.id, 'pursuing')}
          >
            <Check size={18} />
            Pursue
          </button>
        </div>
      )}
    </motion.div>
  )
}

interface AnalysisCardProps {
  label: string
  delay: number
  children: React.ReactNode
}

function AnalysisCard({ label, delay, children }: AnalysisCardProps) {
  return (
    <motion.div
      className="analysis-card"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{
        duration: 0.4,
        delay: delay * 0.05,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      <div className="analysis-card-label">{label}</div>
      <div className="analysis-card-content">{children}</div>
    </motion.div>
  )
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 'var(--space-3)'
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: isUser ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
          color: isUser ? 'var(--color-bg-deep)' : 'var(--color-text-primary)',
          fontSize: 'var(--text-sm)',
          lineHeight: 'var(--leading-relaxed)'
        }}
      >
        {message.content}
      </div>
    </motion.div>
  )
}
