# IdeaFlow Testing Checklist

## Pending Tests

### v0.4.5 - FAB Fix + API Retry (January 19, 2026)

Test the scroll boundary FAB fix:

- [ ] **FAB overlap fix** - On ideas list:
  - Add enough ideas to make list scroll
  - Scroll to bottom
  - Last item should stop ABOVE the FAB (no overlap)
  - FAB remains accessible and clickable

- [ ] **API retry** - Network error handling:
  - Intermittent network errors should retry automatically
  - Analysis regeneration should succeed even with brief drops

### v0.4.2 - AI Persona (January 14, 2026)

Test the new "Chief of Staff for Ideas" AI behavior:

- [ ] **Analysis quality** - Create a new idea, check if analysis is:
  - Substantive, not verbose
  - Adapts length to idea complexity
  - Avoids template-like structure
  - Includes honest assessment (not just positive)
  - Considers your constraints (time, resources)

- [ ] **Chat behavior** - In chat, test:
  - Direct question gets direct answer
  - Asking for validation gets honest pushback if warranted
  - Responses are concise, not rambling
  - AI challenges weak thinking respectfully

- [ ] **Analysis updates** - After significant chat:
  - Click "Update Analysis"
  - Verify it incorporates chat insights
  - Reads as fresh analysis, not patched

### v0.4.1 - CSS Fixes (January 14, 2026)

Already marked fixed, but verify on device:

- [ ] Long titles truncate with ellipsis (no cut-off mid-word)
- [ ] No horizontal overflow on detail page
- [ ] Keyboard opening doesn't cause scroll into black void
- [ ] Bottom bar stays visible and correctly positioned

---

## Test Environment

- **Device:** Android phone (Pixel or similar)
- **Browser:** Chrome
- **URL:** Replit deployment URL

## How to Test

1. Sync Replit with GitHub (pull latest)
2. Open app on phone
3. Work through checklist above
4. Note any issues for next session

---

*Last updated: January 19, 2026*
