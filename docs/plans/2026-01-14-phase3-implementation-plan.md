# Phase 3: AI Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real AI-powered analysis and chat functionality using Claude Sonnet via OpenRouter.

**Architecture:** Backend generates analysis via OpenRouter API when ideas are created. Chat messages are stored in conversations table. When user switches from Chat to Analysis tab, a smart merge regenerates the analysis incorporating chat insights. Unread indicator (coral dot) shows on cards when analysis is ready but not viewed.

**Tech Stack:** OpenRouter API (Claude Sonnet), Express.js, Drizzle ORM, PostgreSQL, React

---

## Task 1: Add OpenRouter Dependency

**Files:**
- Modify: `package.json`

**Step 1: Install openai package** (OpenRouter uses OpenAI-compatible API)

The `openai` package is already installed (used for Whisper). We just need to configure it for OpenRouter.

**Step 2: Verify**

Run: `npm ls openai`
Expected: Shows openai package installed

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: verify openai package for OpenRouter compatibility"
```

---

## Task 2: Add analysisViewedAt Column to Schema

**Files:**
- Modify: `src/db/schema.ts`

**Step 1: Add column to ideas table**

In `src/db/schema.ts`, add to the `ideas` table definition:

```typescript
export const ideas = pgTable('ideas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  rawInput: text('raw_input').notNull(),
  audioUrl: text('audio_url'),
  status: ideaStatusEnum('status').default('processing').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  statusChangedAt: timestamp('status_changed_at').defaultNow().notNull(),
  analysisViewedAt: timestamp('analysis_viewed_at'), // null = unviewed
});
```

**Step 2: Run migration**

Run: `npm run db:migrate`
Expected: Schema pushed to database successfully

**Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add analysisViewedAt column for unread tracking"
```

---

## Task 3: Create AI Service for OpenRouter

**Files:**
- Create: `src/server/services/ai.ts`

**Step 1: Create the AI service file**

```typescript
import OpenAI from 'openai'

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

const MODEL = 'anthropic/claude-sonnet-4'

// User context that shapes all analysis
const USER_CONTEXT = `
You are analyzing ideas for Adam Amzalag.

About Adam:
- COO of Wicked Cushions (e-commerce company selling headphone accessories)
- Very time-constrained - has 3 kids under age 3
- Highly technical but not an engineer/programmer
- Works remotely with flexible hours
- Values practical solutions over perfect ones
- Prefers efficiency and things that work without constant tinkering

When analyzing ideas, consider these constraints by default. Big time commitments (20+ hours/week) are not realistic unless explicitly stated otherwise. Favor solutions that are simple, maintainable, and can be delegated or automated.
`.trim()

export interface AnalysisResult {
  content: string
}

export async function generateAnalysis(rawInput: string): Promise<AnalysisResult> {
  const response = await openrouter.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `${USER_CONTEXT}

You are an idea analyst. When given a raw idea, provide a thoughtful analysis in markdown format.

Write in a natural, freeform style - not rigid sections. Use whatever structure best fits the idea:
- Headers to organize your thoughts
- Tables for comparisons (pros/cons, options, effort vs value)
- Bullet lists for action items or considerations
- Bold text for key insights

Be direct and practical. Focus on what would actually help Adam decide whether to pursue this idea and how to approach it if he does.`
      },
      {
        role: 'user',
        content: `Analyze this idea:\n\n${rawInput}`
      }
    ],
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content || 'Analysis could not be generated.'
  return { content }
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function generateChatResponse(
  rawInput: string,
  currentAnalysis: string,
  chatHistory: ChatMessage[],
  userMessage: string
): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${USER_CONTEXT}

You are discussing an idea with Adam. You have full context:

ORIGINAL IDEA:
${rawInput}

CURRENT ANALYSIS:
${currentAnalysis}

Help Adam think through this idea. Answer questions, provide additional insights, challenge assumptions if needed. Be conversational and helpful.`
    },
    // Include chat history
    ...chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    // Add the new user message
    {
      role: 'user' as const,
      content: userMessage
    }
  ]

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: 1000,
  })

  return response.choices[0]?.message?.content || 'I could not generate a response.'
}

export async function regenerateAnalysis(
  rawInput: string,
  previousAnalysis: string,
  chatHistory: ChatMessage[]
): Promise<AnalysisResult> {
  // Format chat history for context
  const chatContext = chatHistory
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n')

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `${USER_CONTEXT}

You previously analyzed an idea and then had a conversation with Adam about it. Now you need to create an UPDATED analysis that incorporates everything from the conversation.

This is a SMART MERGE - not just appending. You should:
- Incorporate new insights from the conversation
- Remove or update information that was contradicted or refined in chat
- Keep the analysis coherent and well-structured
- Use freeform markdown (headers, tables, lists, bold) as appropriate

ORIGINAL IDEA:
${rawInput}

PREVIOUS ANALYSIS:
${previousAnalysis}

CONVERSATION:
${chatContext}

Now write the updated analysis:`
      }
    ],
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content || previousAnalysis
  return { content }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/server/services/ai.ts
git commit -m "feat: add AI service for OpenRouter integration"
```

---

## Task 4: Modify Ideas Route for Background Analysis

**Files:**
- Modify: `src/server/routes/ideas.ts`

**Step 1: Import AI service and update POST /ideas**

At the top of the file, add import:
```typescript
import { generateAnalysis } from '../services/ai'
```

**Step 2: Update the POST /ideas handler**

Replace the current POST handler with one that:
1. Creates idea with status 'processing'
2. Returns immediately to user
3. Triggers background analysis

```typescript
// POST /api/ideas - Create new idea
router.post('/ideas', async (req, res) => {
  try {
    const { rawInput } = req.body

    if (!rawInput || typeof rawInput !== 'string') {
      return res.status(400).json({ error: 'rawInput is required and must be a string' })
    }

    const userId = getDefaultUserId()

    // Create the idea with status 'processing'
    const [newIdea] = await db
      .insert(ideas)
      .values({
        userId,
        rawInput: rawInput.trim(),
        status: 'processing',
      })
      .returning()

    // Return immediately - don't wait for analysis
    res.status(201).json(newIdea)

    // Generate analysis in background (after response sent)
    generateAnalysis(rawInput.trim())
      .then(async (result) => {
        // Save analysis
        await db.insert(analyses).values({
          ideaId: newIdea.id,
          version: 1,
          content: { markdown: result.content },
        })

        // Update idea status to ready
        await db
          .update(ideas)
          .set({
            status: 'ready',
            analysisViewedAt: null, // Mark as unviewed
            updatedAt: new Date(),
          })
          .where(eq(ideas.id, newIdea.id))

        console.log(`Analysis complete for idea ${newIdea.id}`)
      })
      .catch((error) => {
        console.error(`Failed to generate analysis for idea ${newIdea.id}:`, error)
        // Create fallback placeholder analysis
        db.insert(analyses).values({
          ideaId: newIdea.id,
          version: 1,
          content: { markdown: '# Analysis Failed\n\nWe could not generate an analysis for this idea. Please try again or check the chat for assistance.' },
        }).then(() => {
          db.update(ideas)
            .set({ status: 'ready', updatedAt: new Date() })
            .where(eq(ideas.id, newIdea.id))
        })
      })
  } catch (error) {
    console.error('Error creating idea:', error)
    res.status(500).json({
      error: 'Failed to create idea',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
```

**Step 3: Update GET /ideas to include analysisViewedAt**

Modify the GET /ideas response to include `analysisViewedAt` so frontend can show dots.

**Step 4: Add PATCH /ideas/:id/viewed endpoint**

```typescript
// PATCH /api/ideas/:id/viewed - Mark idea as viewed
router.patch('/ideas/:id/viewed', async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid idea ID format' })
    }

    const userId = getDefaultUserId()

    const [updatedIdea] = await db
      .update(ideas)
      .set({
        analysisViewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .returning()

    if (!updatedIdea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    res.json(updatedIdea)
  } catch (error) {
    console.error('Error marking idea as viewed:', error)
    res.status(500).json({
      error: 'Failed to mark idea as viewed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
```

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/server/routes/ideas.ts
git commit -m "feat: add background analysis generation and viewed tracking"
```

---

## Task 5: Create Chat Routes

**Files:**
- Create: `src/server/routes/chat.ts`
- Modify: `src/server/index.ts`

**Step 1: Create chat router**

Create `src/server/routes/chat.ts`:

```typescript
import { Router } from 'express'
import { db } from '../../db'
import { ideas, analyses, conversations } from '../../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getDefaultUserId } from '../utils/ensureDefaultUser'
import { generateChatResponse, regenerateAnalysis, ChatMessage } from '../services/ai'

const router = Router()

// UUID validation helper
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// GET /api/ideas/:id/chat - Get conversation history
router.get('/ideas/:id/chat', async (req, res) => {
  try {
    const { id } = req.params

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

    // Get conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.ideaId, id))
      .limit(1)

    const messages = conversation?.messages || []

    res.json({ messages })
  } catch (error) {
    console.error('Error fetching chat:', error)
    res.status(500).json({
      error: 'Failed to fetch chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /api/ideas/:id/chat - Send a chat message
router.post('/ideas/:id/chat', async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid idea ID format' })
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' })
    }

    const userId = getDefaultUserId()

    // Get idea
    const [idea] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .limit(1)

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Get current analysis
    const [latestAnalysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.ideaId, id))
      .orderBy(desc(analyses.version))
      .limit(1)

    const analysisContent = (latestAnalysis?.content as { markdown: string })?.markdown || ''

    // Get existing conversation or create new
    let [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.ideaId, id))
      .limit(1)

    const existingMessages = (conversation?.messages || []) as ChatMessage[]

    // Generate AI response
    const aiResponse = await generateChatResponse(
      idea.rawInput,
      analysisContent,
      existingMessages,
      message.trim()
    )

    // Create new messages array
    const newMessages: ChatMessage[] = [
      ...existingMessages,
      { role: 'user', content: message.trim() },
      { role: 'assistant', content: aiResponse }
    ]

    // Upsert conversation
    if (conversation) {
      await db
        .update(conversations)
        .set({
          messages: newMessages,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversation.id))
    } else {
      await db.insert(conversations).values({
        ideaId: id,
        messages: newMessages,
      })
    }

    res.json({
      response: aiResponse,
      messages: newMessages
    })
  } catch (error) {
    console.error('Error in chat:', error)
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /api/ideas/:id/analyze - Regenerate analysis from chat
router.post('/ideas/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid idea ID format' })
    }

    const userId = getDefaultUserId()

    // Get idea
    const [idea] = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, userId)))
      .limit(1)

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Get current analysis
    const [latestAnalysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.ideaId, id))
      .orderBy(desc(analyses.version))
      .limit(1)

    const analysisContent = (latestAnalysis?.content as { markdown: string })?.markdown || ''
    const currentVersion = latestAnalysis?.version || 0

    // Get conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.ideaId, id))
      .limit(1)

    const chatMessages = (conversation?.messages || []) as ChatMessage[]

    // If no chat messages, nothing to merge
    if (chatMessages.length === 0) {
      return res.json({ updated: false, message: 'No chat messages to incorporate' })
    }

    // Regenerate analysis
    const result = await regenerateAnalysis(
      idea.rawInput,
      analysisContent,
      chatMessages
    )

    // Save new analysis version
    await db.insert(analyses).values({
      ideaId: id,
      version: currentVersion + 1,
      content: { markdown: result.content },
    })

    // Mark as unviewed (new analysis available)
    await db
      .update(ideas)
      .set({
        analysisViewedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(ideas.id, id))

    res.json({
      updated: true,
      analysis: {
        version: currentVersion + 1,
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
```

**Step 2: Wire up chat router in server index**

In `src/server/index.ts`, add:

```typescript
import { chatRouter } from './routes/chat'

// ... existing code ...

// API Routes
app.use('/api', transcribeRouter)
app.use('/api', ideasRouter)
app.use('/api', chatRouter)  // Add this line
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/server/routes/chat.ts src/server/index.ts
git commit -m "feat: add chat API routes with AI integration"
```

---

## Task 6: Update Frontend Types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add analysisViewedAt and update Message type**

```typescript
export type IdeaStatus = 'processing' | 'ready' | 'pursuing' | 'deferred'

export interface Idea {
  id: string
  title: string
  rawInput: string
  audioUrl?: string
  status: IdeaStatus
  createdAt: Date
  updatedAt: Date
  analysisViewedAt?: Date | null  // Add this
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
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add analysisViewedAt to Idea type"
```

---

## Task 7: Update Frontend API Client

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add chat and analysis API functions**

Add these functions to `src/lib/api.ts`:

```typescript
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
  return response.json()
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
  return response.json()
}
```

**Step 2: Update getIdeas to include analysisViewedAt**

In the `getIdeas` function, add `analysisViewedAt` to the mapping:

```typescript
return data.map((idea: any) => ({
  id: idea.id,
  title: idea.rawInput.slice(0, 50) + (idea.rawInput.length > 50 ? '...' : ''),
  rawInput: idea.rawInput,
  audioUrl: idea.audioUrl,
  status: idea.status as IdeaStatus,
  createdAt: new Date(idea.createdAt),
  updatedAt: new Date(idea.updatedAt),
  analysisViewedAt: idea.analysisViewedAt ? new Date(idea.analysisViewedAt) : null,
}))
```

**Step 3: Add Message import**

At the top of the file, update the import:
```typescript
import type { Idea, IdeaStatus, Analysis, Message } from './types'
```

**Step 4: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add chat and analysis API functions"
```

---

## Task 8: Update Ideas Route to Return analysisViewedAt

**Files:**
- Modify: `src/server/routes/ideas.ts`

**Step 1: Ensure GET /ideas returns analysisViewedAt**

The current implementation already returns all columns. Just verify that `analysisViewedAt` is included in the response.

**Step 2: Commit if changes needed**

```bash
git add src/server/routes/ideas.ts
git commit -m "fix: ensure analysisViewedAt returned in ideas API"
```

---

## Task 9: Update IdeaDetailPage for Real Chat

**Files:**
- Modify: `src/pages/IdeaDetailPage.tsx`

**Step 1: Import API functions**

```typescript
import { getChatMessages, sendChatMessage, regenerateAnalysisFromChat, markIdeaViewed, getIdea } from '../lib/api'
```

**Step 2: Load chat messages on mount**

Add useEffect to load existing chat when component mounts:

```typescript
useEffect(() => {
  // Mark as viewed when opening
  markIdeaViewed(idea.id).catch(console.error)

  // Load existing chat messages
  getChatMessages(idea.id)
    .then(setMessages)
    .catch(console.error)
}, [idea.id])
```

**Step 3: Update handleSend to use real API**

Replace the simulated response with real API call:

```typescript
const [isLoading, setIsLoading] = useState(false)

const handleSend = async () => {
  if (!inputValue.trim() || isLoading) return

  const userMessage = inputValue.trim()
  setInputValue('')
  setIsLoading(true)

  // Optimistically add user message
  const tempUserMsg: Message = {
    id: String(Date.now()),
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  }
  setMessages(prev => [...prev, tempUserMsg])

  try {
    const result = await sendChatMessage(idea.id, userMessage)

    // Replace with actual messages from server
    setMessages(result.messages.map((m, i) => ({
      id: String(i),
      role: m.role,
      content: m.content,
      timestamp: new Date()
    })))

    setHasNewChatSinceAnalysis(true)
  } catch (error) {
    console.error('Failed to send message:', error)
    // Remove optimistic message on error
    setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
  } finally {
    setIsLoading(false)
  }
}
```

**Step 4: Add analysis update on tab switch**

Track if chat has new messages since last analysis view:

```typescript
const [hasNewChatSinceAnalysis, setHasNewChatSinceAnalysis] = useState(false)
const [isUpdatingAnalysis, setIsUpdatingAnalysis] = useState(false)
const [currentAnalysis, setCurrentAnalysis] = useState(idea.analysis)

const handleTabChange = async (tab: DetailTab) => {
  setActiveTab(tab)

  if (tab === 'analysis') {
    setHasNewAnalysis(false)

    // If there are new chat messages, regenerate analysis
    if (hasNewChatSinceAnalysis && messages.length > 0) {
      setIsUpdatingAnalysis(true)
      try {
        const result = await regenerateAnalysisFromChat(idea.id)
        if (result.updated && result.analysis) {
          setCurrentAnalysis({
            version: result.analysis.version,
            content: result.analysis.content
          })
        }
        setHasNewChatSinceAnalysis(false)
      } catch (error) {
        console.error('Failed to update analysis:', error)
      } finally {
        setIsUpdatingAnalysis(false)
      }
    }
  }
}
```

**Step 5: Update AnalysisView to use currentAnalysis and show loading**

```typescript
<AnalysisView
  idea={{ ...idea, analysis: currentAnalysis }}
  showTranscript={showTranscript}
  onToggleTranscript={() => setShowTranscript(!showTranscript)}
  isUpdating={isUpdatingAnalysis}
/>
```

And update the AnalysisView component to show loading state:

```typescript
interface AnalysisViewProps {
  idea: Idea
  showTranscript: boolean
  onToggleTranscript: () => void
  isUpdating?: boolean
}

function AnalysisView({ idea, showTranscript, onToggleTranscript, isUpdating }: AnalysisViewProps) {
  return (
    <>
      {/* Original Transcript section stays the same */}

      {/* Analysis */}
      {isUpdating ? (
        <div className="analysis-loading">
          <p>Updating analysis...</p>
        </div>
      ) : idea.analysis ? (
        <div className="analysis-document markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {idea.analysis.content}
          </ReactMarkdown>
        </div>
      ) : null}
    </>
  )
}
```

**Step 6: Add loading state to chat input**

Disable input while loading:

```typescript
<textarea
  className="chat-input"
  placeholder={isLoading ? "Thinking..." : "Ask a question..."}
  value={inputValue}
  onChange={(e) => onInputChange(e.target.value)}
  onKeyDown={onKeyDown}
  rows={1}
  disabled={isLoading}
/>
<button
  className="chat-send"
  onClick={onSend}
  disabled={!inputValue.trim() || isLoading}
>
  <Send size={16} />
</button>
```

**Step 7: Commit**

```bash
git add src/pages/IdeaDetailPage.tsx
git commit -m "feat: connect chat to real AI API with analysis updates"
```

---

## Task 10: Add Unread Indicator to Idea Cards

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Step 1: Add unread dot to idea cards**

In the idea card rendering, add a dot indicator when `analysisViewedAt` is null and status is 'ready':

```typescript
{/* In the idea card */}
<div className="idea-card-content">
  <div className="idea-card-header">
    <h3 className="idea-card-title">{idea.title}</h3>
    {idea.status === 'ready' && !idea.analysisViewedAt && (
      <span className="idea-card-unread-dot" />
    )}
  </div>
  {/* ... rest of card */}
</div>
```

**Step 2: Add CSS for unread dot**

In `src/styles/app.css`, add:

```css
.idea-card-unread-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: 50%;
  flex-shrink: 0;
}

.idea-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

**Step 3: Add processing indicator**

For ideas with status 'processing', show a subtle indicator:

```typescript
{idea.status === 'processing' && (
  <span className="idea-card-processing">Analyzing...</span>
)}
```

```css
.idea-card-processing {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
}
```

**Step 4: Commit**

```bash
git add src/pages/HomePage.tsx src/styles/app.css
git commit -m "feat: add unread indicator and processing status to idea cards"
```

---

## Task 11: Update App.tsx to Refresh Ideas After Viewing

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add callback to refresh ideas when returning from detail**

When the user returns from the detail page, refresh the ideas list to update the viewed status:

```typescript
const handleBack = async () => {
  setSelectedIdea(null)
  // Refresh ideas to get updated analysisViewedAt
  try {
    const updatedIdeas = await getIdeas()
    setIdeas(updatedIdeas)
  } catch (error) {
    console.error('Failed to refresh ideas:', error)
  }
}
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: refresh ideas list when returning from detail view"
```

---

## Task 12: Test End-to-End

**Testing Checklist:**

1. **Capture idea** → Status shows "Processing" on card
2. **Wait ~15-30 seconds** → Status changes to "Ready", coral dot appears
3. **Open idea** → See real AI analysis (not placeholder), dot disappears on home
4. **Send chat message** → See "Thinking..." then get real AI response
5. **Switch to Analysis tab** → See "Updating analysis..." then refined analysis
6. **Return to home** → Coral dot reappears (analysis was updated)
7. **Open again** → Dot disappears, see updated analysis

**Step 1: Start the app**

Run: `npm start`

**Step 2: Test each scenario**

Document any issues found.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Phase 3 AI Integration complete"
git push
```

---

## Summary

**New Files Created:**
- `src/server/services/ai.ts` - OpenRouter integration
- `src/server/routes/chat.ts` - Chat API endpoints

**Files Modified:**
- `src/db/schema.ts` - Added `analysisViewedAt` column
- `src/server/routes/ideas.ts` - Background analysis, viewed endpoint
- `src/server/index.ts` - Chat router registration
- `src/lib/types.ts` - Updated types
- `src/lib/api.ts` - Chat and analysis API functions
- `src/pages/IdeaDetailPage.tsx` - Real chat integration
- `src/pages/HomePage.tsx` - Unread indicators
- `src/styles/app.css` - Indicator styles
- `src/App.tsx` - Refresh on back

**Environment Variables Required:**
- `OPENROUTER_API_KEY` - Must be set in Replit Secrets

---

*Plan ready for subagent-driven execution.*
