import { useState, useEffect } from 'react'
import { HomePage } from './pages/HomePage'
import { IdeaDetailPage } from './pages/IdeaDetailPage'
import { getIdeas, getIdea, createIdea, updateIdeaStatus } from './lib/api'
import type { Idea, IdeaStatus, TabType } from './lib/types'

type View = 'home' | 'detail'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
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
        // Set initial history state
        if (!history.state) {
          history.replaceState({ view: 'home' }, '', '/')
        }
      } catch (err) {
        setError('Failed to load ideas. Please refresh.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadIdeas()
  }, [])

  // Handle browser/OS back gesture
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state
      if (state?.view === 'detail' && state?.ideaId) {
        // Forward navigation to detail
        const idea = ideas.find(i => i.id === state.ideaId)
        if (idea) {
          getIdea(idea.id).then(fullIdea => {
            setSelectedIdea(fullIdea)
            setView('detail')
          }).catch(console.error)
        }
      } else {
        // Back to home
        setView('home')
        setSelectedIdea(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [ideas])

  const handleSelectIdea = async (idea: Idea) => {
    try {
      const fullIdea = await getIdea(idea.id)
      setSelectedIdea(fullIdea)
      setView('detail')
      // Push history entry for browser back support
      history.pushState({ view: 'detail', ideaId: idea.id }, '', `/idea/${idea.id}`)
    } catch (err) {
      alert('Failed to load idea details.')
      console.error(err)
    }
  }

  const handleBack = async () => {
    setView('home')
    setSelectedIdea(null)
    // Push history entry for home
    history.pushState({ view: 'home' }, '', '/')
    // Refetch ideas to update viewed status (removes unread dots)
    try {
      const fetchedIdeas = await getIdeas()
      setIdeas(fetchedIdeas)
    } catch (err) {
      console.error('Failed to refresh ideas:', err)
    }
  }

  const handleCapture = async (input: string, isVoice: boolean) => {
    const newIdea = await createIdea(input, isVoice)
    setIdeas(prev => [newIdea, ...prev])
  }

  const handleStatusChange = async (id: string, newStatus: IdeaStatus) => {
    try {
      const updated = await updateIdeaStatus(id, newStatus)
      setIdeas(prev => prev.map(idea => idea.id === id ? updated : idea))
      if (selectedIdea?.id === id) {
        // Merge the updated fields while preserving analysis (which isn't returned by status update)
        setSelectedIdea(prev => prev ? { ...prev, ...updated, analysis: prev.analysis } : updated)
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
          onCapture={handleCapture}
        />
      )}

      {view === 'detail' && selectedIdea && (
        <IdeaDetailPage
          idea={selectedIdea}
          onBack={handleBack}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
