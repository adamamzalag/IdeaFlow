import { useRef, ReactNode } from 'react'
import { motion, useAnimation, PanInfo } from 'framer-motion'

interface SwipeableTabsProps {
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  children: ReactNode
}

const SWIPE_THRESHOLD = 0.3 // 30% of width
const VELOCITY_THRESHOLD = 500 // px/s

export function SwipeableTabs({
  tabs,
  activeTab,
  onTabChange,
  children
}: SwipeableTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  const currentIndex = Math.max(0, tabs.indexOf(activeTab))
  const isFirstTab = currentIndex === 0
  const isLastTab = currentIndex === tabs.length - 1

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const containerWidth = containerRef.current?.offsetWidth || 300
    const offset = info.offset.x
    const velocity = info.velocity.x

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
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // Apply rubber-band effect at edges
    const offset = info.offset.x
    let resistance = 1

    if ((offset > 0 && isFirstTab) || (offset < 0 && isLastTab)) {
      resistance = 0.3 // Rubber-band feel
    }

    controls.set({ x: offset * resistance })
  }

  return (
    <div
      ref={containerRef}
      style={{
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <motion.div
        drag="x"
        dragDirectionLock
        dragElastic={0}
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          touchAction: 'pan-y'
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
