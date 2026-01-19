# IdeaFlow Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased]

*No known issues*

---

## v0.4.5 - FAB Fix + API Retry (January 19, 2026)

### Fixed
- **FAB no longer covers bottom of ideas list** - Increased bottom padding from 80px to 180px for proper FAB clearance

### Added
- **API retry logic for network errors** - OpenRouter calls now retry up to 2 times on connection drops/timeouts. Fixes intermittent "TypeError: terminated" errors during analysis regeneration.

---

## v0.4.4 - Chat Markdown + Executive Summary (January 19, 2026)

### Fixed
- **Chat messages now render markdown** - Bold, bullets, and formatting display correctly instead of raw `*` and `-` characters

### Changed
- **Analysis uses executive summary structure**
  - "Bottom Line" section appears first with 1-2 sentence verdict
  - "Key Points" for essential insights and reality check
  - "Detail" section only for complex ideas (omitted for simple ones)
  - Users can scan verdict in 5 seconds, read deeper if wanted

- **Chat responses tighter**
  - First sentence is the direct answer
  - No setup, no "Great question", no restating
  - Detail only when question requires it

---

## v0.4.3 - AI Web Search + Conciseness (January 18, 2026)

### Changed
- **Model upgraded to Claude Sonnet 4.5 with web search**
  - Now uses `anthropic/claude-sonnet-4.5:online` via OpenRouter
  - AI can search the web for current tools, pricing, competitors
  - Ask about "best AI tools right now" and get current answers

- **AI prompts rewritten for conciseness**
  - Reframed as "executive analyst presenting to busy decision-maker"
  - "30-second hallway conversation" framing for chat
  - Verdict first, supporting detail second
  - No more hedging ("might", "could potentially")
  - Cut preamble and filler text

---

## v0.4.2 - AI Persona Redesign (January 14, 2026)

### Changed
- **AI Analysis Persona: "Chief of Staff for Ideas"**
  - Redesigned AI prompts for analysis and chat
  - Less verbose, more substance-focused
  - Adapts depth to idea complexity (brief for simple, thorough for complex)
  - Strategic advisor tone: direct, honest, values user's time
  - No more rigid template-filling or generic advice
  - Chat responds adaptively based on what user is asking

### Added
- Design document: `docs/plans/2026-01-14-ai-persona-design.md`

---

## v0.4.1 - Bug Fixes (January 14, 2026)

### Fixed
- **Issue B: CSS Layout Overflow** (RESOLVED)
  - Root cause: `max-width` without explicit `width` allowed content to expand page beyond viewport
  - Added `width: 100%` to `.detail-page` and `.detail-header`
  - Changed `100vw` to `100%` on html/body (100vw includes scrollbar width)
  - Removed x-transform from detail page animation
  - Long titles now properly truncate with ellipsis

- **Keyboard Scroll Void on Android**
  - Added `interactive-widget=resizes-content` to viewport meta tag
  - Prevents scrolling into empty black space when keyboard opens

---

## v0.4.0 - Phase 3 AI Integration Complete (January 14, 2026)

**Milestone:** AI-powered analysis and chat working

### Added
- **Claude AI Integration** (via OpenRouter)
  - Initial analysis generation with AI-generated titles
  - Chat functionality for exploring ideas
  - Analysis regeneration based on chat conversation
  - Background processing (non-blocking)

- **Voice Input in Chat**
  - Mic button in chat input
  - MediaRecorder + Whisper transcription
  - Appends to existing input

- **Simplified Capture Flow**
  - One-tap recording from home page
  - Review modal with Continue/Edit/Save
  - Continue recording within modal

- **View Analysis Modal**
  - Quick access to analysis while in chat tab
  - Scrollable overlay

- **Unread Indicator**
  - Coral dot on idea cards with unviewed analysis
  - `analysisViewedAt` tracking in database

### Changed
- Bottom bar is now fixed position (sticky)
- Keyboard detection hides Pursue/Defer buttons
- Chat input auto-expands as user types
- Back button is non-blocking (analysis updates in background)

### Fixed
- **Toggle Pursue/Defer Buttons**
  - Buttons now toggle status (click again to return to ready)
  - Optimistic UI updates (instant feedback)
  - Defer selected → red, Pursue selected → orange

- **Analysis Preservation**
  - Status change no longer causes analysis to disappear
  - Merges updated fields while preserving analysis object

- **Keyboard in Review Modal**
  - Textarea scrolls into view when focused

---

## v0.3.0 - Phase 2B Complete (January 14, 2026)

**Milestone:** Data Persistence - Ideas survive page refresh

### Added
- **Default user utility** (`src/server/utils/ensureDefaultUser.ts`)
  - Creates "default-user" on server startup
  - Caches user ID for API routes
  - Enables data persistence before auth (Phase 4)

- **Ideas API router** (`src/server/routes/ideas.ts`)
  - GET `/api/ideas` - List all ideas for user
  - POST `/api/ideas` - Create new idea with placeholder analysis
  - GET `/api/ideas/:id` - Get idea with analysis
  - PATCH `/api/ideas/:id/status` - Update idea status
  - UUID validation on ID parameters

- **Frontend API client** (`src/lib/api.ts`)
  - `getIdeas()` - Fetch all ideas
  - `getIdea(id)` - Fetch single idea with analysis
  - `createIdea(rawInput, isVoice)` - Create new idea
  - `updateIdeaStatus(id, status)` - Update status

- **App.tsx API integration**
  - Loading state on initial fetch
  - Error handling for API failures
  - All CRUD operations use real API

### Changed
- Server startup now initializes default user before listening
- Ideas router mounted at `/api`
- IdeaDetailPage chat starts empty (ready for Phase 3)

### Removed
- `src/lib/mock-data.ts` - No longer needed
- Mock messages from IdeaDetailPage

### Technical Details
- Uses Drizzle ORM for database queries
- PostgreSQL database (Replit managed)
- Environment variable: `DATABASE_URL`

---

## v0.2.0 - Phase 2A Complete (January 13, 2026)

**Milestone:** Backend Foundation + Voice Capture Working

### Added
- **Express.js backend** (`src/server/index.ts`)
  - Serves both API and built frontend from single server
  - Health check endpoint at `/api/health`
  - Production-ready with `npm start` command

- **Whisper transcription endpoint** (`src/server/routes/transcribe.ts`)
  - POST `/api/transcribe` accepts audio files
  - Uses OpenAI Whisper API for accurate transcription
  - Handles webm and mp4 audio formats
  - Cost: ~$0.006/minute

- **MediaRecorder-based voice capture** (`src/components/CaptureModal.tsx`)
  - Records audio using browser MediaRecorder API
  - Sends audio to server for transcription
  - Shows "Transcribing..." spinner while processing
  - Works reliably on Android Chrome (no more duplication!)

- **Single-server deployment**
  - `npm start` builds frontend and runs Express
  - Replit runs one command, serves everything

### Changed
- Voice capture now uses server-side Whisper instead of browser Web Speech API
- Frontend fetches `/api/transcribe` instead of using SpeechRecognition

### Removed
- Web Speech API code (was causing Android issues)
- Debug panel (no longer needed)
- Hold-to-record gestures (reverted as problematic on mobile)

### Technical Details
- Dependencies added: express, cors, multer, openai, tsx
- Environment variable required: `OPENAI_API_KEY`

---

## v0.1.0 - Project Initialization (January 10, 2026)

**Milestone:** Design Complete + Frontend Built

### Added
- React + Vite + TypeScript frontend
- Home page with Active/Pursuing/Deferred tabs
- Idea capture modal (voice + text)
- Idea detail page with Analysis + Chat tabs
- Framer Motion animations
- Dark theme with warm coral accents
- Mobile-first responsive design
- Drizzle ORM schema
- Project documentation

### Learned (Web Speech API Investigation)
- Android Chrome returns cumulative speech results
- Browser fires `onend` aggressively
- Gesture-based recording conflicts with mobile browser behaviors
- **Decision:** Use server-side transcription for reliability

---

## Roadmap

### Phase 4 - Auth & Polish (Next)
- Replit Auth integration
- PWA features (installable, offline support)
- UX polish (toasts, loading states)
- Animation polish pass

### Deferred
- Issue D: Browser swipe-back gesture (needs routing/history management)

---

*Format based on [Keep a Changelog](https://keepachangelog.com/)*
