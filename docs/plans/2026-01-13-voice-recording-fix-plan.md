# Voice Recording Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix Android Chrome word duplication by replacing tap-to-start with hold-to-record and pull-to-lock interaction patterns.

**Architecture:** Remove auto-restart logic from speech recognition `onend` handler. Add pointer event tracking for hold vs drag gestures. Use Framer Motion for smooth lock indicator animation.

**Tech Stack:** React, TypeScript, Framer Motion, Web Speech API

---

## Task 1: Remove Auto-Restart Logic

**Files:**
- Modify: `src/components/CaptureModal.tsx:128-141`

**Step 1: Read current onend handler**

Understand the current auto-restart logic that causes duplication.

**Step 2: Remove auto-restart from onend**

Replace the `onend` handler. Change from:

```typescript
recognition.onend = () => {
  // Recognition ended - check if we should keep going using the ref
  if (voiceStateRef.current === 'recording' && recognitionRef.current) {
    // Save current transcript before restarting (results array will reset)
    setFinalTranscript(prev => {
      confirmedTranscriptRef.current = prev
      return prev
    })
    try {
      recognitionRef.current.start()
    } catch {
      // Already stopped or error
    }
  }
}
```

To:

```typescript
recognition.onend = () => {
  // Recognition ended - just stop, don't auto-restart (fixes Android duplication)
  if (voiceStateRef.current === 'recording') {
    setVoiceState('stopped')
    setInterimTranscript('')
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }
}
```

**Step 3: Remove confirmedTranscriptRef usage**

Since we're not restarting, we don't need to track transcript across restarts. Remove:
- `confirmedTranscriptRef` declaration (line ~61)
- References to `confirmedTranscriptRef.current` in `onresult` handler
- References in `startRecording` function

Update `onresult` to simplify transcript building (no more cross-session combining).

**Step 4: Test manually**

- Open app on Android Chrome
- Record a sentence
- Verify no duplication when recognition auto-stops
- Verify "Continue" button still works

**Step 5: Commit**

```bash
git add src/components/CaptureModal.tsx
git commit -m "fix: remove auto-restart to fix Android duplication bug"
```

---

## Task 2: Add Recording Mode State

**Files:**
- Modify: `src/components/CaptureModal.tsx`

**Step 1: Add new state for recording mode**

Add after existing state declarations (~line 50):

```typescript
type RecordingMode = 'idle' | 'holding' | 'locked'

// Inside component:
const [recordingMode, setRecordingMode] = useState<RecordingMode>('idle')
const dragStartY = useRef<number>(0)
const LOCK_THRESHOLD = 50 // pixels to drag up to lock
```

**Step 2: Update voiceState logic**

The `voiceState` ('idle' | 'recording' | 'stopped') can stay - it tracks speech recognition state.
The new `recordingMode` tracks the gesture state (how recording was initiated).

**Step 3: Commit**

```bash
git add src/components/CaptureModal.tsx
git commit -m "feat: add recording mode state for hold vs lock tracking"
```

---

## Task 3: Implement Pointer Event Handlers

**Files:**
- Modify: `src/components/CaptureModal.tsx`

**Step 1: Create pointer event handlers**

Add these functions before the return statement:

```typescript
const handlePointerDown = (e: React.PointerEvent) => {
  e.preventDefault()
  dragStartY.current = e.clientY
  setRecordingMode('holding')
  startRecording()
}

const handlePointerMove = (e: React.PointerEvent) => {
  if (recordingMode !== 'holding') return

  const dragDistance = dragStartY.current - e.clientY
  // Will use this for lock indicator animation in next task
  if (dragDistance >= LOCK_THRESHOLD) {
    setRecordingMode('locked')
  }
}

const handlePointerUp = () => {
  if (recordingMode === 'holding') {
    // Released without locking - stop recording
    stopRecording()
    setRecordingMode('idle')
  }
  // If locked, recording continues - user taps again to stop
}

const handleLockedTap = () => {
  if (recordingMode === 'locked') {
    stopRecording()
    setRecordingMode('idle')
  }
}
```

**Step 2: Remove old click handler**

Remove `handleMainButtonClick` function - we're replacing it with pointer events.

**Step 3: Commit**

```bash
git add src/components/CaptureModal.tsx
git commit -m "feat: add pointer event handlers for hold and drag gestures"
```

---

## Task 4: Update Mic Button with Pointer Events

**Files:**
- Modify: `src/components/CaptureModal.tsx`

**Step 1: Replace button onClick with pointer events**

Find the mic button (~line 291-303) and update:

```tsx
{/* Main record button */}
{!(voiceState === 'stopped' && finalTranscript.trim()) && (
  <motion.button
    className={`voice-btn ${voiceState === 'recording' ? 'recording' : ''} ${recordingMode === 'locked' ? 'locked' : ''}`}
    onPointerDown={recordingMode === 'locked' ? undefined : handlePointerDown}
    onPointerMove={recordingMode === 'holding' ? handlePointerMove : undefined}
    onPointerUp={recordingMode === 'holding' ? handlePointerUp : undefined}
    onClick={recordingMode === 'locked' ? handleLockedTap : undefined}
    whileTap={recordingMode !== 'locked' ? { scale: 0.95 } : undefined}
    style={{ touchAction: 'none' }} // Prevent browser handling
  >
    {recordingMode === 'locked' ? (
      <Square size={40} />
    ) : voiceState === 'recording' ? (
      <Square size={40} />
    ) : (
      <Mic size={40} />
    )}
  </motion.button>
)}
```

**Step 2: Update hint text**

Find the hint text (~line 327-331) and update:

```tsx
<p className="voice-hint">
  {voiceState === 'idle' && 'Hold to record, slide up to lock'}
  {voiceState === 'recording' && recordingMode === 'locked' && 'Tap to stop'}
  {voiceState === 'recording' && recordingMode === 'holding' && 'Release to stop, keep sliding to lock'}
  {voiceState === 'stopped' && finalTranscript.trim() && 'Continue recording or save your idea'}
</p>
```

**Step 3: Test manually**

- Hold mic button briefly, release → should stop
- Hold mic button, drag up, release → should stay recording (locked)
- In locked mode, tap → should stop

**Step 4: Commit**

```bash
git add src/components/CaptureModal.tsx
git commit -m "feat: wire up pointer events to mic button"
```

---

## Task 5: Add Lock Indicator UI

**Files:**
- Modify: `src/components/CaptureModal.tsx`
- Modify: `src/styles/app.css`

**Step 1: Add lock icon import**

At top of CaptureModal.tsx, add Lock to imports:

```typescript
import { X, Mic, Type, Square, Send, Play, Lock } from 'lucide-react'
```

**Step 2: Add drag distance tracking with Framer Motion**

Add after state declarations:

```typescript
const dragDistance = useMotionValue(0)
const lockIconOpacity = useTransform(dragDistance, [0, LOCK_THRESHOLD], [0, 1])
const lockIconScale = useTransform(dragDistance, [0, LOCK_THRESHOLD], [0.5, 1])
```

Update `handlePointerMove`:

```typescript
const handlePointerMove = (e: React.PointerEvent) => {
  if (recordingMode !== 'holding') return

  const distance = Math.max(0, dragStartY.current - e.clientY)
  dragDistance.set(distance)

  if (distance >= LOCK_THRESHOLD && recordingMode !== 'locked') {
    setRecordingMode('locked')
  }
}
```

Reset on pointer up:

```typescript
const handlePointerUp = () => {
  if (recordingMode === 'holding') {
    stopRecording()
    setRecordingMode('idle')
  }
  dragDistance.set(0)
}
```

**Step 3: Add lock indicator JSX**

Add inside the voice-recorder div, before the button:

```tsx
{/* Lock indicator - shows during drag */}
<motion.div
  className="lock-indicator"
  style={{
    opacity: lockIconOpacity,
    scale: lockIconScale,
  }}
>
  <Lock size={24} />
  <span>Release to lock</span>
</motion.div>
```

**Step 4: Add CSS for lock indicator**

Add to `src/styles/app.css`:

```css
/* Lock indicator for voice recording */
.lock-indicator {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-accent);
  pointer-events: none;
}

.lock-indicator span {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* Locked state styling */
.voice-btn.locked {
  background: var(--color-accent);
  box-shadow: var(--shadow-glow);
}

.voice-btn.locked svg {
  color: var(--color-bg-deep);
}
```

**Step 5: Add position relative to voice-recorder**

Ensure lock indicator positions correctly:

```css
.voice-recorder {
  position: relative;
  /* ... existing styles */
}
```

**Step 6: Test manually**

- Start holding mic, drag up slowly
- Lock icon should fade in as you drag
- At threshold, icon should be fully visible
- Release → recording continues, button shows locked state

**Step 7: Commit**

```bash
git add src/components/CaptureModal.tsx src/styles/app.css
git commit -m "feat: add lock indicator UI with drag animation"
```

---

## Task 6: Add Recording Pulse Animation

**Files:**
- Modify: `src/styles/app.css`

**Step 1: Add pulse animation**

Add to app.css:

```css
/* Recording pulse animation */
@keyframes recording-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--color-accent-soft);
  }
  50% {
    box-shadow: 0 0 0 12px transparent;
  }
}

.voice-btn.recording {
  background: var(--color-accent);
  animation: recording-pulse 1.5s var(--ease-out) infinite;
}

.voice-btn.recording svg {
  color: var(--color-bg-deep);
}
```

**Step 2: Test manually**

- Start recording
- Button should pulse with coral glow
- Pulse should be smooth and not distracting

**Step 3: Commit**

```bash
git add src/styles/app.css
git commit -m "feat: add recording pulse animation"
```

---

## Task 7: Fix Edge Cases and Polish

**Files:**
- Modify: `src/components/CaptureModal.tsx`

**Step 1: Handle pointer cancel**

Add handler for when touch is interrupted:

```typescript
const handlePointerCancel = () => {
  if (recordingMode === 'holding') {
    stopRecording()
    setRecordingMode('idle')
  }
  dragDistance.set(0)
}
```

Add to button:

```tsx
onPointerCancel={handlePointerCancel}
```

**Step 2: Reset recording mode on stop**

Update `stopRecording` to reset mode:

```typescript
const stopRecording = () => {
  setVoiceState('stopped')
  setRecordingMode('idle') // Add this line
  setInterimTranscript('')
  // ... rest of function
}
```

**Step 3: Handle Continue button**

When user clicks Continue, they should go back to hold-to-record mode:

```typescript
const continueRecording = () => {
  setRecordingMode('holding') // Start in holding mode
  startRecording(true)
}
```

Actually, for Continue we should just start recording and let user hold again. Update:

```typescript
const continueRecording = () => {
  // Don't auto-start - just reset state so user can hold again
  setVoiceState('idle')
}
```

Wait, that changes the UX. Let's keep it simple - Continue starts recording in locked mode since user already has transcript:

```typescript
const continueRecording = () => {
  setRecordingMode('locked') // Go straight to locked mode
  startRecording(true)
}
```

**Step 4: Test all flows**

1. Quick hold-release → stops, shows transcript
2. Hold-drag-release → locked, continues recording
3. Locked → tap → stops
4. Stopped → Continue → locked mode, recording resumes
5. Stopped → Save → saves idea
6. Android Chrome → no duplication

**Step 5: Commit**

```bash
git add src/components/CaptureModal.tsx
git commit -m "fix: handle edge cases and polish interactions"
```

---

## Task 8: Update HANDOFF.md

**Files:**
- Modify: `HANDOFF.md`

**Step 1: Update bug status**

Remove the "Known Bug" section or mark it as fixed. Update "What's Working" to include the new recording modes.

**Step 2: Commit**

```bash
git add HANDOFF.md
git commit -m "docs: update HANDOFF.md - voice recording bug fixed"
```

---

## Task 9: Final Testing and Push

**Step 1: Test on multiple devices/browsers**

- [ ] Android Chrome - primary target
- [ ] iOS Safari
- [ ] Desktop Chrome
- [ ] Desktop Safari

**Step 2: Push to GitHub**

```bash
git push origin main
```

**Step 3: Verify on Replit**

Check that Replit auto-syncs and the fix works on the deployed preview.

---

## Summary

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1 | Remove auto-restart logic | 5 min |
| 2 | Add recording mode state | 3 min |
| 3 | Implement pointer handlers | 5 min |
| 4 | Update mic button | 5 min |
| 5 | Add lock indicator UI | 10 min |
| 6 | Add recording pulse | 3 min |
| 7 | Fix edge cases | 5 min |
| 8 | Update docs | 2 min |
| 9 | Test and push | 5 min |

**Total: ~45 minutes**
