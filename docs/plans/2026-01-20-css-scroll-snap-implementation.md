# CSS Scroll Snap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Framer Motion drag gestures with CSS Scroll Snap to fix the scroll/swipe conflict on mobile.

**Architecture:** All tab panels render side-by-side in a horizontal scroll container. CSS `scroll-snap-type: x mandatory` handles snapping. JavaScript detects scroll position changes to sync the tab indicator.

**Tech Stack:** React, CSS Scroll Snap, TypeScript

---

## Task 1: Add CSS Scroll Snap Classes

**Files:**
- Modify: `src/styles/app.css` (add at end of file)

**Step 1: Add the scroll-snap CSS classes**

Add these classes at the end of `src/styles/app.css`:

```css
/* ============================================
   SWIPEABLE TABS - CSS Scroll Snap
   ============================================ */

.swipe-container {
  flex: 1;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Firefox */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

.swipe-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}

.swipe-panel {
  flex: 0 0 100%;
  min-width: 100%;
  overflow-y: auto;
  scroll-snap-align: start;
}
```

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors (CSS-only change)

**Step 3: Commit**

```bash
git add src/styles/app.css
git commit -m "style: add CSS scroll-snap classes for swipeable tabs"
```

---

## Task 2: Rewrite SwipeableTabs Component

**Files:**
- Modify: `src/components/SwipeableTabs.tsx` (complete rewrite)

**Step 1: Replace the entire SwipeableTabs component**

Replace the entire contents of `src/components/SwipeableTabs.tsx` with:

```tsx
import { useRef, useEffect, Children, ReactNode, ReactElement } from 'react'

interface SwipeableTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  children: ReactNode
}

export function SwipeableTabs({
  activeTab,
  onTabChange,
  children
}: SwipeableTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<number | null>(null)

  // Convert children to array and extract tab IDs
  const panels = Children.toArray(children) as ReactElement[]
  const tabIds = panels.map(panel => panel.props['data-tab'] as string)
  const activeIndex = tabIds.indexOf(activeTab)

  // Scroll to active tab when activeTab prop changes (e.g., from tab button click)
  useEffect(() => {
    const container = containerRef.current
    if (!container || activeIndex < 0) return

    const targetScroll = activeIndex * container.offsetWidth

    // Only scroll if not already at the right position
    if (Math.abs(container.scrollLeft - targetScroll) > 10) {
      isScrollingRef.current = true
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })

      // Reset flag after scroll animation completes
      setTimeout(() => {
        isScrollingRef.current = false
      }, 300)
    }
  }, [activeTab, activeIndex])

  // Detect scroll end and update active tab
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // Clear any pending timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Wait for scroll to settle before updating tab
      scrollTimeoutRef.current = window.setTimeout(() => {
        // Don't update if this was a programmatic scroll
        if (isScrollingRef.current) return

        const containerWidth = container.offsetWidth
        const scrollLeft = container.scrollLeft
        const newIndex = Math.round(scrollLeft / containerWidth)

        if (newIndex >= 0 && newIndex < tabIds.length) {
          const newTab = tabIds[newIndex]
          if (newTab !== activeTab) {
            onTabChange(newTab)
          }
        }
      }, 50)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [activeTab, tabIds, onTabChange])

  return (
    <div ref={containerRef} className="swipe-container">
      {children}
    </div>
  )
}
```

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no type errors)

**Step 3: Commit**

```bash
git add src/components/SwipeableTabs.tsx
git commit -m "refactor: rewrite SwipeableTabs with CSS scroll-snap"
```

---

## Task 3: Update HomePage to Pass All Panels

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Step 1: Update the SwipeableTabs usage**

Find this section (around line 301-332):

```tsx
<SwipeableTabs
  tabs={['active', 'pursuing', 'deferred']}
  activeTab={activeTab}
  onTabChange={(tab) => onTabChange(tab as TabType)}
>
  <div className="home-scroll">
    {filteredIdeas.length === 0 ? (
      <EmptyState tab={activeTab} />
    ) : (
      <motion.div
        className="ideas-list"
        ...
      >
        {filteredIdeas.map((idea) => (
          <IdeaCard ... />
        ))}
      </motion.div>
    )}
  </div>
</SwipeableTabs>
```

Replace with:

```tsx
<SwipeableTabs
  activeTab={activeTab}
  onTabChange={(tab) => onTabChange(tab as TabType)}
>
  <div data-tab="active" className="swipe-panel">
    <IdeasList
      ideas={ideas.filter(i => i.status === 'processing' || i.status === 'ready')}
      tab="active"
      onSelectIdea={onSelectIdea}
    />
  </div>
  <div data-tab="pursuing" className="swipe-panel">
    <IdeasList
      ideas={ideas.filter(i => i.status === 'pursuing')}
      tab="pursuing"
      onSelectIdea={onSelectIdea}
    />
  </div>
  <div data-tab="deferred" className="swipe-panel">
    <IdeasList
      ideas={ideas.filter(i => i.status === 'deferred')}
      tab="deferred"
      onSelectIdea={onSelectIdea}
    />
  </div>
</SwipeableTabs>
```

**Step 2: Add the IdeasList helper component**

Add this new component before the `HomePage` function (after the imports):

```tsx
interface IdeasListProps {
  ideas: Idea[]
  tab: TabType
  onSelectIdea: (idea: Idea) => void
}

function IdeasList({ ideas, tab, onSelectIdea }: IdeasListProps) {
  if (ideas.length === 0) {
    return <EmptyState tab={tab} />
  }

  return (
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
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          onClick={() => onSelectIdea(idea)}
        />
      ))}
    </motion.div>
  )
}
```

**Step 3: Remove the `filteredIdeas` variable**

Delete these lines (around line 57-62):

```tsx
const filteredIdeas = ideas.filter(idea => {
  if (activeTab === 'active') return idea.status === 'processing' || idea.status === 'ready'
  if (activeTab === 'pursuing') return idea.status === 'pursuing'
  if (activeTab === 'deferred') return idea.status === 'deferred'
  return false
})
```

**Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "refactor: update HomePage to render all tab panels for scroll-snap"
```

---

## Task 4: Update IdeaDetailPage to Pass Both Panels

**Files:**
- Modify: `src/pages/IdeaDetailPage.tsx`

**Step 1: Update the SwipeableTabs usage**

Find this section (around line 301-351):

```tsx
<SwipeableTabs
  tabs={['analysis', 'chat']}
  activeTab={activeTab}
  onTabChange={(tab) => setActiveTab(tab as DetailTab)}
>
  <div className="detail-content">
    <AnimatePresence mode="wait">
      {activeTab === 'analysis' ? (
        <motion.div key="analysis" ...>
          <AnalysisView ... />
        </motion.div>
      ) : (
        <motion.div key="chat" ... className="chat-view">
          ...
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</SwipeableTabs>
```

Replace with:

```tsx
<SwipeableTabs
  activeTab={activeTab}
  onTabChange={(tab) => setActiveTab(tab as DetailTab)}
>
  <div data-tab="analysis" className="swipe-panel detail-panel-content">
    <AnalysisView
      idea={idea}
      showTranscript={showTranscript}
      onToggleTranscript={() => setShowTranscript(!showTranscript)}
    />
  </div>
  <div data-tab="chat" className="swipe-panel detail-panel-content">
    <div className="chat-view">
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
    </div>
  </div>
</SwipeableTabs>
```

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/pages/IdeaDetailPage.tsx
git commit -m "refactor: update IdeaDetailPage to render both tab panels for scroll-snap"
```

---

## Task 5: Add Detail Panel Styles and Clean Up Old Styles

**Files:**
- Modify: `src/styles/app.css`

**Step 1: Add detail panel content style**

Add after the swipe-panel class:

```css
.detail-panel-content {
  padding: var(--space-4) var(--page-padding);
  padding-bottom: 150px; /* Space for fixed bottom bar */
}
```

**Step 2: Remove old styles that are no longer needed**

Find and remove the `.home-scroll` class (around line 72-77):

```css
/* Scroll container inside SwipeableTabs - allows swipe to work everywhere */
.home-scroll {
  flex: 1;
  overflow-y: auto;
}
```

Find and modify the `.detail-content` class - remove it or simplify it since panels now handle their own padding.

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/styles/app.css
git commit -m "style: add detail panel styles, remove obsolete scroll classes"
```

---

## Task 6: Final Verification

**Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: PASS with no errors

**Step 2: Push to GitHub**

```bash
git push
```

**Step 3: Test on mobile device**

Deploy and test these scenarios:

1. **Home page vertical scroll** - scroll ideas list up/down in each tab
2. **Home page horizontal swipe** - swipe left/right to change tabs
3. **Home page tab buttons** - tap tab buttons to switch
4. **Detail page analysis scroll** - scroll long analysis content
5. **Detail page chat scroll** - scroll chat messages
6. **Detail page swipe** - swipe left/right between Analysis and Chat
7. **Detail page tab buttons** - tap tab buttons to switch

---

## Rollback Plan

If issues are found, revert to previous commit:

```bash
git revert HEAD~5..HEAD
```

Or restore the old SwipeableTabs from git history:

```bash
git checkout HEAD~5 -- src/components/SwipeableTabs.tsx
```
