export type IdeaStatus = 'processing' | 'ready' | 'pursuing' | 'deferred'

export interface Idea {
  id: string
  title: string
  rawInput: string
  audioUrl?: string
  status: IdeaStatus
  createdAt: Date
  updatedAt: Date
  analysis?: Analysis
}

export interface Analysis {
  version: number
  content: string  // Full markdown document - AI controls structure
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type TabType = 'active' | 'pursuing' | 'deferred'
