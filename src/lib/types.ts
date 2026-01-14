export type IdeaStatus = 'processing' | 'ready' | 'pursuing' | 'deferred'

export interface Idea {
  id: string
  title: string
  rawInput: string
  audioUrl?: string
  status: IdeaStatus
  createdAt: Date
  updatedAt: Date
  analysisViewedAt?: Date | null  // null = unviewed
  analysis?: Analysis
}

export interface Analysis {
  version: number
  content: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export type TabType = 'active' | 'pursuing' | 'deferred'
