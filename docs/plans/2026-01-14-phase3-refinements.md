# Phase 3 Refinements - Implementation Plan

**Date:** January 14, 2026
**Status:** Ready for implementation

---

## Overview

Post-testing refinements to fix UI issues and improve UX based on real usage.

---

## Tasks

### Task 1: Global Overflow Fix

**Problem:** Horizontal scroll appears on detail page (and potentially elsewhere)

**Files:**
- `src/styles/app.css` or `src/styles/design-system.css`

**Changes:**
- Add global overflow constraints to body/html
- Ensure all text containers have `overflow-wrap: break-word`
- Add `max-width: 100%` to elements that might overflow
- Check title, analysis content, chat messages for proper wrapping

---

### Task 2: Sticky Bottom Bar

**Problem:** Input bar and Defer/Pursue buttons scroll with content instead of staying fixed

**Files:**
- `src/pages/IdeaDetailPage.tsx`
- `src/styles/app.css`

**Changes:**
- Wrap input bar + action buttons in a fixed-position container
- Position at bottom of viewport
- Add padding to main content area so it doesn't hide behind fixed bar
- Ensure proper z-index layering

---

### Task 3: Mobile Keyboard Handling (Android Chrome)

**Problem:** Keyboard opens above input bar, making it hard to type

**Files:**
- `src/pages/IdeaDetailPage.tsx`

**Changes:**
- Use `visualViewport` API to detect keyboard open/close
- When keyboard opens, adjust bottom bar position or scroll input into view
- Focus on Android Chrome behavior (Safari not required)

---

### Task 4: Voice Input in Chat

**Problem:** Can only type in chat, want voice option

**Files:**
- `src/pages/IdeaDetailPage.tsx` (ChatView component)
- `src/lib/api.ts` (may need transcribe endpoint)

**Changes:**
- Add mic icon to left of input bar
- Tap to start recording (icon turns red, glows)
- Tap again to stop recording
- Send audio to Whisper API for transcription
- Append transcribed text to current input (don't replace)
- Can record multiple times, each appends

**API:** Use existing `/api/transcribe` endpoint (Whisper)

---

### Task 5: Analysis Regeneration on Exit Only

**Problem:** Currently regenerates on every Chat→Analysis tab switch, wasteful

**Files:**
- `src/pages/IdeaDetailPage.tsx`

**Changes:**
- Remove tab-switch trigger for regeneration
- Add regeneration call when user exits idea (handleBack or navigation away)
- Only regenerate if there are new chat messages since last analysis
- Show brief "Updating analysis..." when exiting if needed

---

### Task 6: View Analysis Modal in Chat

**Problem:** Can't see analysis while chatting, forces unnecessary tab switching

**Files:**
- `src/pages/IdeaDetailPage.tsx`
- `src/styles/app.css`

**Changes:**
- Add small "View Analysis" button/icon near top of chat view (below tabs)
- Tapping opens a scrollable modal overlay
- Modal shows current analysis content (same markdown rendering)
- Close button or tap outside to dismiss
- Returns to chat view

---

### Task 7: Simplified Capture Flow

**Problem:** Current flow (tap → modal → choose voice/text → record) is too many steps

**Files:**
- `src/pages/HomePage.tsx`
- `src/components/CaptureModal.tsx` (may rename or restructure)
- `src/styles/app.css`

**New Flow:**
1. User taps "Capture Idea" button on home page
2. Button transforms into mic icon (red glow indicates recording)
3. Recording starts immediately
4. User taps mic again to stop
5. Review screen appears showing transcript
6. Options: Continue (record more, appends), Save, Edit (text correction)
7. Save creates the idea and returns to home

**Changes:**
- Modify HomePage to handle recording state
- Transform capture button to mic icon during recording
- Create review screen/modal for transcript
- Add Continue/Save/Edit buttons
- Edit opens text input for corrections
- Remove text-only capture option (voice-first)

---

## Implementation Order

1. Task 1: Global overflow fix (quick CSS)
2. Task 2 + 3: Sticky bottom bar + keyboard handling (related)
3. Task 5 + 6: Exit-only regeneration + View Analysis modal (related UX)
4. Task 4: Voice input in chat
5. Task 7: Simplified capture flow (biggest change)

---

## Success Criteria

- [ ] No horizontal scroll anywhere in app
- [ ] Bottom bar stays fixed when scrolling
- [ ] Keyboard pushes input into view on Android Chrome
- [ ] Can voice-record messages in chat
- [ ] Analysis only updates when exiting idea (not on tab switch)
- [ ] Can view analysis from within chat via modal
- [ ] One-tap capture starts recording immediately
- [ ] Can review, edit, continue, or save transcript

---

*Ready for implementation.*
