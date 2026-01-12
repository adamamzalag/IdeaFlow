import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, Send, Check, Clock, FileText, MessageCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Idea, Message } from '../lib/types'
import { mockMessages } from '../lib/mock-data'

type DetailTab = 'analysis' | 'chat'

interface IdeaDetailPageProps {
  idea: Idea
  onBack: () => void
  onStatusChange: (ideaId: string, status: 'pursuing' | 'deferred') => void
}

export function IdeaDetailPage({ idea, onBack, onStatusChange }: IdeaDetailPageProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('analysis')
  const [showTranscript, setShowTranscript] = useState(false)
  const [messages, setMessages] = useState<Message[]>(
    idea.id === '1' ? mockMessages : []
  )
  const [inputValue, setInputValue] = useState('')
  const [hasNewAnalysis, setHasNewAnalysis] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom()
    }
  }, [messages, activeTab])

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
        content: "I've updated the analysis based on your input. You can switch to the Analysis tab to see the changes.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setHasNewAnalysis(true)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab)
    if (tab === 'analysis') {
      setHasNewAnalysis(false)
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
      {/* Header */}
      <header className="detail-header">
        <div className="detail-header-top">
          <button className="detail-back" onClick={onBack}>
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
            {hasNewAnalysis && activeTab !== 'analysis' && (
              <span className="detail-tab-badge" />
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
              <ChatView
                messages={messages}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                messagesEndRef={messagesEndRef}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      {(idea.status === 'ready' || idea.status === 'processing') && (
        <div className="detail-footer">
          <button
            className="action-btn secondary"
            onClick={() => onStatusChange(idea.id, 'deferred')}
          >
            <Clock size={16} />
            Defer
          </button>
          <button
            className="action-btn primary"
            onClick={() => onStatusChange(idea.id, 'pursuing')}
          >
            <Check size={16} />
            Pursue
          </button>
        </div>
      )}
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

interface ChatViewProps {
  messages: Message[]
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
}

function ChatView({ messages, inputValue, onInputChange, onSend, onKeyDown, messagesEndRef }: ChatViewProps) {
  return (
    <>
      {messages.length === 0 ? (
        <div className="chat-empty">
          <MessageCircle className="chat-empty-icon" />
          <p className="chat-empty-text">
            Ask questions or add context to refine the analysis
          </p>
        </div>
      ) : (
        <div className="chat-messages">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`chat-message ${message.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message.content}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="chat-input-section">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Ask a question..."
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
          />
          <button
            className="chat-send"
            onClick={onSend}
            disabled={!inputValue.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  )
}
