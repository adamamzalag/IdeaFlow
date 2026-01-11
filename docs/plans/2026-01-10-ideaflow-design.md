# IdeaFlow Design Document

**Date:** January 10, 2026
**Status:** Approved for V1 Implementation

---

## Overview

IdeaFlow is a phone-first PWA for capturing and developing ideas with AI assistance.

### The Problem

Ideas come throughout the day and get captured in WhatsApp, email, or notes - but they pile up and never get evaluated. When you finally look back, you've lost the context and energy around the idea.

### The Solution

A dedicated app where you voice-record ideas in seconds. An AI agent immediately gets to work in the background - analyzing the idea, identifying challenges, estimating effort, and suggesting next steps. When you come back (hours or days later), you have a fleshed-out analysis ready to review. You can then chat with the AI to go deeper, and ultimately decide: pursue or defer.

### What Makes It Different

- **Instant capture** - Voice recording with multiple input modes, fire-and-forget
- **AI does the work** - You don't have to sit and think through the idea right away
- **Personalized analysis** - The AI knows your constraints and evaluates ideas through your lens
- **Conversational** - Not just a static report, you can discuss the idea with the AI
- **Living analysis** - Chat insights get pushed back into the structured output
- **Learning system** - The AI gets better at analyzing ideas based on what you find useful

---

## User Flow

### Capturing an Idea

1. Open app on phone
2. Choose voice or text input
3. Speak your idea or type it
4. Close the app - you're done

Everything else happens in the background:
- App transcribes the voice recording
- Saves the raw recording/text
- Queues for AI processing

**Goal:** 10-30 seconds, then back to your day.

### AI Processing (Background)

1. AI agent receives the raw idea immediately
2. Generates structured analysis:
   - Summary (one sentence)
   - Problem it solves
   - How it would work
   - Effort estimate (personalized to your constraints)
   - Potential value
   - Challenges
   - How you might accomplish it
   - Next steps
   - Questions for you
3. Idea status changes from "Processing" to "Ready to Review"

### Reviewing an Idea

1. Open app → see list of ideas with status indicators
2. Tap an idea to see the full analysis
3. Original transcript available (collapsed by default)
4. Chat with the AI to discuss, clarify, or go deeper
5. AI may ask clarifying questions; you can ask anything
6. **Chat insights update the structured analysis** - it's a living document
7. When ready, tap "Pursue" or "Defer"

### Managing Ideas

- **Active list** - New and ready-to-review ideas
- **Pursuing list** - Ideas you've decided to act on
- **Deferred list** - Ideas you've set aside (can revisit anytime)

---

## The AI Agent

### Purpose

A specialized agent built to help flesh out and evaluate ideas - not a generic chatbot.

### Personality

- Knows your context (COO, e-commerce, time-constrained, 3 kids under 3)
- Evaluates ideas through YOUR lens by default
- Configurable - you can say "assume I have more time for this one" and it adjusts
- Direct and practical, not fluffy

### Core Capabilities

1. **Structured analysis** - Generates the standard breakdown for every idea
2. **Conversational refinement** - Discusses ideas back-and-forth, asks clarifying questions
3. **Live updates** - Pushes conversation insights back into the structured analysis
4. **Web research** - Can search to check feasibility, find existing solutions, research market (V2)
5. **Image generation** - Can create visuals, mockups, diagrams to make ideas tangible (V2)
6. **Chart generation** - Can create charts and data visualizations (V2)
7. **Self-improvement** - When you ask for a new type of analysis, offers to make it standard (V2)

### Context It Has Access To

- Your personal profile (who you are, constraints, preferences)
- The current idea and its full history
- Previous conversation about this idea
- (Future: patterns from your other ideas)

---

## UI / Screens

### Design Principles

- Clean, fast, modern, beautiful, inspired
- Polished animations throughout
- Effortless workflow
- Mobile-first with large touch targets
- Dark mode option

### 1. Home / Ideas List

- Three tabs: **Active** | **Pursuing** | **Deferred**
- Each idea shows: title (AI-generated summary), status badge, timestamp
- Processing ideas show a subtle animated indicator
- Big floating capture button (bottom right)

### 2. Capture Screen

- Two options: Voice or Text
- Voice: Large mic button with visual feedback while recording
- Three voice modes:
  - **Tap and hold** - Release to stop (like voice message)
  - **Tap to start, auto-stop** - Stops after 1-2 seconds of silence
  - **Tap to start, tap to stop** - Manual control
- Text: Simple text input field
- No submit button - close or navigate away to save
- Minimal UI - get in, capture, get out

### 3. Idea Detail Screen

- Idea title at top
- Collapsible "Original recording/transcript" section
- Structured analysis sections (expandable cards or scrolling list)
- Chat interface at bottom (like a messaging app)
- Action buttons: "Pursue" and "Defer" (sticky at bottom or in header)

### 4. Settings

- Your profile/context (editable)
- Analysis preferences
- Learned patterns the AI has picked up (with ability to remove) (V2)

---

## Technical Architecture

### Platform

- PWA (Progressive Web App) - installable on phone, works in browser on desktop
- Mobile-first design
- Hosted on Replit

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript |
| Backend | Node.js/Express on Replit |
| Database | PostgreSQL (Replit's built-in) |
| Auth | Replit Auth |
| AI | Claude API |
| Voice | Web Speech API (browser-native) |
| Images (V2) | OpenRouter or similar |
| Charts (V2) | Chart.js or similar |

### Data Model

**User**
- Profile information
- Preferences
- Constraints (for personalized analysis)

**Idea**
- Raw input (text or transcript)
- Audio URL (if voice recorded)
- Status: processing | ready | pursuing | deferred
- Timestamps (created, updated, status changed)

**Analysis**
- Linked to Idea
- Structured sections (summary, challenges, etc.)
- Version history (updates as conversation refines it)

**Conversation**
- Linked to Idea
- Chat history (messages array)
- Timestamps

**Settings**
- Analysis preferences
- Learned patterns (V2)

### Background Processing

1. User captures idea → saved to database with status "processing"
2. Background job picks up new ideas
3. AI generates analysis
4. Updates idea with analysis, changes status to "ready"
5. User sees it next time they open the app

---

## V1 Scope

### Included in V1

- Voice capture with all 3 modes (tap-hold, tap-auto-stop, tap-tap)
- Text capture
- Auto-transcription
- Background AI processing
- Structured analysis generation
- Idea list with Active/Pursuing/Deferred tabs
- Idea detail view with full analysis
- Chat with AI to discuss and refine
- Analysis updates based on conversation
- Pursue/Defer actions
- Replit Auth (single user)
- PWA installable on phone
- Beautiful, animated, mobile-first UI
- Dark mode

### Deferred to Later Versions

| Feature | Notes |
|---------|-------|
| Image generation | Visual mockups, diagrams in analysis |
| Chart generation | Data visualizations |
| Web research | AI searches web for feasibility, competitors |
| Self-improving patterns | AI learns what analysis types you find useful |
| Push notifications | Alert when processing completes |
| Multiple users | Currently single-user (just Adam) |
| Tool integrations | Monday.com, email, calendar connections |
| Pursue workflow | Action items, project creation, next steps |
| Voice playback | Play back original recording |
| Idea tagging/categories | Organize ideas by topic |
| Search | Search across all ideas |
| Export | Export ideas to other formats |

---

## Development Workflow

### Build Process

- **Claude Code** does all the building/coding
- **Replit** provides hosting, database, auth, secrets, and infrastructure
- **GitHub** is the source of truth for code

### Setup Flow

1. Create GitHub repository
2. Import into Replit from GitHub
3. Configure Replit secrets (API keys)
4. Claude Code develops features locally
5. Push to GitHub
6. Replit auto-deploys from GitHub

### Why This Architecture

- Replit handles DevOps complexity (hosting, SSL, database management)
- Claude Code is better for actual development than Replit Agent
- GitHub provides version control and backup
- Clean separation of concerns

---

## Success Criteria

V1 is successful when:

1. You can capture an idea by voice in under 15 seconds
2. AI analysis is ready within 2 minutes of capture
3. Analysis feels personalized and useful
4. Chat refinement updates the analysis in real-time
5. The app feels beautiful and delightful to use
6. It works reliably on your phone as an installed PWA

---

## Open Questions

(None currently - all questions resolved during brainstorming)

---

## Appendix: User Context for AI Agent

The AI agent should know:

- **Role:** COO of Wicked Cushions (e-commerce, headphone accessories)
- **Constraints:** Very time-constrained, 3 kids under 3, not a full-time developer
- **Skills:** Highly technical but not an engineer, comfortable with tools and systems
- **Work style:** Remote, flexible hours, lots of context-switching
- **Preference:** Practical solutions over perfect ones, values efficiency

This context shapes how the agent evaluates ideas - a project requiring 20 hours/week is not realistic unless explicitly told otherwise.
