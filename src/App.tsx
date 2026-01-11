import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { HomePage } from './pages/HomePage'
import { IdeaDetailPage } from './pages/IdeaDetailPage'
import { CaptureModal } from './components/CaptureModal'
import { mockIdeas } from './lib/mock-data'
import type { Idea, TabType } from './lib/types'

type View = 'home' | 'detail'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [showCapture, setShowCapture] = useState(false)
  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas)
  const [activeTab, setActiveTab] = useState<TabType>('active')

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea)
    setView('detail')
  }

  const handleBack = () => {
    setView('home')
    setSelectedIdea(null)
  }

  const handleCapture = (input: string, _isVoice: boolean) => {
    const newIdea: Idea = {
      id: String(Date.now()),
      title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
      rawInput: input,
      status: 'processing',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setIdeas(prev => [newIdea, ...prev])
    setShowCapture(false)

    // Simulate processing completion after 3 seconds
    setTimeout(() => {
      setIdeas(prev => prev.map(idea =>
        idea.id === newIdea.id
          ? {
              ...idea,
              status: 'ready' as const,
              title: 'New idea being analyzed...',
              analysis: {
                version: 1,
                summary: 'This idea is being analyzed by AI...',
                problemItSolves: 'Analysis in progress...',
                howItWouldWork: 'Analysis in progress...',
                effortEstimate: 'Analysis in progress...',
                potentialValue: 'Analysis in progress...',
                challenges: 'Analysis in progress...',
                howToAccomplish: 'Analysis in progress...',
                nextSteps: 'Analysis in progress...',
                questionsForYou: []
              }
            }
          : idea
      ))
    }, 3000)
  }

  const handleStatusChange = (ideaId: string, newStatus: 'pursuing' | 'deferred') => {
    setIdeas(prev => prev.map(idea =>
      idea.id === ideaId ? { ...idea, status: newStatus, updatedAt: new Date() } : idea
    ))
    if (selectedIdea?.id === ideaId) {
      setSelectedIdea(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }

  return (
    <div className="app">
      {view === 'home' && (
        <HomePage
          ideas={ideas}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSelectIdea={handleSelectIdea}
          onOpenCapture={() => setShowCapture(true)}
        />
      )}

      {view === 'detail' && selectedIdea && (
        <IdeaDetailPage
          idea={selectedIdea}
          onBack={handleBack}
          onStatusChange={handleStatusChange}
        />
      )}

      <AnimatePresence>
        {showCapture && (
          <CaptureModal
            onClose={() => setShowCapture(false)}
            onCapture={handleCapture}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
