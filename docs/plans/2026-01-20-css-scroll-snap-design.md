# CSS Scroll Snap for Tab Swiping

**Date:** 2026-01-20
**Status:** Approved

## Problem

Framer Motion's `drag` API conflicts with native scroll on mobile:
- `touch-action: none` = swipe works, scroll breaks
- `touch-action: pan-y` = scroll works, swipe breaks

This is a fundamental browser limitation, not fixable with CSS tweaks.

## Solution

Replace Framer Motion drag with CSS Scroll Snap - a native browser feature that handles both scroll and snap without conflict.

## Design

### New SwipeableTabs Component

**Structure:**
```
SwipeableTabs (container)
└── scroll-snap-container (horizontal scroll)
    ├── Panel 1 (100% width, snap-align)
    ├── Panel 2 (100% width, snap-align)
    └── Panel 3 (100% width, snap-align)
```

**Props (unchanged):**
- `activeTab: string` - currently selected tab
- `onTabChange: (tab: string) => void` - callback when tab changes
- `children: ReactNode` - tab panels (each needs `data-tab` attribute)

**Behavior:**
- All panels rendered horizontally
- Browser handles swipe-to-scroll natively
- Scroll snaps to panel boundaries
- On scroll end, detect visible panel and call `onTabChange`
- When `activeTab` prop changes, scroll to that panel programmatically

### CSS

```css
.swipe-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.swipe-container::-webkit-scrollbar {
  display: none;
}

.swipe-panel {
  flex: 0 0 100%;
  scroll-snap-align: start;
  overflow-y: auto;
}
```

### Usage Pattern

```tsx
<SwipeableTabs activeTab={activeTab} onTabChange={setActiveTab}>
  <div data-tab="active" className="swipe-panel">
    {/* Active content */}
  </div>
  <div data-tab="pursuing" className="swipe-panel">
    {/* Pursuing content */}
  </div>
  <div data-tab="deferred" className="swipe-panel">
    {/* Deferred content */}
  </div>
</SwipeableTabs>
```

### Tab Sync Logic

Scroll position calculation:
```ts
const panelIndex = Math.round(scrollLeft / containerWidth)
const tabId = children[panelIndex].dataset.tab
onTabChange(tabId)
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/SwipeableTabs.tsx` | Rewrite with scroll-snap |
| `src/pages/HomePage.tsx` | Pass all 3 panels as children |
| `src/pages/IdeaDetailPage.tsx` | Pass both panels as children |
| `src/styles/app.css` | Add scroll-snap classes |

## What We Lose

- Spring "bounce" animation on release
- Rubber-band effect at edges (browser has subtle native version)
- Framer Motion drag callbacks

## What We Gain

- Scroll and swipe work together
- Better performance (native browser code)
- Less JavaScript complexity
- Works reliably on all mobile browsers

## Impact

- Framer Motion remains for other animations (modals, cards)
- No backend changes
- No changes to other components
