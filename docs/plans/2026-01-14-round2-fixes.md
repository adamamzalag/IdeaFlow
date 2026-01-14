# Round 2 Fixes - Implementation Plan

**Date:** January 14, 2026
**Status:** Ready for implementation

---

## Issues to Fix

| Priority | Issue | Root Cause |
|----------|-------|------------|
| 1 | B - Layout overflow throughout detail page | Missing CSS constraints on multiple elements |
| 2 | C - Can't undo Pursue/Defer | No toggle behavior on buttons |
| 3 | A - Keyboard covers edit textarea in review modal | Keyboard offset not applied to review modal |

---

## Issue B: Comprehensive Layout Overflow Fix

### Root Cause Analysis

The detail page has overflow issues in multiple areas because:
1. **Missing `box-sizing: border-box`** - Elements with padding exceed container width
2. **Missing `min-width: 0` on flex items** - Flex children can't shrink below content size
3. **Missing text overflow handling** - Long words/URLs break out of containers

### Fix Strategy: Global + Targeted

Rather than patching each element individually, apply fixes at multiple levels:

**Layer 1: Global Defaults**
- Ensure `box-sizing: border-box` applies to all elements
- Add defensive overflow handling to common patterns

**Layer 2: Flex Item Pattern**
- All flex children that need to shrink get `min-width: 0`

**Layer 3: Text Container Pattern**
- All text containers get word-wrap properties

**Layer 4: Specific Fixes**
- Any remaining element-specific issues

---

### Implementation

**File:** `src/styles/design-system.css`

#### Step 1: Verify/Add Global Box-Sizing

Check if this exists, add if not:

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

---

**File:** `src/styles/app.css`

#### Step 2: Detail Page Container Fixes

```css
/* Ensure page container constrains all children */
.detail-page {
  /* existing styles... */
  overflow-x: hidden; /* Catch any overflow */
}

/* Header must respect container width */
.detail-header {
  /* existing styles... */
  max-width: 100%;
  box-sizing: border-box;
}

/* Tabs container */
.detail-tabs {
  /* existing styles... */
  max-width: 100%;
  box-sizing: border-box;
}

/* Individual tabs need flex shrink support */
.detail-tab {
  /* existing styles... */
  min-width: 0; /* Allow shrinking below content */
  overflow: hidden;
  text-overflow: ellipsis;
}
```

#### Step 3: Content Area Fixes

```css
/* Analysis document */
.analysis-document {
  /* existing styles... */
  overflow-wrap: break-word;
  word-wrap: break-word;
}

/* Transcript content */
.transcript-content {
  /* existing styles... */
  max-width: 100%;
  word-break: break-word;
}

/* Markdown pre blocks */
.markdown-content pre {
  /* existing styles... */
  max-width: 100%;
}

/* Markdown lists - reduce padding on mobile */
.markdown-content ul,
.markdown-content ol {
  /* existing styles... */
  max-width: 100%;
  padding-left: var(--space-4); /* Reduce from space-5 */
}
```

#### Step 4: Chat Area Fixes

```css
/* Chat messages */
.chat-message {
  /* existing styles... */
  min-width: 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  box-sizing: border-box;
}

/* Chat input wrapper */
.chat-input-wrapper {
  /* existing styles... */
  max-width: 100%;
  box-sizing: border-box;
}

/* Chat input textarea */
.chat-input {
  /* existing styles... */
  min-width: 0;
  box-sizing: border-box;
}
```

#### Step 5: Bottom Bar & Action Buttons

```css
/* Bottom bar */
.detail-bottom-bar {
  /* existing styles... */
  box-sizing: border-box;
}

/* Footer actions container */
.detail-footer-actions {
  /* existing styles... */
  max-width: 100%;
  box-sizing: border-box;
}

/* Action buttons */
.action-btn {
  /* existing styles... */
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

#### Step 6: Modal Fixes

```css
/* Analysis modal */
.analysis-modal {
  /* existing styles... */
  box-sizing: border-box;
}

.analysis-modal-header {
  /* existing styles... */
  box-sizing: border-box;
}

.analysis-modal-header h3 {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-modal-content {
  /* existing styles... */
  box-sizing: border-box;
  width: 100%;
}
```

---

### Verification Checklist

After implementing, test these scenarios:

- [ ] New idea in processing state (no analysis yet) - layout should not overflow
- [ ] New idea with analysis - layout correct
- [ ] Old idea from Active tab - layout correct
- [ ] Idea in Pursuing tab - layout correct
- [ ] Idea in Deferred tab - layout correct
- [ ] Very long idea title - truncates, doesn't overflow
- [ ] Long message in chat - wraps, doesn't overflow
- [ ] Long URL in analysis - wraps or scrolls, doesn't break layout
- [ ] Code block in analysis - horizontal scroll works, doesn't break page
- [ ] View Analysis modal - fits screen, content scrolls

---

## Issue C: Toggle Pursue/Defer Buttons

### Current Behavior
- Tapping "Pursue" moves idea to pursuing status
- No way to undo from detail page

### Desired Behavior
- Buttons work as toggles
- Tapping "Pursue" on a pursuing idea moves it back to "ready"
- Visual indication of current state

### Implementation

**File:** `src/pages/IdeaDetailPage.tsx`

#### Step 1: Update Status Change Handlers

```typescript
const handlePursue = async () => {
  const newStatus = idea.status === 'pursuing' ? 'ready' : 'pursuing'
  try {
    await onStatusChange(newStatus)
    // Update local state if needed
  } catch (err) {
    console.error('Failed to update status:', err)
  }
}

const handleDefer = async () => {
  const newStatus = idea.status === 'deferred' ? 'ready' : 'deferred'
  try {
    await onStatusChange(newStatus)
  } catch (err) {
    console.error('Failed to update status:', err)
  }
}
```

#### Step 2: Update Button Rendering

```tsx
{keyboardOffset === 0 && (
  <div className="detail-footer-actions">
    <button
      className={`action-btn defer ${idea.status === 'deferred' ? 'active' : ''}`}
      onClick={handleDefer}
    >
      {idea.status === 'deferred' ? 'Deferred ✓' : 'Defer'}
    </button>
    <button
      className={`action-btn pursue ${idea.status === 'pursuing' ? 'active' : ''}`}
      onClick={handlePursue}
    >
      {idea.status === 'pursuing' ? 'Pursuing ✓' : 'Pursue'}
    </button>
  </div>
)}
```

#### Step 3: Show Buttons for All Statuses

Currently buttons only show for `ready` or `processing` status. Update to show for all statuses so user can always toggle:

```tsx
{keyboardOffset === 0 && idea.status !== 'processing' && (
  <div className="detail-footer-actions">
    {/* buttons */}
  </div>
)}
```

**File:** `src/styles/app.css`

#### Step 4: Add Active Button Style

```css
.action-btn.active {
  background: var(--color-accent);
  color: var(--color-bg);
  border-color: var(--color-accent);
}

.action-btn.active:hover {
  background: var(--color-accent-hover);
}
```

---

### Verification

- [ ] View ready idea → Pursue and Defer buttons show normally
- [ ] Tap Pursue → Idea moves to pursuing, button shows "Pursuing ✓" highlighted
- [ ] Tap Pursue again → Idea moves back to ready, button shows "Pursue" normal
- [ ] Same behavior for Defer
- [ ] Buttons hidden during processing status
- [ ] Buttons hidden when keyboard is open

---

## Issue A: Keyboard in Review Modal

### Problem
When editing transcript in the review modal on HomePage, keyboard covers the textarea.

### Implementation

**File:** `src/pages/HomePage.tsx`

#### Step 1: Add Keyboard Detection Hook

```typescript
// Add near top of component
const [reviewKeyboardOffset, setReviewKeyboardOffset] = useState(0)

useEffect(() => {
  const viewport = window.visualViewport
  if (!viewport) return

  const handleResize = () => {
    const offset = window.innerHeight - viewport.height
    setReviewKeyboardOffset(offset > 0 ? offset : 0)
  }

  viewport.addEventListener('resize', handleResize)
  viewport.addEventListener('scroll', handleResize)

  return () => {
    viewport.removeEventListener('resize', handleResize)
    viewport.removeEventListener('scroll', handleResize)
  }
}, [])
```

#### Step 2: Apply Offset to Review Modal

When in edit mode and keyboard is open, adjust the modal content:

```tsx
<motion.div
  className="review-screen"
  style={{
    paddingBottom: isEditing && reviewKeyboardOffset > 0
      ? `${reviewKeyboardOffset + 20}px`
      : undefined
  }}
>
  {/* modal content */}
</motion.div>
```

Or alternatively, scroll the textarea into view when focused:

```typescript
const textareaRef = useRef<HTMLTextAreaElement>(null)

const handleEditFocus = () => {
  setTimeout(() => {
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 300) // Wait for keyboard animation
}
```

---

### Verification

- [ ] Open review modal after recording
- [ ] Tap "Edit" to enter edit mode
- [ ] Tap textarea to open keyboard
- [ ] Textarea should be visible above keyboard
- [ ] Can type and see what's being typed

---

## Implementation Order

1. **Issue B (CSS overflow)** - Apply all CSS fixes first
2. **Issue C (Toggle buttons)** - UI behavior change
3. **Issue A (Keyboard in modal)** - Targeted fix

---

## Deferred Items

- **Issue D** - Browser swipe back gesture (needs routing/history management)
- **Design help for chat layout** - After these fixes are verified

---

*Ready for implementation.*
