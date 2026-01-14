import { Router } from 'express'
import { db } from '../../db'
import { ideas, analyses, conversations } from '../../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getDefaultUserId } from '../utils/ensureDefaultUser'
import { generateChatResponse, regenerateAnalysis, ChatMessage } from '../services/ai'

const router = Router()

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// GET /api/ideas/:id/chat - Get conversation history
router.get('/ideas/:id/chat', async (req, res) => {
  try {
    const { id } = req.params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid idea ID format' })
    }

    const userId = getDefaultUserId()

    // Verify idea belongs to user
    const [idea] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .limit(1)

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Get conversation for this idea
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.ideaId, id))
      .limit(1)

    // Return messages or empty array
    const messages = (conversation?.messages as ChatMessage[]) || []
    res.json({ messages })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    res.status(500).json({
      error: 'Failed to fetch chat history',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /api/ideas/:id/chat - Send chat message
router.post('/ideas/:id/chat', async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid idea ID format' })
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string' })
    }

    const userId = getDefaultUserId()

    // Get idea and verify ownership
    const [idea] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .limit(1)

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Get latest analysis
    const [latestAnalysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.ideaId, id))
      .orderBy(desc(analyses.version))
      .limit(1)

    const analysisContent = latestAnalysis?.content as { markdown: string } | null
    const currentAnalysis = analysisContent?.markdown || ''

    // Get existing conversation
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.ideaId, id))
      .limit(1)

    const chatHistory = (existingConversation?.messages as ChatMessage[]) || []

    // Generate AI response
    const response = await generateChatResponse(
      idea.rawInput,
      currentAnalysis,
      chatHistory,
      message.trim()
    )

    // Update messages with new user message and assistant response
    const updatedMessages: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: message.trim() },
      { role: 'assistant', content: response }
    ]

    // Save updated conversation
    if (existingConversation) {
      await db
        .update(conversations)
        .set({
          messages: updatedMessages,
          updatedAt: new Date()
        })
        .where(eq(conversations.id, existingConversation.id))
    } else {
      await db
        .insert(conversations)
        .values({
          ideaId: id,
          messages: updatedMessages
        })
    }

    res.json({ response, messages: updatedMessages })
  } catch (error) {
    console.error('Error sending chat message:', error)
    res.status(500).json({
      error: 'Failed to send chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /api/ideas/:id/analyze - Regenerate analysis from chat
router.post('/ideas/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid idea ID format' })
    }

    const userId = getDefaultUserId()

    // Get idea and verify ownership
    const [idea] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .limit(1)

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Get latest analysis
    const [latestAnalysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.ideaId, id))
      .orderBy(desc(analyses.version))
      .limit(1)

    const analysisContent = latestAnalysis?.content as { markdown: string } | null
    const currentAnalysis = analysisContent?.markdown || ''
    const currentVersion = latestAnalysis?.version || 0

    // Get conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.ideaId, id))
      .limit(1)

    const chatHistory = (conversation?.messages as ChatMessage[]) || []

    // If no chat messages, nothing to update from
    if (chatHistory.length === 0) {
      return res.json({ updated: false })
    }

    // Regenerate analysis incorporating chat insights
    const result = await regenerateAnalysis(
      idea.rawInput,
      currentAnalysis,
      chatHistory
    )

    // Save new analysis version
    const newVersion = currentVersion + 1
    await db.insert(analyses).values({
      ideaId: id,
      version: newVersion,
      content: { markdown: result.content }
    })

    // Mark analysis as unviewed (set analysisViewedAt to null)
    await db
      .update(ideas)
      .set({
        analysisViewedAt: null,
        updatedAt: new Date()
      })
      .where(eq(ideas.id, id))

    res.json({
      updated: true,
      analysis: {
        version: newVersion,
        content: result.content
      }
    })
  } catch (error) {
    console.error('Error regenerating analysis:', error)
    res.status(500).json({
      error: 'Failed to regenerate analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { router as chatRouter }
