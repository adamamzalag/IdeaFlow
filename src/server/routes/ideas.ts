import { Router } from 'express'
import { db } from '../../db'
import { ideas, analyses } from '../../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getDefaultUserId } from '../utils/ensureDefaultUser'

const router = Router()

// UUID validation helper
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Valid status values
const validStatuses = ['processing', 'ready', 'pursuing', 'deferred'] as const
type IdeaStatus = typeof validStatuses[number]

// GET /api/ideas - List all ideas for default user
router.get('/ideas', async (_req, res) => {
  try {
    const userId = getDefaultUserId()

    const userIdeas = await db
      .select()
      .from(ideas)
      .where(eq(ideas.userId, userId))
      .orderBy(desc(ideas.createdAt))

    res.json(userIdeas)
  } catch (error) {
    console.error('Error fetching ideas:', error)
    res.status(500).json({
      error: 'Failed to fetch ideas',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /api/ideas - Create new idea
router.post('/ideas', async (req, res) => {
  try {
    const { rawInput } = req.body

    // Validate rawInput
    if (!rawInput || typeof rawInput !== 'string') {
      return res.status(400).json({ error: 'rawInput is required and must be a string' })
    }

    const userId = getDefaultUserId()

    // Create the idea with status 'ready' (skip processing until Phase 3)
    const [newIdea] = await db
      .insert(ideas)
      .values({
        userId,
        rawInput: rawInput.trim(),
        status: 'ready',
      })
      .returning()

    // Create placeholder analysis
    const placeholderContent = {
      markdown: `# Analysis Coming Soon

AI-powered analysis will be available in a future update.`
    }

    await db
      .insert(analyses)
      .values({
        ideaId: newIdea.id,
        version: 1,
        content: placeholderContent,
      })

    res.status(201).json(newIdea)
  } catch (error) {
    console.error('Error creating idea:', error)
    res.status(500).json({
      error: 'Failed to create idea',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// PATCH /api/ideas/:id/status - Update idea status
router.patch('/ideas/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid idea ID format' })
    }

    // Validate status
    if (!status || !validStatuses.includes(status as IdeaStatus)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      })
    }

    const userId = getDefaultUserId()
    const now = new Date()

    // Update the idea
    const [updatedIdea] = await db
      .update(ideas)
      .set({
        status: status as IdeaStatus,
        statusChangedAt: now,
        updatedAt: now,
      })
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .returning()

    if (!updatedIdea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    res.json(updatedIdea)
  } catch (error) {
    console.error('Error updating idea status:', error)
    res.status(500).json({
      error: 'Failed to update idea status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /api/ideas/:id - Get single idea with analysis
router.get('/ideas/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid idea ID format' })
    }

    const userId = getDefaultUserId()

    // Get the idea
    const [idea] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .limit(1)

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Get the latest analysis (by version desc)
    const [latestAnalysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.ideaId, id))
      .orderBy(desc(analyses.version))
      .limit(1)

    // Format response with analysis content
    // Extract markdown string from content JSONB object
    const analysisContent = latestAnalysis?.content as { markdown: string } | null
    const response = {
      ...idea,
      analysis: latestAnalysis ? {
        id: latestAnalysis.id,
        version: latestAnalysis.version,
        content: analysisContent?.markdown ?? '',
        createdAt: latestAnalysis.createdAt,
      } : null
    }

    res.json(response)
  } catch (error) {
    console.error('Error fetching idea:', error)
    res.status(500).json({
      error: 'Failed to fetch idea',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { router as ideasRouter }
