import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { HomePage } from './pages/HomePage'
import { IdeaDetailPage } from './pages/IdeaDetailPage'
import { CaptureModal } from './components/CaptureModal'
import { getIdeas, getIdea, createIdea, updateIdeaStatus } from './lib/api'
import type { Idea, IdeaStatus, TabType } from './lib/types'

type View = 'home' | 'detail'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [showCapture, setShowCapture] = useState(false)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadIdeas() {
      try {
        setLoading(true)
        const fetchedIdeas = await getIdeas()
        setIdeas(fetchedIdeas)
        setError(null)
      } catch (err) {
        setError('Failed to load ideas. Please refresh.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadIdeas()
  }, [])

  const handleSelectIdea = async (idea: Idea) => {
    try {
      const fullIdea = await getIdea(idea.id)
      setSelectedIdea(fullIdea)
      setView('detail')
    } catch (err) {
      alert('Failed to load idea details.')
      console.error(err)
    }
  }

  const handleBack = () => {
    setView('home')
    setSelectedIdea(null)
  }

  const handleCapture = async (input: string, isVoice: boolean) => {
    try {
      const newIdea = await createIdea(input, isVoice)
      setIdeas(prev => [newIdea, ...prev])
      setShowCapture(false)
    } catch (err) {
      alert('Failed to save idea. Please try again.')
      console.error(err)
    }
  }

  const handleStatusChange = async (id: string, newStatus: IdeaStatus) => {
    try {
      const updated = await updateIdeaStatus(id, newStatus)
      setIdeas(prev => prev.map(idea => idea.id === id ? updated : idea))
      if (selectedIdea?.id === id) {
        setSelectedIdea(updated)
      }
    } catch (err) {
      alert('Failed to update idea.')
      console.error(err)
    }
  }

  if (loading) {
    return <div className="app loading"><p>Loading ideas...</p></div>
  }

  if (error) {
    return <div className="app error"><p>{error}</p></div>
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
