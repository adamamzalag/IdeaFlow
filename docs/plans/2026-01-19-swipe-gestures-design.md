# Swipe Gestures Design

**Date:** January 19, 2026
**Status:** Approved

## Overview

Add swipe gestures and browser history integration to make the app feel native on mobile.

## Features

| Feature | Where | Behavior |
|---------|-------|----------|
| Browser history | App-wide | URLs update on navigation, OS/browser back works |
| Tab swipe | HomePage | Swipe between Active/Pursuing/Deferred |
| Tab swipe | IdeaDetailPage | Swipe between Analysis/Chat |
| Edge back swipe | IdeaDetailPage | Swipe from left edge (~20px) to go home |

## Architecture

### Reusable SwipeableTabs Component

```
SwipeableTabs
├── Props: tabs[], activeTab, onTabChange, onEdgeSwipeLeft?
├── Handles swipe detection and snap logic
└── Renders children with swipe behavior
```

Usage:
```tsx
// HomePage - 3 tabs
<SwipeableTabs
  tabs={['active', 'pursuing', 'deferred']}
  activeTab={activeTab}
  onTabChange={setActiveTab}
>
  {/* Ideas list content */}
</SwipeableTabs>

// IdeaDetailPage - 2 tabs
<SwipeableTabs
  tabs={['analysis', 'chat']}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  onEdgeSwipeLeft={handleBack}
>
  {/* Tab content */}
</SwipeableTabs>
```

### Browser History Integration

On navigate to detail:
- `history.pushState({ view: 'detail', ideaId }, '', '/idea/{id}')`

On navigate back:
- `history.pushState({ view: 'home' }, '', '/')`

Listen for `popstate` event to handle browser/OS back gestures.

## Gesture Detection

### Thresholds

| Trigger | Value | Reasoning |
|---------|-------|-----------|
| Edge zone | 20px from left | Standard iOS pattern |
| Swipe distance | 30% of container width | Feels intentional |
| Velocity threshold | 500px/s | Quick flick works even if short |
| Rubber-band resistance | 0.3 | Edge tabs feel "sticky" |

### Decision Flow

```
1. Edge swipe + first tab + has onEdgeSwipeLeft?
   → Trigger back navigation

2. Crossed 30% threshold OR velocity > 500px/s?
   → Switch to next/previous tab

3. Neither?
   → Snap back to current tab
```

### Animation

- Tab switch: 0.3s spring (`stiffness: 300, damping: 30`)
- Rubber-band return: 0.2s ease-out
- Back navigation: Existing 0.3s fade

## URL Structure

| View | URL |
|------|-----|
| Home | `/` |
| Detail | `/idea/{uuid}` |

Enables deep linking - users can bookmark/share idea URLs.

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | History pushState, popstate listener, deep link on load |
| `src/pages/HomePage.tsx` | Wrap content with SwipeableTabs |
| `src/pages/IdeaDetailPage.tsx` | Wrap content with SwipeableTabs, add onEdgeSwipeLeft |
| `src/components/SwipeableTabs.tsx` | New component |

## What Stays the Same

- Back button (kept for discoverability)
- Tab buttons (swipe is additive)
- Existing animations
- All other functionality

## Technical Notes

- Uses Framer Motion `drag="x"` with constraints
- Content follows finger 1:1 during drag
- Spring physics for natural snap feel
- Edge detection via `onDragStart` event coordinates
