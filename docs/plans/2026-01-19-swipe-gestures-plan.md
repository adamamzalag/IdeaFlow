# Swipe Gestures Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add swipe gestures and browser history to make the app feel native on mobile.

**Architecture:** Browser history integration for OS back gesture support, plus a reusable SwipeableTabs component for horizontal tab swiping. Edge swipe (from left 20px) triggers back navigation on detail page.

**Tech Stack:** Framer Motion (drag gestures), History API (pushState/popstate)

---

## Task 1: Browser History Integration

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add history push on navigate to detail**

In `handleSelectIdea`, after setting state, push history:

```tsx
const handleSelectIdea = async (idea: Idea) => {
  try {
    const fullIdea = await getIdea(idea.id)
    setSelectedIdea(fullIdea)
    setView('detail')
    // Push history entry for browser back support
    history.pushState({ view: 'detail', ideaId: idea.id }, '', `/idea/${idea.id}`)
  } catch (err) {
    alert('Failed to load idea details.')
    console.error(err)
  }
}
```

**Step 2: Add history push on navigate back**

In `handleBack`, push history for home:

```tsx
const handleBack = async () => {
  setView('home')
  setSelectedIdea(null)
  // Push history entry for home
  history.pushState({ view: 'home' }, '', '/')
  // Refetch ideas to update viewed status
  try {
    const fetchedIdeas = await getIdeas()
    setIdeas(fetchedIdeas)
  } catch (err) {
    console.error('Failed to refresh ideas:', err)
  }
}
```

**Step 3: Add popstate listener for browser/OS back**

Add useEffect after the existing `loadIdeas` effect:

```tsx
// Handle browser/OS back gesture
useEffect(() => {
  const handlePopState = (event: PopStateEvent) => {
    const state = event.state
    if (state?.view === 'detail' && state?.ideaId) {
      // Forward navigation to detail
      const idea = ideas.find(i => i.id === state.ideaId)
      if (idea) {
        getIdea(idea.id).then(fullIdea => {
          setSelectedIdea(fullIdea)
          setView('detail')
        }).catch(console.error)
      }
    } else {
      // Back to home
      setView('home')
      setSelectedIdea(null)
    }
  }

  window.addEventListener('popstate', handlePopState)
  return () => window.removeEventListener('popstate', handlePopState)
}, [ideas])
```

**Step 4: Add initial history state on mount**

Add to the `loadIdeas` effect, after setting ideas:

```tsx
useEffect(() => {
  async function loadIdeas() {
    try {
      setLoading(true)
      const fetchedIdeas = await getIdeas()
      setIdeas(fetchedIdeas)
      setError(null)
      // Set initial history state
      if (!history.state) {
        history.replaceState({ view: 'home' }, '', '/')
      }
    } catch (err) {
      setError('Failed to load ideas. Please refresh.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  loadIdeas()
}, [])
```

**Step 5: Test browser back**

1. Open app on phone
2. Tap an idea to go to detail
3. Use OS back gesture (Android swipe from edge, iOS Safari back)
4. Should return to home, not close browser

**Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add browser history for native back gesture support"
```

---

## Task 2: Create SwipeableTabs Component

**Files:**
- Create: `src/components/SwipeableTabs.tsx`

**Step 1: Create the component file**

```tsx
import { useState, useRef, ReactNode } from 'react'
import { motion, useAnimation, PanInfo } from 'framer-motion'

interface SwipeableTabsProps {
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  onEdgeSwipeLeft?: () => void
  children: ReactNode
}

const EDGE_ZONE = 20 // pixels from left edge
const SWIPE_THRESHOLD = 0.3 // 30% of width
const VELOCITY_THRESHOLD = 500 // px/s

export function SwipeableTabs({
  tabs,
  activeTab,
  onTabChange,
  onEdgeSwipeLeft,
  children
}: SwipeableTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const isEdgeSwipe = useRef(false)

  const currentIndex = tabs.indexOf(activeTab)
  const isFirstTab = currentIndex === 0
  const isLastTab = currentIndex === tabs.length - 1

  const handleDragStart = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(true)

    // Get the starting X position relative to viewport
    const clientX = 'touches' in event
      ? (event as TouchEvent).touches[0].clientX
      : (event as MouseEvent).clientX

    dragStartX.current = clientX
    isEdgeSwipe.current = clientX <= EDGE_ZONE && isFirstTab && !!onEdgeSwipeLeft
  }

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false)

    const containerWidth = containerRef.current?.offsetWidth || 300
    const offset = info.offset.x
    const velocity = info.velocity.x

    // Check for edge swipe back
    if (isEdgeSwipe.current && offset > containerWidth * SWIPE_THRESHOLD) {
      onEdgeSwipeLeft?.()
      return
    }

    // Determine if swipe should change tabs
    const swipedPastThreshold = Math.abs(offset) > containerWidth * SWIPE_THRESHOLD
    const fastSwipe = Math.abs(velocity) > VELOCITY_THRESHOLD

    if (swipedPastThreshold || fastSwipe) {
      if (offset > 0 && !isFirstTab) {
        // Swipe right - go to previous tab
        onTabChange(tabs[currentIndex - 1])
      } else if (offset < 0 && !isLastTab) {
        // Swipe left - go to next tab
        onTabChange(tabs[currentIndex + 1])
      }
    }

    // Snap back to position
    controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } })
  }

  const handleDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // Apply rubber-band effect at edges
    const offset = info.offset.x
    let resistance = 1

    if ((offset > 0 && isFirstTab && !isEdgeSwipe.current) ||
        (offset < 0 && isLastTab)) {
      resistance = 0.3 // Rubber-band feel
    }

    controls.set({ x: offset * resistance })
  }

  return (
    <div ref={containerRef} style={{ overflow: 'hidden', flex: 1 }}>
      <motion.div
        drag="x"
        dragDirectionLock
        dragElastic={0}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{
          height: '100%',
          touchAction: 'pan-y'
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
```

**Step 2: Test component renders**

We'll test integration in the next tasks.

**Step 3: Commit**

```bash
git add src/components/SwipeableTabs.tsx
git commit -m "feat: add SwipeableTabs component for horizontal swipe gestures"
```

---

## Task 3: Integrate SwipeableTabs into IdeaDetailPage

**Files:**
- Modify: `src/pages/IdeaDetailPage.tsx`

**Step 1: Import SwipeableTabs**

Add import at top:

```tsx
import { SwipeableTabs } from '../components/SwipeableTabs'
```

**Step 2: Wrap content area with SwipeableTabs**

Replace the `<div className="detail-content">` section (lines ~305-349) with:

```tsx
{/* Content - Swipeable */}
<SwipeableTabs
  tabs={['analysis', 'chat']}
  activeTab={activeTab}
  onTabChange={(tab) => handleTabChange(tab as DetailTab)}
  onEdgeSwipeLeft={handleBack}
>
  <div className="detail-content">
    <AnimatePresence mode="wait">
      {activeTab === 'analysis' ? (
        <motion.div
          key="analysis"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <AnalysisView
            idea={idea}
            showTranscript={showTranscript}
            onToggleTranscript={() => setShowTranscript(!showTranscript)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          className="chat-view"
        >
          {idea.analysis && (
            <button
              className="view-analysis-btn"
              onClick={() => setShowAnalysisModal(true)}
            >
              <Eye size={14} />
              View Analysis
            </button>
          )}
          <ChatMessagesView
            messages={messages}
            messagesEndRef={messagesEndRef}
            isLoading={loadingMessages}
            isSending={isSending}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</SwipeableTabs>
```

**Step 3: Test on device**

1. Open an idea on phone
2. Swipe left/right on content area
3. Should switch between Analysis and Chat tabs
4. Swipe from left edge (first 20px) should go back to home

**Step 4: Commit**

```bash
git add src/pages/IdeaDetailPage.tsx
git commit -m "feat: add swipe gestures to detail page tabs"
```

---

## Task 4: Integrate SwipeableTabs into HomePage

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Step 1: Import SwipeableTabs**

Add import at top:

```tsx
import { SwipeableTabs } from '../components/SwipeableTabs'
```

**Step 2: Wrap ideas list with SwipeableTabs**

Find the section after the tabs div and before the capture FAB (around line 300-324). Wrap the content:

```tsx
<SwipeableTabs
  tabs={['active', 'pursuing', 'deferred']}
  activeTab={activeTab}
  onTabChange={(tab) => onTabChange(tab as TabType)}
>
  {filteredIdeas.length === 0 ? (
    <EmptyState tab={activeTab} />
  ) : (
    <motion.div
      className="ideas-list"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.03
          }
        }
      }}
    >
      {filteredIdeas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          onClick={() => onSelectIdea(idea)}
        />
      ))}
    </motion.div>
  )}
</SwipeableTabs>
```

**Step 3: Test on device**

1. Open app on phone
2. On home screen, swipe left/right
3. Should switch between Active, Pursuing, and Deferred tabs
4. Rubber-band effect at first and last tabs

**Step 4: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: add swipe gestures to home page tabs"
```

---

## Task 5: Polish and Edge Cases

**Files:**
- Modify: `src/components/SwipeableTabs.tsx`

**Step 1: Prevent swipe while scrolling vertically**

The `dragDirectionLock` prop should handle this, but verify on device. If vertical scroll conflicts with horizontal swipe, we may need to add a drag constraint or delay.

**Step 2: Test edge cases**

- Fast flick vs slow drag
- Starting swipe mid-screen vs edge
- Swipe while content is scrolling
- Multiple rapid swipes

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: swipe gestures polish and edge cases"
```

---

## Task 6: Update Documentation

**Files:**
- Modify: `docs/CHANGELOG.md`
- Modify: `CLAUDE.md`

**Step 1: Update CHANGELOG**

Add under v0.4.6 (or increment current version):

```markdown
## v0.4.6 - Swipe Gestures (January 19, 2026)

### Added
- **Browser history integration** - OS/browser back gesture now works (Android swipe, iOS Safari back, browser back button)
- **Tab swipe gestures** - Swipe left/right to switch tabs on both HomePage and IdeaDetailPage
- **Edge swipe back** - Swipe from left edge (~20px) on detail page to go back to home

### Technical
- New `SwipeableTabs` component using Framer Motion drag gestures
- URLs now reflect current view (`/` for home, `/idea/{id}` for detail)
```

**Step 2: Update CLAUDE.md version**

Update version number and "last updated" date.

**Step 3: Commit**

```bash
git add docs/CHANGELOG.md CLAUDE.md
git commit -m "docs: update changelog for swipe gestures"
```

---

## Task 7: Push and Test on Replit

**Step 1: Push to GitHub**

```bash
git push
```

**Step 2: Sync Replit and test**

Test checklist:
- [ ] Browser back button works
- [ ] Android back gesture works
- [ ] iOS Safari edge swipe works
- [ ] Tab swipe on HomePage (3 tabs)
- [ ] Tab swipe on IdeaDetailPage (2 tabs)
- [ ] Edge swipe back on detail page
- [ ] URLs update correctly
- [ ] Deep linking works (paste URL, loads correct view)

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Browser history integration | App.tsx |
| 2 | Create SwipeableTabs component | SwipeableTabs.tsx (new) |
| 3 | Integrate into IdeaDetailPage | IdeaDetailPage.tsx |
| 4 | Integrate into HomePage | HomePage.tsx |
| 5 | Polish and edge cases | SwipeableTabs.tsx |
| 6 | Update documentation | CHANGELOG.md, CLAUDE.md |
| 7 | Push and test | - |

**Estimated commits:** 7
