import type { Idea, IdeaStatus, Analysis } from './types'

const API_BASE = '/api'

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
    title: idea.rawInput.slice(0, 50) + (idea.rawInput.length > 50 ? '...' : ''),
    rawInput: idea.rawInput,
    audioUrl: idea.audioUrl,
    status: idea.status as IdeaStatus,
    createdAt: new Date(idea.createdAt),
    updatedAt: new Date(idea.updatedAt),
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
    title: idea.rawInput.slice(0, 50) + (idea.rawInput.length > 50 ? '...' : ''),
    rawInput: idea.rawInput,
    audioUrl: idea.audioUrl,
    status: idea.status as IdeaStatus,
    createdAt: new Date(idea.createdAt),
    updatedAt: new Date(idea.updatedAt),
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
  return {
    id: idea.id,
    title: idea.rawInput.slice(0, 50) + (idea.rawInput.length > 50 ? '...' : ''),
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
    title: idea.rawInput.slice(0, 50) + (idea.rawInput.length > 50 ? '...' : ''),
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
