# IdeaFlow - Project Context

## What This Is

IdeaFlow is a phone-first PWA for capturing and developing ideas with AI assistance. Users voice-record ideas in seconds, an AI agent fleshes them out in the background, and users return later to review, discuss, and decide whether to pursue or defer.

## Current Status

**Version:** v0.4.5 (January 19, 2026)
**Phase:** Phase 3 Complete - AI Integration Working

**What's Implemented:**
- Voice/text capture with Whisper transcription ✓
- Background AI analysis generation ✓
- "Chief of Staff for Ideas" AI persona (adaptive, substantive analysis) ✓
- Idea list with Active/Pursuing/Deferred tabs ✓
- Idea detail with Analysis + Chat tabs ✓
- Chat with AI that updates analysis ✓
- Pursue/Defer workflow ✓
- Mobile-first PWA (installable) ✓

**What's NOT Implemented Yet:**
- Replit Auth (using hardcoded default user)
- Multiple users
- Offline support
- Push notifications

**Next:** Phase 4 - Auth & Polish

---

## Development Workflow

### Build Architecture

| Responsibility | Tool |
|----------------|------|
| All coding/development | Claude Code |
| Hosting | Replit |
| Database | Replit PostgreSQL |
| Authentication | Default user (Replit Auth planned for Phase 4) |
| Secrets/Environment | Replit Secrets |
| Version Control | GitHub |
| Deployment | Replit (auto-deploys from GitHub) |

### Development Flow

1. Claude Code develops features locally
2. Push changes to GitHub
3. Replit auto-pulls and deploys from GitHub
4. Test on Replit's hosted environment

### Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Claude Sonnet API access |
| `OPENAI_API_KEY` | Whisper transcription |
| `DATABASE_URL` | PostgreSQL (auto-provided by Replit) |

### Important

- **DO NOT** use Replit Agent for coding - use Claude Code
- **DO** use Replit for all infrastructure (hosting, DB, secrets)
- **ALWAYS** push to GitHub before testing on Replit

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Vanilla CSS (custom design system) |
| Animations | Framer Motion |
| Backend | Node.js/Express 5 |
| Database | PostgreSQL (Replit) + Drizzle ORM |
| Auth | Hardcoded default user (Replit Auth in Phase 4) |
| AI | Claude Sonnet (via OpenRouter) |
| Transcription | OpenAI Whisper API |
| Hosting | Replit |

---

## Project Structure

```
IdeaFlow/
├── CLAUDE.md              # This file
├── src/
│   ├── App.tsx            # Main app with routing
│   ├── main.tsx           # React entry point
│   ├── pages/
│   │   ├── HomePage.tsx   # Ideas list with tabs
│   │   └── IdeaDetailPage.tsx  # Detail with Analysis/Chat
│   ├── components/
│   │   └── CaptureModal.tsx    # Voice/text capture
│   ├── lib/
│   │   ├── api.ts         # Frontend API client
│   │   └── types.ts       # TypeScript interfaces
│   ├── server/
│   │   ├── index.ts       # Express server
│   │   ├── routes/
│   │   │   ├── ideas.ts   # Ideas CRUD
│   │   │   ├── chat.ts    # Chat + analysis regeneration
│   │   │   └── transcribe.ts  # Whisper transcription
│   │   ├── services/
│   │   │   └── ai.ts      # Claude Sonnet integration
│   │   └── utils/
│   │       └── ensureDefaultUser.ts
│   ├── db/
│   │   ├── index.ts       # Drizzle setup
│   │   ├── schema.ts      # PostgreSQL schema
│   │   └── migrations/    # Database migrations
│   └── styles/
│       ├── app.css        # Main styles
│       └── design-system.css  # Design tokens
├── docs/
│   ├── CHANGELOG.md       # Version history (source of truth)
│   ├── ARCHITECTURE.md    # System design
│   ├── API_REFERENCE.md   # API endpoints
│   ├── GETTING_STARTED.md # Setup guide
│   ├── TROUBLESHOOTING.md # Common issues
│   └── plans/             # Design & implementation docs
└── public/                # Static assets
```

---

## Database Schema

```sql
users (id, replitId, profile, createdAt, updatedAt)
ideas (id, userId, rawInput, title, audioUrl, status, analysisViewedAt, createdAt, updatedAt)
analyses (id, ideaId, version, content, createdAt)
conversations (id, ideaId, messages, updatedAt)
```

**Status values:** `processing` | `ready` | `pursuing` | `deferred`

---

## AI Agent Context

The AI agent evaluates ideas through this lens:

- **User:** Adam Amzalag, COO of Wicked Cushions
- **Constraints:** Very time-constrained, 3 kids under 3
- **Skills:** Highly technical but not an engineer
- **Preference:** Practical over perfect, values efficiency

This shapes analysis - big time commitments aren't realistic unless explicitly stated.

---

## Key Design Decisions

1. **Fire-and-forget capture** - User closes app after recording, everything else is background
2. **Living analysis** - Chat insights push back into structured analysis
3. **Personalized by default** - Agent knows user's constraints
4. **Phone-first** - PWA designed for mobile, works on desktop
5. **Single user for now** - Multi-user architecture exists but auth is Phase 4

---

## Commands

```bash
# Development
npm run dev          # Vite dev server (frontend)
npm run server       # Express server
npm run typecheck    # TypeScript check

# Production
npm run build        # Build frontend
npm run start        # Build + start server (port 5000)

# Database
npm run db:generate  # Generate migration from schema
npm run db:migrate   # Apply migrations
npm run db:studio    # Drizzle Studio UI
```

---

## Documentation Maintenance

**After any code changes, update:**

1. `docs/CHANGELOG.md` - Add entry for the change
2. `CLAUDE.md` - Update if tech stack, structure, or status changes
3. Relevant doc files if APIs, setup, or architecture changes

**Source of truth for current state:** `docs/CHANGELOG.md`

---

*Last updated: January 19, 2026*
