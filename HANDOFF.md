# IdeaFlow Session Handoff

**Last Updated:** January 12, 2026

---

## Current State: Frontend Complete, Ready for Backend

The app has a complete frontend deployed to Replit. No backend yet - data doesn't persist.

### What's Working
- Home page with Active/Pursuing/Deferred tabs
- Voice capture (fixed duplication bug on Android)
- Text capture
- Idea detail page with markdown analysis rendering
- Chat UI (mock responses only)
- Pursue/Defer actions (UI only)
- Dark theme, animations, mobile-first design
- **Deployed to Replit** - preview URL working

### What's NOT Working Yet
- **No data persistence** - refresh loses everything (expected, no backend)
- **No real AI** - analysis is mock data, chat doesn't connect to Claude
- **No auth** - single user assumed

---

## Next Steps: Phase 2 (Backend Foundation)

### Who Does What

| Task | Who |
|------|-----|
| Write Express server code | Claude Code |
| Write API routes | Claude Code |
| Write database schema | Claude Code |
| **Provision PostgreSQL** | Replit (Adam uses Replit Agent or dashboard) |
| **Set environment variables** | Replit Secrets |
| Connect frontend to backend | Claude Code |

### Phase 2 Tasks

1. **Replit: Add PostgreSQL database**
   - Adam adds database to Replit project
   - Gets connection string
   - Stores in Replit Secrets as `DATABASE_URL`

2. **Claude Code: Build backend**
   - Express.js server
   - Database schema (users, ideas, conversations)
   - API routes: GET /ideas, POST /ideas, PATCH /ideas/:id
   - Connect to PostgreSQL

3. **Claude Code: Connect frontend**
   - Replace mock data with API calls
   - Test end-to-end

### After Phase 2
- Phase 3: AI Integration (Claude API for analysis + chat)
- Phase 4: Auth + PWA + Deploy

---

## Known Bug: Voice Recording Duplication on Android

**Problem:** On Android Chrome, voice recording duplicates words/phrases. Works fine on desktop Chrome.

**Root cause:** The code auto-restarts recognition when Android stops it mid-speech. Android then re-recognizes audio still in its buffer, causing duplication.

**Solution:** Replace current tap-to-start/auto-stop with two recording modes:

### 1. Hold-to-Record (Quick ideas)
- Press and hold mic button → recording
- Release → stop recording
- No auto-restart needed
- If Android stops early, user sees transcript and can press again

### 2. Pull-to-Lock (Longer recordings, hands-free)
- Tap mic to start recording
- Slide/pull up to "lock" into continuous mode
- Tap again to stop
- For use cases like recording while driving

**UI/UX needed:**
- Visual indicator for "locked" state (maybe a lock icon, color change)
- Pulsing animation while recording
- Live transcript visible during recording
- "Continue" button still available if recording stops unexpectedly

**Priority:** Fix before Phase 3 (AI integration) since voice capture is core functionality.

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
| Voice | Web Speech API | Done |
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
│   └── CaptureModal.tsx       # Voice/text capture
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

---

## Links

- **GitHub:** https://github.com/adamamzalag/IdeaFlow
- **Replit:** Already imported, preview URL active
- **Design Doc:** `/docs/plans/2026-01-10-ideaflow-design.md`
- **Future Features:** `/docs/FUTURE_FEATURES.md`

---

*This file is the source of truth for project status. Update after each session.*
