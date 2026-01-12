# IdeaFlow Session Handoff

## What This Project Is

IdeaFlow is a phone-first PWA for capturing and developing ideas with AI assistance. Users voice-record ideas in seconds, an AI agent fleshes them out in the background, and users return later to review, discuss, and decide whether to pursue or defer.

**GitHub:** https://github.com/adamamzalag/IdeaFlow
**Design Doc:** `/docs/plans/2026-01-10-ideaflow-design.md`

## Current State (January 12, 2026)

### What's Built
- **Home Page:** Ideas list with tabs (Active/Pursuing/Deferred), compact card design
- **Capture Modal:** Voice (Web Speech API) and text input with Continue Recording feature
- **Idea Detail Page:** Tabbed layout (Analysis | Chat), unified analysis document view
- **Capture Button:** Large 140px circle, centered, glowing animation

### What Was Fixed This Session
1. **Voice Recording** - Fixed closure bug causing inconsistent recording; added Continue Recording option
2. **Capture Button** - Made it a centered circle with visible glow animation; fixed centering to respect app max-width
3. **Analysis View** - Consolidated from separate cards into one unified document with section dividers

### Build Status
- `npm run build` passes
- TypeScript: No errors
- Dev server: `npm run dev` runs on http://localhost:5173

---

## Next Session: Rich Markdown Rendering (V1)

### Goal
Replace the current rigid analysis sections with rich markdown rendering so the AI can output formatted content naturally.

### What This Means for V1
- **Headers** (h1, h2, h3) for structure
- **Lists** (bullet and numbered)
- **Bold/italic** for emphasis
- **Code blocks** for technical content
- **Blockquotes** for callouts
- **Tables** if needed
- **Links** that are clickable

### Implementation Approach
1. Install a markdown renderer (e.g., `react-markdown` or `marked`)
2. Update the AI prompt to return markdown instead of structured JSON fields
3. Update `AnalysisView` component to render markdown instead of labeled sections
4. Style the markdown output to match the app's design system

### Files to Modify
- `src/pages/IdeaDetailPage.tsx` - AnalysisView component
- `src/styles/app.css` - Markdown rendering styles
- `src/lib/types.ts` - May need to update Idea.analysis type
- `src/lib/mock-data.ts` - Update mock data to use markdown

---

## V2 Rich Analysis (Future)

Full ChatGPT-style experience documented in `/docs/FUTURE_FEATURES.md`:
- Image generation (DALL-E/Midjourney API)
- Charts & visualizations (Chart.js/Recharts)
- File generation (PDF export, project briefs)
- Interactive elements (collapsible sections, action items)
- Embedded media (YouTube, link previews)
- Narrative flow (AI writes naturally, not rigid sections)

---

## Tech Stack

- React + TypeScript + Vite
- Framer Motion (animations)
- Lucide React (icons)
- Web Speech API (voice recording)
- Will deploy to Replit (not set up yet)

## Key Files

```
src/
├── App.tsx                    # Main app with routing
├── pages/
│   ├── HomePage.tsx           # Ideas list + capture button
│   └── IdeaDetailPage.tsx     # Tabbed analysis/chat view
├── components/
│   └── CaptureModal.tsx       # Voice/text capture with Continue Recording
├── styles/
│   ├── design-system.css      # Colors, typography, spacing
│   └── app.css                # Component styles
└── lib/
    ├── types.ts               # TypeScript types
    └── mock-data.ts           # Sample ideas for testing
```

## Documentation

- `/docs/FUTURE_FEATURES.md` - V2+ roadmap including Rich Analysis Output
- `/docs/STYLE_GUIDE.md` - Design system reference
- `/docs/specs/v1-complete-spec.md` - Full V1 specification

---

*Session Date: January 12, 2026*
