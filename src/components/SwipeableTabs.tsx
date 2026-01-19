import { useRef, ReactNode } from 'react'
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
  const isEdgeSwipe = useRef(false)

  const currentIndex = tabs.indexOf(activeTab)
  // If activeTab not in tabs, default to first tab behavior
  const safeIndex = currentIndex === -1 ? 0 : currentIndex
  const isFirstTab = safeIndex === 0
  const isLastTab = safeIndex === tabs.length - 1

  const handleDragStart = (
    event: MouseEvent | TouchEvent | PointerEvent,
    _info: PanInfo
  ) => {
    // Get the starting X position relative to viewport
    const clientX = 'touches' in event
      ? (event as TouchEvent).touches[0].clientX
      : (event as MouseEvent).clientX

    isEdgeSwipe.current = clientX <= EDGE_ZONE && isFirstTab && !!onEdgeSwipeLeft
  }

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
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
        onTabChange(tabs[safeIndex - 1])
      } else if (offset < 0 && !isLastTab) {
        // Swipe left - go to next tab
        onTabChange(tabs[safeIndex + 1])
      }
    }

    // Snap back to position
    controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } })
  }

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
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
