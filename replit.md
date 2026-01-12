# IdeaFlow - Replit Agent Guide

## Overview

IdeaFlow is a phone-first Progressive Web App (PWA) for capturing and developing ideas with AI assistance. Users voice-record or type ideas quickly, an AI agent analyzes them in the background, and users return later to review a full analysis and chat with the AI to refine their thinking.

The app follows a "capture fast, review later" philosophy - the capture experience should take 10-30 seconds, then AI does the heavy lifting while the user goes about their day.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript, built with Vite

**Key Design Decisions:**
- **Mobile-first PWA** - Designed primarily for phone use with standalone display mode
- **Single-page application** - Uses simple state-based routing (home vs detail view) rather than a router library
- **Framer Motion** - Handles all animations for smooth mobile transitions
- **Voice input** - Uses Web Speech API for voice-to-text capture
- **Markdown rendering** - AI analysis displayed using react-markdown with GitHub Flavored Markdown support

**Component Structure:**
- `App.tsx` - Main container managing view state and idea data
- `pages/` - HomePage (idea list with tabs) and IdeaDetailPage (analysis + chat)
- `components/` - CaptureModal for voice/text input
- `styles/` - CSS-based design system with warm minimal dark theme

### Backend Architecture (Planned)

**Framework:** Express.js with Node.js (not yet implemented)

**Current State:** Frontend-only with mock data. Backend needs to be built.

**Planned Structure:**
- REST API endpoints for ideas, analyses, and conversations
- Background job processing for AI analysis
- Replit Auth integration for user identity

### Data Layer

**ORM:** Drizzle ORM with PostgreSQL (now implemented)

**Database Files:**
- `src/db/schema.ts` - Drizzle schema definitions
- `src/db/index.ts` - Database connection pool
- `src/db/queries.ts` - Common query functions
- `drizzle.config.ts` - Drizzle Kit configuration

**Schema Design (defined in `src/db/schema.ts`):**
- `users` - Links to Replit Auth via `replitId`, stores user profile as JSONB
- `ideas` - Core entity with raw input, optional audio URL, status enum (processing/ready/pursuing/deferred)
- `analyses` - Versioned analysis content stored as JSONB, linked to ideas
- `conversations` - Chat history stored as JSONB messages array

**Status Flow:** Ideas move through: `processing` → `ready` → `pursuing` or `deferred`

### Build System

- Vite for frontend bundling and dev server
- TypeScript with strict mode enabled
- Path aliases configured (`@/*` maps to `src/*`)
- Drizzle Kit for database migrations (`npm run db:generate`, `npm run db:migrate`)

## External Dependencies

### AI Integration
- **Claude API (Anthropic)** - Powers idea analysis and chat functionality
- Requires `ANTHROPIC_API_KEY` in environment secrets

### Database
- **PostgreSQL** - Primary data store, provisioned through Replit
- Connection via `DATABASE_URL` environment variable (auto-provided by Replit when database is added)

### Authentication
- **Replit Auth** - User identity management, no separate auth system needed

### Frontend Libraries
- `framer-motion` - Animations and gestures
- `lucide-react` - Icon system
- `react-markdown` + `remark-gfm` - Markdown rendering for AI output

### Browser APIs
- **Web Speech API** - Voice recording and transcription
- **Web Push API** - Planned for notifications when analysis completes