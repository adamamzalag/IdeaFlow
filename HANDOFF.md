# IdeaFlow Session Handoff

**Last Updated:** January 14, 2026

---

## Current State: Phase 2B Complete - Data Persists

The app now has full data persistence. Ideas are stored in PostgreSQL and survive page refresh.

### What's Working
- Home page with Active/Pursuing/Deferred tabs
- **Voice capture with Whisper transcription** - Records audio, sends to server, returns accurate transcript
- Text capture
- **Data persistence** - Ideas saved to PostgreSQL database
- **Status changes persist** - Pursue/Defer actions saved
- Idea detail page with placeholder analysis
- Chat UI (empty, ready for Phase 3)
- Dark theme, animations, mobile-first design
- **Express backend** serving API + frontend
- **Deployed to Replit** - `npm start` runs everything

### What's NOT Working Yet
- **No real AI analysis** - Shows placeholder "Analysis Coming Soon" (Phase 3)
- **No real chat** - Chat is empty until Phase 3
- **No auth** - Single default user (Phase 4)

---

## What We Built (Phase 2A + 2B)

### Phase 2A: Voice Capture
- `src/server/routes/transcribe.ts` - Whisper API endpoint
- `src/components/CaptureModal.tsx` - MediaRecorder + API call
- Replaced Web Speech API (had Android bugs) with server-side Whisper

### Phase 2B: Data Persistence
- `src/server/utils/ensureDefaultUser.ts` - Default user for pre-auth
- `src/server/routes/ideas.ts` - CRUD API endpoints
- `src/lib/api.ts` - Frontend API client
- `src/App.tsx` - Connected to real API instead of mock data
- Deleted `src/lib/mock-data.ts`

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/transcribe` | POST | Voice → text via Whisper |
| `/api/ideas` | GET | List all ideas |
| `/api/ideas` | POST | Create new idea |
| `/api/ideas/:id` | GET | Get idea with analysis |
| `/api/ideas/:id/status` | PATCH | Update idea status |

---

## Next Steps: Phase 3 (AI Integration)

### Tasks
1. **Add Claude API integration**
   - When idea is created, generate real analysis
   - Store analysis in database

2. **Connect chat to Claude**
   - Real AI responses in chat
   - Context from idea and analysis

### Environment Variables Needed
- `ANTHROPIC_API_KEY` - For Claude API

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
| Database | PostgreSQL + Drizzle | **Done** |
| AI | Claude API | Not started |
| Hosting | Replit | **Working** |

---

## Key Files

```
src/
├── App.tsx                    # Main app, API integration
├── server/
│   ├── index.ts               # Express server
│   ├── routes/
│   │   ├── transcribe.ts      # Whisper transcription
│   │   └── ideas.ts           # Ideas CRUD API
│   └── utils/
│       └── ensureDefaultUser.ts
├── pages/
│   ├── HomePage.tsx           # Ideas list
│   └── IdeaDetailPage.tsx     # Analysis + Chat
├── components/
│   └── CaptureModal.tsx       # Voice/text capture
├── lib/
│   ├── api.ts                 # Frontend API client
│   └── types.ts               # TypeScript types
├── db/
│   ├── schema.ts              # Drizzle schema
│   ├── index.ts               # Database connection
│   └── queries.ts             # Query functions
└── styles/
    ├── design-system.css
    └── app.css
```

---

## Environment Variables (Replit Secrets)

| Variable | Purpose | Status |
|----------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection | **Required** |
| `OPENAI_API_KEY` | Whisper transcription | **Required** |
| `ANTHROPIC_API_KEY` | Claude AI | Needed for Phase 3 |

---

## Deferred Items

**UX Polish** (noted during Phase 2B code review):
- Replace `alert()` errors with toasts/snackbars
- Add loading spinners for user actions
- Add retry button on initial load failure

**Animation Polish** - Do before launch.

---

## Important Context

- **Adam is not technical** - explain things clearly
- **Replit handles infrastructure** - provisions database/hosting
- **GitHub syncs to Replit** - push to GitHub, auto-deploys
- **Mobile-first** - always test on phone
- **Single server** - `npm start` builds frontend and runs Express

---

## Links

- **GitHub:** https://github.com/adamamzalag/IdeaFlow
- **Replit:** Preview URL active
- **Design Doc:** `/docs/plans/2026-01-10-ideaflow-design.md`

---

*This file is the source of truth for project status. Update after each session.*
