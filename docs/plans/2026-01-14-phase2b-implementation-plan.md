# Phase 2B: Data Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect frontend to PostgreSQL database so ideas persist across sessions.

**Architecture:** Express API routes call Drizzle query functions. Frontend fetches from API instead of using mock data. Single default user until auth is added in Phase 4.

**Tech Stack:** Express.js, Drizzle ORM, PostgreSQL, React, TypeScript

---

## Task 1: Create Default User Utility

**Files:**
- Create: `src/server/utils/ensureDefaultUser.ts`

**Step 1: Create the utility file**

```typescript
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_REPLIT_ID = 'default-user'

let defaultUserId: string | null = null

export async function ensureDefaultUser(): Promise<string> {
  if (defaultUserId) {
    return defaultUserId
  }

  // Check if default user exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.replitId, DEFAULT_REPLIT_ID))
    .limit(1)

  if (existing.length > 0) {
    defaultUserId = existing[0].id
    return defaultUserId
  }

  // Create default user
  const [newUser] = await db
    .insert(users)
    .values({
      replitId: DEFAULT_REPLIT_ID,
      profile: { name: 'Default User' },
    })
    .returning()

  defaultUserId = newUser.id
  return defaultUserId
}

export function getDefaultUserId(): string {
  if (!defaultUserId) {
    throw new Error('Default user not initialized. Call ensureDefaultUser() first.')
  }
  return defaultUserId
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors related to this file

**Step 3: Commit**

```bash
git add src/server/utils/ensureDefaultUser.ts
git commit -m "feat: add default user utility for pre-auth data persistence"
```

---

## Task 2: Create Ideas API Router

**Files:**
- Create: `src/server/routes/ideas.ts`

**Step 1: Create the ideas router**

```typescript
import { Router } from 'express'
import { db } from '../../db'
import { ideas, analyses } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { getDefaultUserId } from '../utils/ensureDefaultUser'

const router = Router()

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
    res.status(500).json({ error: 'Failed to fetch ideas' })
  }
})

// POST /api/ideas - Create a new idea
router.post('/ideas', async (req, res) => {
  try {
    const userId = getDefaultUserId()
    const { rawInput, isVoice } = req.body

    if (!rawInput || typeof rawInput !== 'string') {
      return res.status(400).json({ error: 'rawInput is required' })
    }

    // Create the idea with status 'ready' (skipping 'processing' until Phase 3)
    const [newIdea] = await db
      .insert(ideas)
      .values({
        userId,
        rawInput: rawInput.trim(),
        audioUrl: isVoice ? 'voice-recording' : null,
        status: 'ready',
      })
      .returning()

    // Create placeholder analysis
    await db.insert(analyses).values({
      ideaId: newIdea.id,
      version: 1,
      content: {
        markdown: '# Analysis Coming Soon\n\nAI-powered analysis will be available in a future update.\n\nFor now, your idea has been saved and you can revisit it anytime.',
      },
    })

    res.status(201).json(newIdea)
  } catch (error) {
    console.error('Error creating idea:', error)
    res.status(500).json({ error: 'Failed to create idea' })
  }
})

// PATCH /api/ideas/:id/status - Update idea status
router.patch('/ideas/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['processing', 'ready', 'pursuing', 'deferred']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const [updated] = await db
      .update(ideas)
      .set({
        status,
        statusChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(ideas.id, id))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    res.json(updated)
  } catch (error) {
    console.error('Error updating idea status:', error)
    res.status(500).json({ error: 'Failed to update idea status' })
  }
})

// GET /api/ideas/:id - Get single idea with analysis
router.get('/ideas/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [idea] = await db
      .select()
      .from(ideas)
      .where(eq(ideas.id, id))
      .limit(1)

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Get latest analysis
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.ideaId, id))
      .orderBy(desc(analyses.version))
      .limit(1)

    res.json({
      ...idea,
      analysis: analysis ? {
        version: analysis.version,
        content: (analysis.content as { markdown: string }).markdown,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching idea:', error)
    res.status(500).json({ error: 'Failed to fetch idea' })
  }
})

export { router as ideasRouter }
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors related to this file

**Step 3: Commit**

```bash
git add src/server/routes/ideas.ts
git commit -m "feat: add ideas API router with CRUD endpoints"
```

---

## Task 3: Wire Up Server with Ideas Router

**Files:**
- Modify: `src/server/index.ts`

**Step 1: Update server to use ideas router and initialize default user**

Update the file to:

```typescript
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { transcribeRouter } from './routes/transcribe'
import { ideasRouter } from './routes/ideas'
import { ensureDefaultUser } from './utils/ensureDefaultUser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api', transcribeRouter)
app.use('/api', ideasRouter)

// Serve static files from the built frontend
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))

// SPA fallback - serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// Initialize default user and start server
async function start() {
  try {
    await ensureDefaultUser()
    console.log('Default user initialized')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()

export default app
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/server/index.ts
git commit -m "feat: wire up ideas router and default user initialization"
```

---

## Task 4: Create Frontend API Client

**Files:**
- Create: `src/lib/api.ts`

**Step 1: Create the API client**

```typescript
import type { Idea, IdeaStatus } from './types'

const API_BASE = '/api'

export async function getIdeas(): Promise<Idea[]> {
  const response = await fetch(`${API_BASE}/ideas`)

  if (!response.ok) {
    throw new Error('Failed to fetch ideas')
  }

  const data = await response.json()

  // Transform database format to frontend format
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

export async function getIdea(id: string): Promise<Idea> {
  const response = await fetch(`${API_BASE}/ideas/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch idea')
  }

  const idea = await response.json()

  return {
    id: idea.id,
    title: idea.rawInput.slice(0, 50) + (idea.rawInput.length > 50 ? '...' : ''),
    rawInput: idea.rawInput,
    audioUrl: idea.audioUrl,
    status: idea.status as IdeaStatus,
    createdAt: new Date(idea.createdAt),
    updatedAt: new Date(idea.updatedAt),
    analysis: idea.analysis ? {
      version: idea.analysis.version,
      content: idea.analysis.content,
    } : undefined,
  }
}

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
```

**Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add frontend API client for ideas CRUD"
```

---

## Task 5: Update App.tsx to Use Real API

**Files:**
- Modify: `src/App.tsx`

**Step 1: Read current App.tsx**

Read the file to understand current structure before modifying.

**Step 2: Update App.tsx**

Replace mock data usage with API calls:

1. Add imports at top:
```typescript
import { getIdeas, getIdea, createIdea, updateIdeaStatus } from './lib/api'
```

2. Remove import of mockIdeas:
```typescript
// DELETE: import { mockIdeas } from './lib/mock-data'
```

3. Add loading and error state:
```typescript
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

4. Change initial ideas state to empty array:
```typescript
const [ideas, setIdeas] = useState<Idea[]>([])
```

5. Add useEffect to fetch ideas on mount:
```typescript
useEffect(() => {
  async function loadIdeas() {
    try {
      setLoading(true)
      const fetchedIdeas = await getIdeas()
      setIdeas(fetchedIdeas)
      setError(null)
    } catch (err) {
      setError('Failed to load ideas. Please refresh the page.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  loadIdeas()
}, [])
```

6. Update handleCapture to use API:
```typescript
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
```

7. Update handleStatusChange to use API:
```typescript
const handleStatusChange = async (id: string, newStatus: IdeaStatus) => {
  try {
    const updated = await updateIdeaStatus(id, newStatus)
    setIdeas(prev => prev.map(idea =>
      idea.id === id ? updated : idea
    ))
    if (selectedIdea?.id === id) {
      setSelectedIdea(updated)
    }
  } catch (err) {
    alert('Failed to update idea. Please try again.')
    console.error(err)
  }
}
```

8. Update handleSelectIdea to fetch full idea with analysis:
```typescript
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
```

9. Add loading state in render:
```typescript
if (loading) {
  return (
    <div className="app loading">
      <p>Loading ideas...</p>
    </div>
  )
}
```

**Step 3: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: connect App.tsx to real API instead of mock data"
```

---

## Task 6: Delete Mock Data File

**Files:**
- Delete: `src/lib/mock-data.ts`

**Step 1: Remove mock data file**

```bash
rm src/lib/mock-data.ts
```

**Step 2: Verify no remaining imports**

Run: `npm run typecheck`
Expected: No errors (if there are errors about mock-data, find and remove those imports)

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove mock data file"
```

---

## Task 7: Test End-to-End

**Step 1: Ensure DATABASE_URL is set in Replit**

The PostgreSQL database should already be provisioned. Verify `DATABASE_URL` exists in Replit Secrets.

**Step 2: Build and run**

```bash
npm start
```

**Step 3: Manual testing checklist**

1. [ ] App loads without errors
2. [ ] Ideas list is empty (fresh database)
3. [ ] Capture a voice idea → appears in Active tab
4. [ ] Capture a text idea → appears in Active tab
5. [ ] Refresh page → both ideas still there
6. [ ] Click idea → detail page shows placeholder analysis
7. [ ] Change status to "Pursuing" → moves to Pursuing tab
8. [ ] Change status to "Deferred" → moves to Deferred tab
9. [ ] Refresh page → status changes persist

**Step 4: Push to GitHub**

```bash
git push origin main
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Create default user utility |
| 2 | Create ideas API router |
| 3 | Wire up server with router |
| 4 | Create frontend API client |
| 5 | Update App.tsx to use API |
| 6 | Delete mock data |
| 7 | Test end-to-end |
