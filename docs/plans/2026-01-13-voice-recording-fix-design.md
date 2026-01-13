# Voice Recording Fix - Design Document

**Date:** January 13, 2026
**Status:** Approved
**Problem:** Android Chrome duplicates words during voice recording

---

## Problem Summary

On Android Chrome, voice recording duplicates words/phrases. The root cause: when Android stops recognition mid-speech (which it does frequently), our code auto-restarts recognition. Android then re-processes audio still in its buffer, causing duplication.

## Solution

Replace tap-to-start with two recording modes:

1. **Hold-to-Record** - Press and hold mic, release to stop
2. **Pull-to-Lock** - Press mic, drag upward to lock into hands-free mode

Key fix: Remove all auto-restart logic. When recognition stops, it stops. User can tap "Continue" to add more.

---

## Interaction Design

### Default State (Idle)
- Large mic button centered
- Hint text: "Hold to record, slide up to lock"

### Hold-to-Record (Quick Ideas)
1. User presses and holds mic button
2. Recording starts immediately
3. User releases finger → recording stops
4. Transcript appears with "Continue" and "Save Idea" buttons

### Pull-to-Lock (Hands-Free)
1. User presses mic button
2. User drags upward ~50px while holding
3. Lock indicator appears and highlights when threshold reached
4. User releases → recording continues (locked mode)
5. Mic button shows lock icon, hint changes to "Tap to stop"
6. User taps mic → recording stops
7. Same end state: transcript + Continue/Save buttons

### When Recording Stops Unexpectedly
- Recognition simply stops (no auto-restart)
- User sees their transcript
- "Continue" button lets them add more if needed
- No duplication because no restart while audio buffered

---

## Visual Design (Following IdeaFlow Design System)

### Colors
- Recording pulse: `--color-accent` (#E8785A coral)
- Recording glow: `--shadow-glow` (coral glow)
- Lock icon idle: `--color-text-secondary` (#A8A8A4)
- Lock icon active: `--color-accent` (#E8785A)

### Recording State
- Mic button background pulses with coral accent
- `--shadow-glow` applied around button
- Duration timer appears above button
- Live transcript below (interim text at 50% opacity)

### Locked State
- Small lock icon visible on/near mic button
- Same pulsing animation
- Hint text: "Tap to stop"

### Pull Gesture Feedback
- Lock icon fades in above mic as user drags up
- Opacity tied to drag distance (0% at 0px, 100% at 50px)
- Subtle scale increase when threshold reached

### Motion
- Animation timing: `--duration-slow` (400ms) with `--ease-spring`
- Transitions: `--duration-normal` (250ms)
- Use Framer Motion for gesture tracking

---

## Technical Implementation

### State Changes
```typescript
// New state
type RecordingMode = 'idle' | 'holding' | 'locked'

// Remove voiceState, replace with:
const [recordingMode, setRecordingMode] = useState<RecordingMode>('idle')
const [isRecording, setIsRecording] = useState(false)
```

### Key Changes to CaptureModal.tsx

1. **Remove auto-restart logic**
   - Delete `onend` handler that restarts recognition
   - When recognition ends, set `isRecording = false`

2. **Add pointer event handlers**
   - `onPointerDown` → start recording, store initial Y position
   - `onPointerMove` → check drag distance, show lock indicator
   - `onPointerUp` → if past threshold, enter locked mode; else stop

3. **Locked mode behavior**
   - `recordingMode === 'locked'` continues recording after pointer up
   - Tap on mic button stops recording

4. **Gesture tracking with Framer Motion**
   - `useMotionValue` for drag distance
   - `useTransform` for lock icon opacity/scale

### Files to Modify
- `src/components/CaptureModal.tsx` - main implementation
- `src/styles/app.css` - lock indicator, recording states

---

## Testing Plan

1. **Android Chrome** - Primary target, verify no duplication
2. **iOS Safari** - Ensure hold-to-record works with WebKit quirks
3. **Desktop Chrome** - Baseline functionality
4. **Edge cases:**
   - Very short recordings (<1 second)
   - Long recordings (>60 seconds)
   - Recognition stops mid-sentence (verify Continue works)
   - Quick tap vs hold distinction

---

## Success Criteria

- No word duplication on Android Chrome
- Both recording modes work smoothly
- Visual feedback is clear and follows design system
- Existing "Continue" and "Save" flows unchanged
