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
  summary: string
  problemItSolves: string
  howItWouldWork: string
  effortEstimate: string
  potentialValue: string
  challenges: string
  howToAccomplish: string
  nextSteps: string
  questionsForYou: string[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type TabType = 'active' | 'pursuing' | 'deferred'
