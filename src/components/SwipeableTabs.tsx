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
