# IdeaFlow Session Handoff

**Last Updated:** January 13, 2026

---

## Current State: Phase 2A Complete - Voice Capture Working

The app has a working Express backend with Whisper-powered voice transcription. Frontend and backend are deployed to Replit as a single server.

### What's Working
- Home page with Active/Pursuing/Deferred tabs
- **Voice capture with Whisper transcription** - Records audio, sends to server, returns accurate transcript
- Text capture
- Idea detail page with markdown analysis rendering
- Chat UI (mock responses only)
- Pursue/Defer actions (UI only)
- Dark theme, animations, mobile-first design
- **Express backend** serving both API and frontend
- **Deployed to Replit** - single `npm start` command runs everything

### What's NOT Working Yet
- **No data persistence** - refresh loses everything (Phase 2B)
- **No real AI analysis** - analysis is mock data, chat doesn't connect to Claude (Phase 3)
- **No auth** - single user assumed (Phase 4)

---

## What We Built Today (Phase 2A)

### Express Backend
- `src/server/index.ts` - Main server, serves static files + API
- `src/server/routes/transcribe.ts` - POST `/api/transcribe` endpoint
- Uses Whisper API (OpenAI) for transcription
- Single server architecture - Express serves built React app

### Updated Frontend
- `src/components/CaptureModal.tsx` - Now uses MediaRecorder API
- Records audio as webm/mp4, sends to server
- Shows "Transcribing..." spinner while waiting
- Removed all Web Speech API code and debug panel

### Configuration
- `package.json` - Added `npm start` script (build + server)
- `vite.config.ts` - Proxy for local development
- Replit configured to run `npm start`

---

## Lessons Learned: Web Speech API

We tried browser-based speech recognition first and discovered critical issues:

### The Problem
Voice recording on Android Chrome duplicated words. "test" became "test test test".

### Root Cause
Android's Web Speech API returns **cumulative** results:
- Result[2] = "test"
- Result[3] = "test test" (includes previous)
- Concatenating all results caused duplication

Also: Android fires `onend` aggressively without waiting for silence.

### The Solution
Server-side transcription with Whisper API:
- MediaRecorder API records audio (works consistently everywhere)
- Send audio blob to Express server
- Server calls Whisper API
- Return transcript text
- Cost: ~$0.006/minute (negligible)

---

## Next Steps: Phase 2B (Data Persistence)

### Tasks
1. **Verify PostgreSQL database** in Replit
2. **Wire up Drizzle schema** (already exists in `src/db/`)
3. **Add API routes:**
   - GET /api/ideas - List user's ideas
   - POST /api/ideas - Create new idea
   - PATCH /api/ideas/:id - Update idea status
4. **Connect frontend** - Replace mock data with API calls

### After Phase 2B
- Phase 3: AI Integration (Claude API for analysis + chat)
- Phase 4: Auth + PWA + Polish

---

## Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | React + Vite + TypeScript | Done |
| Animations | Framer Motion | Done |
| Markdown | react-markdown + remark-gfm | Done |
| Voice Capture | MediaRecorder API | **Done** |
| Transcription | Whisper API (OpenAI) | **Done** |
| Backend | Express.js | **Done** |
| Database | PostgreSQL (Replit) + Drizzle | Schema ready, not wired |
| AI | Claude API | Not started |
| Hosting | Replit | **Working** |

---

## Key Files

```
src/
├── App.tsx                    # Main app, routing, state
├── server/
│   ├── index.ts               # Express server (serves app + API)
│   └── routes/
│       └── transcribe.ts      # Whisper transcription endpoint
├── pages/
│   ├── HomePage.tsx           # Ideas list + capture button
│   └── IdeaDetailPage.tsx     # Analysis (markdown) + Chat tabs
├── components/
│   └── CaptureModal.tsx       # Voice (MediaRecorder) + text capture
├── styles/
│   ├── design-system.css      # Colors, typography, spacing
│   └── app.css                # Component styles + markdown
├── db/
│   ├── schema.ts              # Drizzle schema (ready to wire)
│   ├── index.ts               # Database connection
│   └── queries.ts             # Query functions
└── lib/
    ├── types.ts               # TypeScript types
    └── mock-data.ts           # Sample ideas (replace with DB)
```

---

## Environment Variables (Replit Secrets)

| Variable | Purpose | Status |
|----------|---------|--------|
| `OPENAI_API_KEY` | Whisper transcription | **Required, working** |
| `DATABASE_URL` | PostgreSQL connection | Needed for Phase 2B |
| `ANTHROPIC_API_KEY` | Claude AI | Needed for Phase 3 |

---

## Important Context

- **Adam is not technical** - explain things clearly, avoid jargon
- **Replit handles infrastructure** - Claude Code writes code, Replit provisions database/hosting
- **GitHub syncs to Replit** - push to GitHub, Replit auto-deploys
- **Mobile-first** - always test on phone, not just desktop
- **Single server** - `npm start` builds frontend and runs Express
- **Design doc:** `/docs/plans/2026-01-10-ideaflow-design.md` has full V1 spec

---

## Links

- **GitHub:** https://github.com/adamamzalag/IdeaFlow
- **Replit:** Already imported, preview URL active
- **Design Doc:** `/docs/plans/2026-01-10-ideaflow-design.md`
- **Future Features:** `/docs/FUTURE_FEATURES.md`

---

*This file is the source of truth for project status. Update after each session.*
