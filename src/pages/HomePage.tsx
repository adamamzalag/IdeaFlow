import { motion } from 'framer-motion'
import { Settings, Sparkles, ChevronRight, Lightbulb } from 'lucide-react'
import type { Idea, TabType } from '../lib/types'

interface HomePageProps {
  ideas: Idea[]
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onSelectIdea: (idea: Idea) => void
  onOpenCapture: () => void
}

export function HomePage({
  ideas,
  activeTab,
  onTabChange,
  onSelectIdea,
  onOpenCapture
}: HomePageProps) {
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
                  staggerChildren: 0.05
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

      <motion.button
        className="capture-fab"
        onClick={onOpenCapture}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Sparkles className="capture-fab-icon" />
        Capture Idea
      </motion.button>
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
  return (
    <motion.div
      className="idea-card"
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="idea-card-header">
        <h3 className="idea-card-title">{idea.title}</h3>
        <StatusBadge status={idea.status} />
      </div>

      <p className="idea-card-preview">
        {idea.analysis?.summary || idea.rawInput}
      </p>

      <div className="idea-card-footer">
        <span className="idea-card-time">
          {formatRelativeTime(idea.updatedAt)}
        </span>
        <ChevronRight className="idea-card-arrow" />
      </div>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: Idea['status'] }) {
  if (status === 'processing') {
    return (
      <span className="idea-card-status processing">
        <span className="idea-card-status-dot" />
        Processing
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
