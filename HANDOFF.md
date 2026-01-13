# IdeaFlow Session Handoff

**Last Updated:** January 13, 2026

---

## Current State: Frontend Complete, Voice Capture Needs Backend

The app has a complete frontend deployed to Replit. Voice capture currently has a temporary debug UI while we switch to server-side transcription.

### What's Working
- Home page with Active/Pursuing/Deferred tabs
- Text capture
- Idea detail page with markdown analysis rendering
- Chat UI (mock responses only)
- Pursue/Defer actions (UI only)
- Dark theme, animations, mobile-first design
- **Deployed to Replit** - preview URL working

### What's NOT Working Yet
- **Voice capture** - Web Speech API has critical issues on Android (see Lessons Learned)
- **No data persistence** - refresh loses everything (expected, no backend)
- **No real AI** - analysis is mock data, chat doesn't connect to Claude
- **No auth** - single user assumed

---

## Lessons Learned: Web Speech API

We attempted to fix Android voice recording issues and learned important things:

### The Problem
Voice recording on Android Chrome was duplicating words. Users would say "test" and see "test test test".

### What We Tried

**Attempt 1: Hold-to-record + Pull-to-lock gestures**
- Implemented WhatsApp-style hold-to-record with slide-up-to-lock
- Issues discovered:
  1. Layout reflow when recording starts caused false "lock" detection
  2. Lock indicator positioning problems
  3. Android Chrome's long-press triggers text selection menu, conflicting with hold gesture
  4. Word duplication still occurred
- **Conclusion:** Gesture-based recording is problematic on mobile web

**Attempt 2: Debug the duplication**
- Added debug panel to see raw speech API data
- **Root cause found:** Android's Web Speech API returns CUMULATIVE results, not incremental
  - Result[2] = "test"
  - Result[3] = "test test" (includes previous content)
  - Our code concatenated ALL results, causing duplication
- Also discovered: Android fires `onend` aggressively (doesn't wait for silence)

### The Solution
Use server-side transcription instead of fighting browser quirks:
- Record audio with MediaRecorder API (works consistently everywhere)
- Send to backend → Whisper API → return transcript
- Cost: $0.006/minute (negligible for personal use)
- OpenAI API key already in Replit

---

## Next Steps: Phase 2 (Backend + Voice Fix)

### Who Does What

| Task | Who |
|------|-----|
| Write Express server code | Claude Code |
| Write API routes | Claude Code |
| Write database schema | Claude Code |
| Add Whisper transcription endpoint | Claude Code |
| **Provision PostgreSQL** | Replit (Adam uses Replit Agent or dashboard) |
| **Set environment variables** | Replit Secrets |
| Connect frontend to backend | Claude Code |

### Phase 2A: Backend Foundation + Transcription

1. **Create Express Server**
   - Basic Express setup with CORS
   - Health check endpoint

2. **Add Transcription Endpoint**
   - POST `/api/transcribe`
   - Accepts audio file (multipart/form-data or base64)
   - Calls Whisper API
   - Returns transcript text

3. **Update Frontend Voice Capture**
   - Replace Web Speech API with MediaRecorder API
   - Record audio while user speaks
   - On stop: send to `/api/transcribe`
   - Show "Transcribing..." state
   - Display returned transcript

4. **Environment Setup**
   - Reference `OPENAI_API_KEY` from Replit secrets
   - Ensure Replit runs both frontend and backend

### Phase 2B: Data Persistence

1. **Replit: Verify PostgreSQL database**
   - Database may already be provisioned
   - Verify `DATABASE_URL` in Replit Secrets

2. **Claude Code: Wire up database**
   - Connect existing Drizzle schema
   - API routes: GET /ideas, POST /ideas, PATCH /ideas/:id

3. **Claude Code: Connect frontend**
   - Replace mock data with API calls
   - Test end-to-end

### After Phase 2
- Phase 3: AI Integration (Claude API for analysis + chat)
- Phase 4: Auth + PWA + Deploy

---

## Deferred Items

**Animation polish** - Do after Phase 2, before launch. The app needs a consistent animation pass (things appearing/disappearing feel jarring in some places). Should audit all interactions and apply consistent patterns.

---

## Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Frontend | React + Vite + TypeScript | Done |
| Animations | Framer Motion | Done |
| Markdown | react-markdown + remark-gfm | Done |
| Voice Capture | MediaRecorder API | Needs implementation |
| Transcription | Whisper API (OpenAI) | Needs implementation |
| Backend | Express.js | Not started |
| Database | PostgreSQL (Replit) | Not started |
| AI | Claude API | Not started |
| Hosting | Replit | Connected |

---

## Key Files

```
src/
├── App.tsx                    # Main app, routing, state
├── pages/
│   ├── HomePage.tsx           # Ideas list + capture button
│   └── IdeaDetailPage.tsx     # Analysis (markdown) + Chat tabs
├── components/
│   └── CaptureModal.tsx       # Voice/text capture (has debug panel)
├── styles/
│   ├── design-system.css      # Colors, typography, spacing
│   └── app.css                # Component styles + markdown
└── lib/
    ├── types.ts               # TypeScript types
    └── mock-data.ts           # Sample ideas (replace with DB)
```

---

## Important Context

- **Adam is not technical** - explain things clearly, avoid jargon
- **Replit handles infrastructure** - Claude Code writes code, Replit provisions database/hosting
- **GitHub syncs to Replit** - push to GitHub, Replit auto-deploys
- **Mobile-first** - always test on phone, not just desktop
- **Design doc:** `/docs/plans/2026-01-10-ideaflow-design.md` has full V1 spec
- **Voice learnings:** `/docs/plans/piped-spinning-seahorse.md` has detailed investigation notes

---

## Links

- **GitHub:** https://github.com/adamamzalag/IdeaFlow
- **Replit:** Already imported, preview URL active
- **Design Doc:** `/docs/plans/2026-01-10-ideaflow-design.md`
- **Voice Investigation:** `/docs/plans/piped-spinning-seahorse.md`
- **Future Features:** `/docs/FUTURE_FEATURES.md`

---

*This file is the source of truth for project status. Update after each session.*
