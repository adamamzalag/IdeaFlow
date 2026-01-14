# IdeaFlow - Project Context

## What This Is

IdeaFlow is a phone-first PWA for capturing and developing ideas with AI assistance. Users voice-record ideas in seconds, an AI agent fleshes them out in the background, and users return later to review, discuss, and decide whether to pursue or defer.

## Development Workflow

### Build Architecture

| Responsibility | Tool |
|----------------|------|
| All coding/development | Claude Code |
| Hosting | Replit |
| Database | Replit PostgreSQL |
| Authentication | Replit Auth |
| Secrets/Environment | Replit Secrets |
| Version Control | GitHub |
| Deployment | Replit (auto-deploys from GitHub) |

### Development Flow

1. Claude Code develops features locally
2. Push changes to GitHub
3. Replit auto-pulls and deploys from GitHub
4. Test on Replit's hosted environment

### Important

- **DO NOT** use Replit Agent for coding - use Claude Code
- **DO** use Replit for all infrastructure (hosting, DB, auth, secrets)
- **ALWAYS** push to GitHub before testing on Replit
- Replit secrets should store: `OPENROUTER_API_KEY`, `OPENAI_API_KEY` (for Whisper), `DATABASE_URL` (auto-provided by Replit)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| Backend | Node.js/Express |
| Database | PostgreSQL (Replit) |
| Auth | Replit Auth |
| AI | Claude Sonnet (via OpenRouter) |
| Voice | Web Speech API |
| Hosting | Replit |

---

## Project Structure

```
IdeaFlow/
├── CLAUDE.md              # This file
├── src/
│   ├── client/            # React frontend
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities
│   │   └── styles/        # CSS/styling
│   ├── server/            # Express backend
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── db/            # Database schema & queries
│   │   └── agent/         # AI agent logic
│   └── shared/            # Shared types/constants
├── docs/
│   ├── plans/             # Design documents
│   ├── specs/             # Feature specifications
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── GETTING_STARTED.md
│   └── ...
└── public/                # Static assets
```

---

## Current Status

**Phase:** Pre-implementation (Design Complete)

**Design Doc:** `docs/plans/2026-01-10-ideaflow-design.md`

---

## V1 Features

- Voice capture (3 modes: tap-hold, tap-auto-stop, tap-tap)
- Text capture
- Background AI processing with structured analysis
- Idea list (Active/Pursuing/Deferred tabs)
- Idea detail with analysis view
- Chat with AI to refine ideas
- Live analysis updates from conversation
- Pursue/Defer workflow
- Replit Auth
- PWA (installable on phone)
- Beautiful animated mobile-first UI

---

## Deferred Features

See full list in design doc. Key items:
- Image/chart generation
- Web research
- Self-improving analysis patterns
- Push notifications
- Multiple users
- Tool integrations (Monday.com, etc.)

---

## AI Agent Context

The AI agent in this app should know:

- **User:** Adam Amzalag, COO of Wicked Cushions
- **Constraints:** Very time-constrained, 3 kids under 3
- **Skills:** Highly technical but not an engineer
- **Preference:** Practical over perfect, values efficiency

This shapes how it evaluates ideas - big time commitments aren't realistic unless the user explicitly says otherwise.

---

## Key Design Decisions

1. **Fire-and-forget capture** - User closes app immediately after recording, everything else is background
2. **Living analysis** - Chat insights push back into structured output, not just conversation history
3. **Personalized by default** - Agent knows user's constraints, but configurable per-idea
4. **Phone-first** - PWA designed for mobile, works on desktop too
5. **Replit infrastructure** - Use Replit's managed services, Claude Code for development

---

## Commands

```bash
# Local development (after Replit import)
npm install
npm run dev

# Build for production
npm run build

# Database migrations
npm run db:migrate
```

---

*Last updated: January 10, 2026*
