import type { Idea, IdeaStatus, Analysis, Message } from './types'

const API_BASE = '/api'

/**
 * Helper to get title with fallback to truncated rawInput
 */
function getTitleWithFallback(idea: any): string {
  if (idea.title) {
    return idea.title
  }
  // Fallback: truncate rawInput
  return idea.rawInput.slice(0, 50) + (idea.rawInput.length > 50 ? '...' : '')
}

/**
 * Fetch all ideas from the backend
 */
export async function getIdeas(): Promise<Idea[]> {
  const response = await fetch(`${API_BASE}/ideas`)
  if (!response.ok) {
    throw new Error('Failed to fetch ideas')
  }
  const data = await response.json()

  // Transform to frontend format
  return data.map((idea: any) => ({
    id: idea.id,
    title: getTitleWithFallback(idea),
    rawInput: idea.rawInput,
    audioUrl: idea.audioUrl,
    status: idea.status as IdeaStatus,
    createdAt: new Date(idea.createdAt),
    updatedAt: new Date(idea.updatedAt),
    analysisViewedAt: idea.analysisViewedAt ? new Date(idea.analysisViewedAt) : null,
  }))
}

/**
 * Fetch a single idea with its analysis
 */
export async function getIdea(id: string): Promise<Idea> {
  const response = await fetch(`${API_BASE}/ideas/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch idea')
  }
  const idea = await response.json()

  // Transform to frontend format
  const result: Idea = {
    id: idea.id,
    title: getTitleWithFallback(idea),
    rawInput: idea.rawInput,
    audioUrl: idea.audioUrl,
    status: idea.status as IdeaStatus,
    createdAt: new Date(idea.createdAt),
    updatedAt: new Date(idea.updatedAt),
    analysisViewedAt: idea.analysisViewedAt ? new Date(idea.analysisViewedAt) : null,
  }

  // Include analysis if present
  if (idea.analysis) {
    result.analysis = {
      version: idea.analysis.version,
      content: idea.analysis.content,
    } as Analysis
  }

  return result
}

/**
 * Create a new idea
 */
export async function createIdea(rawInput: string, isVoice: boolean): Promise<Idea> {
  const response = await fetch(`${API_BASE}/ideas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rawInput, isVoice }),
  })

  if (!response.ok) {
    throw new Error('Failed to create idea')
  }
  const idea = await response.json()

  // Transform to frontend format
  // Note: title will be null initially (still processing), fallback to rawInput
  return {
    id: idea.id,
    title: getTitleWithFallback(idea),
    rawInput: idea.rawInput,
    audioUrl: idea.audioUrl,
    status: idea.status as IdeaStatus,
    createdAt: new Date(idea.createdAt),
    updatedAt: new Date(idea.updatedAt),
  }
}

/**
 * Update an idea's status
 */
export async function updateIdeaStatus(id: string, status: IdeaStatus): Promise<Idea> {
  const response = await fetch(`${API_BASE}/ideas/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    throw new Error('Failed to update idea status')
  }
  const idea = await response.json()

  // Transform to frontend format
  const result: Idea = {
    id: idea.id,
    title: getTitleWithFallback(idea),
    rawInput: idea.rawInput,
    audioUrl: idea.audioUrl,
    status: idea.status as IdeaStatus,
    createdAt: new Date(idea.createdAt),
    updatedAt: new Date(idea.updatedAt),
  }

  // Include analysis if present in response
  if (idea.analysis) {
    result.analysis = {
      version: idea.analysis.version,
      content: idea.analysis.content,
    } as Analysis
  }

  return result
}

/**
 * Mark an idea as viewed
 */
export async function markIdeaViewed(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/ideas/${id}/viewed`, {
    method: 'PATCH',
  })
  if (!response.ok) {
    throw new Error('Failed to mark idea as viewed')
  }
}

/**
 * Get chat messages for an idea
 */
export async function getChatMessages(ideaId: string): Promise<Message[]> {
  const response = await fetch(`${API_BASE}/ideas/${ideaId}/chat`)
  if (!response.ok) {
    throw new Error('Failed to fetch chat messages')
  }
  const data = await response.json()
  return data.messages || []
}

/**
 * Send a chat message
 */
export async function sendChatMessage(ideaId: string, message: string): Promise<{ response: string; messages: Message[] }> {
  const response = await fetch(`${API_BASE}/ideas/${ideaId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })
  if (!response.ok) {
    throw new Error('Failed to send chat message')
  }
  return await response.json()
}

/**
 * Trigger analysis regeneration from chat
 */
export async function regenerateAnalysisFromChat(ideaId: string): Promise<{ updated: boolean; analysis?: Analysis }> {
  const response = await fetch(`${API_BASE}/ideas/${ideaId}/analyze`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error('Failed to regenerate analysis')
  }
  return await response.json()
}
