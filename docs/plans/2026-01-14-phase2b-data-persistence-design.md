# Phase 2B: Data Persistence Design

**Date:** January 14, 2026
**Status:** Approved

---

## Goal

Connect the frontend to a real PostgreSQL database so ideas persist across page refreshes and sessions.

## Decisions Made

| Decision | Choice |
|----------|--------|
| User identity before auth | Single hardcoded "default" user |
| New idea status | Go straight to "ready" (skip "processing") |
| Initial data | Start empty (no seed data) |

---

## API Routes

Create `src/server/routes/ideas.ts`:

### GET /api/ideas
- Returns all ideas for default user
- Sorted by `createdAt` descending
- Includes: id, title, rawInput, status, timestamps

### POST /api/ideas
- Creates new idea from captured text/transcript
- Sets status to "ready"
- Creates placeholder analysis record
- Returns created idea

### PATCH /api/ideas/:id/status
- Updates idea status (ready → pursuing/deferred)
- Updates `statusChangedAt` timestamp
- Returns updated idea

---

## Frontend Changes

### New file: `src/lib/api.ts`
```typescript
getIdeas(): Promise<Idea[]>
createIdea(rawInput: string, isVoice: boolean): Promise<Idea>
updateIdeaStatus(id: string, status: IdeaStatus): Promise<Idea>
```

### Changes to `src/App.tsx`
- On mount: call `getIdeas()` instead of mock data
- `handleCapture()`: call `createIdea()`
- `handleStatusChange()`: call `updateIdeaStatus()`
- Add loading state for initial fetch
- Add error handling

### Remove
- `src/lib/mock-data.ts`
- Fake 3-second processing timeout

---

## Database Setup

### Default User
- Create `src/server/utils/ensureDefaultUser.ts`
- On server startup, ensure default user exists
- `replitId: 'default-user'`
- Store user ID for API routes

### Placeholder Analysis
When creating idea, also create analysis:
```markdown
# Analysis Coming Soon

AI-powered analysis will be available in a future update.
```

---

## Error Handling

- Database connection failure → user-friendly error
- API call failure → show alert/toast
- Keep app functional on individual failures

---

## Testing Plan

1. Capture voice idea → appears in list after refresh
2. Capture text idea → same check
3. Change status to "pursuing" → moves to correct tab
4. Change to "deferred" → appears in Deferred tab
5. Refresh page → all ideas persist

**Success criteria:** Ideas survive page refresh and app restart.

---

## Files to Create/Modify

**Create:**
- `src/server/routes/ideas.ts`
- `src/server/utils/ensureDefaultUser.ts`
- `src/lib/api.ts`

**Modify:**
- `src/server/index.ts` (add ideas router, startup logic)
- `src/App.tsx` (API calls instead of mock data)

**Delete:**
- `src/lib/mock-data.ts`
