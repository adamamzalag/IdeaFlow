# IdeaFlow Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased]

*Nothing yet - Phase 2A just completed!*

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
  - No more proxy errors or dual-server setup

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
- Drizzle ORM schema (not yet wired)
- Project documentation

### Learned (Web Speech API Investigation)
- Android Chrome returns cumulative speech results
- Browser fires `onend` aggressively
- Gesture-based recording conflicts with mobile browser behaviors
- **Decision:** Use server-side transcription for reliability

### Development Workflow
- Claude Code for all development
- GitHub as source of truth
- Replit for hosting, database, secrets
- Auto-deploy from GitHub to Replit

---

## Roadmap

### Phase 2B - Data Persistence (Next)
- Wire up PostgreSQL database
- API routes for ideas CRUD
- Connect frontend to real API

### Phase 3 - AI Integration
- Claude API for idea analysis
- Chat functionality with Claude

### Phase 4 - Polish & Deploy
- Replit Auth integration
- PWA features
- Animation polish pass

---

*Format based on [Keep a Changelog](https://keepachangelog.com/)*
