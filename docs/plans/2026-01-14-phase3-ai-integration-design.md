# Phase 3: AI Integration Design

**Date:** January 14, 2026
**Status:** Approved

---

## Goal

Add real AI-powered analysis and chat functionality so ideas get meaningful feedback instead of placeholder text.

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| AI Provider | Claude Sonnet via OpenRouter |
| Analysis format | Freeform markdown (not rigid sections) |
| Processing mode | Background/async (user doesn't wait) |
| Chat update trigger | When user switches from Chat to Analysis tab |
| Analysis update method | Smart merge (rewrite incorporating chat insights) |
| AI personality | Knows user context by default |

---

## Analysis Generation

### Format

The AI writes **freeform markdown** - whatever structure best fits the idea. Not rigid sections like "Summary", "Challenges", "Next Steps" every time.

**Rich markdown includes:**
- Headers to organize thoughts
- Tables for comparisons (pros/cons, effort vs value)
- Bullet lists for action items or options
- Bold text for key insights
- Natural document flow

**Not included in Phase 3 (deferred):**
- Chart/visualization generation
- AI-generated images
- Interactive/collapsible elements

### Processing Flow

```
User captures idea
       │
       ▼
┌─────────────────┐
│ Save to DB      │
│ Status: processing
│ Return to user  │
└─────────────────┘
       │
       ▼ (background)
┌─────────────────┐
│ Call Claude via │
│ OpenRouter      │
│ Generate analysis
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Save analysis   │
│ Status: ready   │
│ analysisViewedAt: null
└─────────────────┘
```

### AI Context (System Prompt)

The AI always knows:
- **User:** Adam Amzalag, COO of Wicked Cushions
- **Constraints:** Very time-constrained, 3 kids under 3
- **Work:** E-commerce, headphone accessories, remote
- **Preference:** Practical over perfect, values efficiency

This shapes analysis - big time commitments aren't realistic unless explicitly stated.

---

## Chat Functionality

### Behavior

- Normal conversation with Claude about the idea
- AI has full context: original idea + current analysis + chat history
- User can ask questions, add context, challenge assumptions
- No per-message analysis updates (would be jarring)

### Analysis Update Trigger

When user **switches from Chat tab to Analysis tab**:

1. Check if there are new chat messages since last analysis
2. If yes → call Claude to generate updated analysis
3. Show brief "Updating analysis..." indicator
4. Display new analysis when ready

### Smart Merge

The analysis update is a **rewrite**, not append. Claude receives:
- Original idea/transcript
- Previous analysis
- Full chat conversation

And produces a **new refined analysis** that:
- Incorporates insights from chat
- Removes outdated/contradicted information
- Updates sections based on new context
- Maintains coherent document flow

Example: If user said "actually I don't have time for that approach" - the new analysis removes that approach and suggests alternatives.

---

## Visual Indicators

### Card States on Home Page

| Idea Status | Card Display |
|-------------|--------------|
| Processing | Subtle "Analyzing..." text or spinner |
| Ready, not viewed | Coral dot badge |
| Ready, viewed | Normal (no indicator) |
| Chat updated analysis | Coral dot reappears |

### Implementation

Add `analysisViewedAt` timestamp to ideas table:
- `null` = unviewed (show dot)
- timestamp = viewed (no dot)

**When analysis completes:** Set `analysisViewedAt = null`
**When user opens detail:** Set `analysisViewedAt = now()`
**When chat updates analysis:** Set `analysisViewedAt = null`

---

## API Design

### New/Modified Endpoints

#### POST /api/ideas (modified)
- Creates idea with status "processing"
- Triggers background analysis job
- Returns immediately (doesn't wait for analysis)

#### POST /api/ideas/:id/chat
- Accepts user message
- Returns AI response
- Stores message in conversation history
- Does NOT update analysis (that happens on tab switch)

#### POST /api/ideas/:id/analyze (new)
- Triggered when switching to Analysis tab with new chat
- Generates updated analysis via smart merge
- Updates analysis in database
- Resets `analysisViewedAt` to null

#### GET /api/ideas/:id (modified)
- Returns `analysisViewedAt` field
- Frontend uses this to show/hide dot

#### PATCH /api/ideas/:id/viewed (new)
- Sets `analysisViewedAt` to current timestamp
- Called when user opens idea detail

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Access Claude Sonnet via OpenRouter |

---

## Database Changes

### Ideas Table

Add column:
```sql
analysis_viewed_at TIMESTAMP -- null = unviewed, timestamp = viewed
```

### Conversations Table

Already exists in schema - stores messages as JSONB array.

---

## Files to Create/Modify

### New Files
- `src/server/services/ai.ts` - OpenRouter client, analysis generation
- `src/server/services/chat.ts` - Chat handling, message storage
- `src/server/routes/chat.ts` - Chat API endpoints
- `src/server/prompts/analysis.ts` - System prompts for analysis
- `src/server/prompts/chat.ts` - System prompts for chat

### Modified Files
- `src/server/routes/ideas.ts` - Add background analysis trigger, viewed endpoint
- `src/db/schema.ts` - Add `analysisViewedAt` column
- `src/lib/api.ts` - Add chat and analysis API functions
- `src/pages/IdeaDetailPage.tsx` - Connect chat to API, trigger analysis update on tab switch
- `src/pages/HomePage.tsx` - Show unread dot on cards
- `src/components/IdeaCard.tsx` - Add dot indicator

---

## Testing Plan

1. **Capture idea** → Status shows "Processing", returns to home
2. **Wait ~15-30 seconds** → Status changes to "Ready", dot appears
3. **Open idea** → See real analysis (not placeholder), dot disappears
4. **Send chat message** → Get real AI response with context
5. **Switch to Analysis tab** → See "Updating..." then refined analysis
6. **Return to home** → Dot reappears (analysis was updated)
7. **Open again** → Dot disappears, see updated analysis

---

## Success Criteria

- Ideas get real, personalized AI analysis within 30 seconds
- Chat responses are context-aware (know the idea and analysis)
- Analysis updates reflect chat conversation intelligently
- Visual indicators help user know what's new

---

*Ready for implementation plan.*
