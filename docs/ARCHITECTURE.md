# IdeaFlow Architecture

## System Overview

IdeaFlow is a phone-first PWA with a React frontend, Express backend, and PostgreSQL database, all hosted on Replit.

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Phone/Browser                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 React PWA (Frontend)                 │   │
│  │  - Voice/Text Capture                               │   │
│  │  - Ideas List                                       │   │
│  │  - Idea Detail + Chat                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Replit Infrastructure                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Express Backend (Node.js)               │   │
│  │  - REST API                                         │   │
│  │  - Replit Auth                                      │   │
│  │  - Background Job Processing                        │   │
│  │  - AI Agent Orchestration                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│              ┌───────────────┼───────────────┐             │
│              ▼               ▼               ▼             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  PostgreSQL   │  │  Claude API   │  │ Replit Auth   │  │
│  │  (Database)   │  │  (AI Agent)   │  │ (Identity)    │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Idea Capture Flow

```
User speaks/types idea
        │
        ▼
┌───────────────────┐
│  Web Speech API   │  (if voice)
│  transcribes      │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  POST /api/ideas  │
│  Save to DB       │
│  Status: processing
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Background Job   │
│  Picks up idea    │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  AI Agent         │
│  Generates        │
│  Analysis         │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Update DB        │
│  Status: ready    │
└───────────────────┘
```

### Chat & Analysis Update Flow

```
User sends message in chat
        │
        ▼
┌───────────────────┐
│  POST /api/ideas  │
│  /:id/chat        │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  AI Agent         │
│  Processes msg    │
│  Updates analysis │
│  Responds         │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Return updated   │
│  analysis +       │
│  AI response      │
└───────────────────┘
```

## Component Architecture

### Frontend (React)

```
src/client/
├── components/
│   ├── IdeaList/        # List of ideas with tabs
│   ├── IdeaCard/        # Individual idea preview
│   ├── CaptureButton/   # Floating action button
│   ├── VoiceRecorder/   # Voice capture UI
│   ├── TextCapture/     # Text input
│   ├── IdeaDetail/      # Full idea view
│   ├── AnalysisView/    # Structured analysis display
│   ├── Chat/            # Chat interface
│   └── common/          # Buttons, inputs, etc.
├── pages/
│   ├── Home/            # Ideas list page
│   ├── Capture/         # Capture modal/screen
│   ├── IdeaDetail/      # Individual idea page
│   └── Settings/        # User settings
├── hooks/
│   ├── useVoiceRecorder # Voice recording logic
│   ├── useIdeas         # Ideas data management
│   └── useChat          # Chat functionality
└── lib/
    ├── api              # API client
    └── speech           # Web Speech API wrapper
```

### Backend (Express)

```
src/server/
├── routes/
│   ├── ideas.ts         # CRUD for ideas
│   ├── chat.ts          # Chat endpoints
│   ├── auth.ts          # Replit Auth
│   └── user.ts          # User profile
├── services/
│   ├── ideaService.ts   # Idea business logic
│   ├── analysisService.ts # Analysis generation
│   └── chatService.ts   # Chat handling
├── agent/
│   ├── index.ts         # Agent orchestration
│   ├── prompts.ts       # System prompts
│   └── tools.ts         # Agent tools (V2)
├── db/
│   ├── schema.ts        # Drizzle schema
│   ├── migrations/      # DB migrations
│   └── queries.ts       # Common queries
└── jobs/
    └── processIdeas.ts  # Background processing
```

## Database Schema

### Tables

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| replit_id | string | From Replit Auth |
| profile | jsonb | Name, constraints, preferences |
| created_at | timestamp | |
| updated_at | timestamp | |

**ideas**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| raw_input | text | Original text/transcript |
| audio_url | string | Optional, if voice recorded |
| status | enum | processing, ready, pursuing, deferred |
| created_at | timestamp | |
| updated_at | timestamp | |
| status_changed_at | timestamp | |

**analyses**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| idea_id | uuid | Foreign key |
| version | integer | Increments on updates |
| content | jsonb | Structured analysis |
| created_at | timestamp | |

**conversations**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| idea_id | uuid | Foreign key |
| messages | jsonb | Array of messages |
| updated_at | timestamp | |

## Security

- All API routes require Replit Auth
- Database credentials via Replit Secrets
- HTTPS enforced by Replit
- User can only access their own ideas

## Performance Considerations

- Ideas list paginated (20 per page)
- Analysis generation is async (doesn't block UI)
- Chat responses streamed where possible
- PWA caches shell for instant load

---

*See API_REFERENCE.md for endpoint details*
