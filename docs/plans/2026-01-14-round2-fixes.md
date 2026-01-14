# Round 2 Fixes - Status Update

**Date:** January 14, 2026
**Status:** ALL ISSUES FIXED ✓

---

## Completed Fixes

### Issue A: Keyboard in Review Modal - FIXED
- Used `scrollIntoView({ behavior: 'smooth', block: 'center' })` on textarea focus
- 300ms delay to wait for keyboard animation

### Issue B: CSS Layout Overflow - FIXED
- **Root cause:** `max-width` without explicit `width` allowed content to expand page beyond viewport
- **Key insight:** On a ~450px viewport (Pixel 10 Pro XL), long titles could expand page toward 480px max-width, causing ~30px of content to be clipped
- **Solution:**
  - Added `width: 100%` to `.detail-page` and `.detail-header`
  - Changed `100vw` to `100%` on html/body (100vw includes scrollbar width)
  - Removed x-transform from detail page animation (was causing "restructuring" effect)
  - Added `overflow: hidden` to `.detail-header-top`
- **Bonus fix:** Added `interactive-widget=resizes-content` to viewport meta tag (prevents keyboard scroll void on Android)

### Issue C: Toggle Pursue/Defer Buttons - FIXED
- Added `localStatus` state for optimistic UI updates
- Both buttons start neutral (secondary styling)
- Defer selected → red (`active-defer` class)
- Pursue selected → orange (`active-pursue` class)
- State updates immediately on click
- Also fixed: Analysis disappearing bug (status update was replacing entire idea object, losing analysis)

---

## Issue B Investigation Notes (Historical)

### The Problem

The detail page has layout overflow issues, but **only under specific conditions**:

1. **Broken layout when:** Viewing an idea that has NO analysis yet (processing state, or old ideas without AI-generated title)
2. **Correct layout when:** Viewing an idea that HAS analysis with markdown content
3. **Layout shift:** When loading ideas, there's visible layout shift that wasn't there before

### Observed Symptoms

**When opening idea WITHOUT analysis:**
- Header extends beyond viewport to the right
- "Analysis" and "Chat" tabs extend beyond viewport
- Title area overflows
- Content area broken
- Only Defer/Pursue buttons at bottom look correct
- Cannot scroll horizontally to see cut-off content (overflow-x: hidden masks it)

**When opening idea WITH analysis:**
- Everything looks perfect
- Header, tabs, title, content all fit within viewport
- Markdown renders nicely

**Old ideas (recorded before AI titles were added):**
- Completely broken layout
- Long raw-input title (not truncated) may be contributing
- All elements cut off to the right

### What We Tried (CSS fixes that didn't work)

Added to `app.css`:
- `overflow-x: hidden` on `.detail-page` - masks problem, doesn't fix
- `max-width: 100%` and `box-sizing: border-box` on many elements
- `min-width: 0` on flex items
- `overflow: hidden` and `text-overflow: ellipsis` on various elements

These changes may have introduced the layout shift issue.

### Key Mystery

**Why does the presence of markdown content in the analysis area affect elements OUTSIDE the content area (header, tabs)?**

The structure is:
```
.detail-page (flex column)
  .detail-header (contains title, back button)
    .detail-tabs (Analysis/Chat buttons)
  .detail-content (contains analysis/chat, flex: 1)
  .detail-bottom-bar (fixed position, Pursue/Defer)
```

The header and tabs are SIBLINGS of the content area, not children. So how can empty vs filled content affect them?

### Hypotheses to Investigate

1. **Flex behavior with empty content:** When `.detail-content` is empty (no analysis), flex layout might behave differently, allowing other flex items to expand unexpectedly

2. **Title truncation not working:** The `.detail-title` has `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%` but maybe the parent chain doesn't have proper width constraints

3. **Something in the parent chain:** Maybe `.detail-header-top` or `.detail-title-area` is expanding when it shouldn't

4. **CSS specificity issue:** Some rule might be overriding our constraints under certain conditions

### Files to Investigate

- `src/styles/app.css` - Main styles, lines 710-860 (detail page section)
- `src/styles/design-system.css` - Global resets and base styles
- `src/pages/IdeaDetailPage.tsx` - Component structure

### Debug Approach for Next Session

1. **Use browser dev tools** to inspect which specific element is wider than viewport
2. **Check computed styles** on header, tabs when viewing broken vs working idea
3. **Add temporary borders** to visualize element boundaries
4. **Compare flex behavior** with content present vs absent
5. **Check if removing recent CSS changes** restores correct (but overflowing) behavior

### CSS Changes Made (may need to revert)

In `app.css`, added to these selectors:
- `.detail-page`: `overflow-x: hidden`
- `.detail-header`: `max-width: 100%; box-sizing: border-box`
- `.detail-tabs`: `max-width: 100%; box-sizing: border-box`
- `.detail-tab`: `min-width: 0; overflow: hidden; text-overflow: ellipsis`
- `.transcript-content`: `word-break: break-word; max-width: 100%; box-sizing: border-box`
- `.markdown-content pre`: `max-width: 100%; box-sizing: border-box`
- `.markdown-content ul/ol`: `padding-left: var(--space-4); max-width: 100%; box-sizing: border-box`
- `.chat-message`: `min-width: 0; box-sizing: border-box`
- `.chat-input-wrapper`: `max-width: 100%; box-sizing: border-box`
- `.chat-input`: `min-width: 0; box-sizing: border-box`
- `.detail-bottom-bar`: `box-sizing: border-box`
- `.detail-footer-actions`: `max-width: 100%; box-sizing: border-box`
- `.action-btn`: `min-width: 0; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- `.analysis-modal`: `box-sizing: border-box`
- `.analysis-modal-header`: `box-sizing: border-box`
- `.analysis-modal-header h3`: `min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- `.analysis-modal-content`: `box-sizing: border-box; width: 100%`

---

## Deferred Items

- **Issue D** - Browser swipe back gesture (needs routing/history management)
- **Design help for chat layout** - Can proceed now that Issue B is fixed

---

*Last updated: January 14, 2026 - All round 2 issues resolved*
