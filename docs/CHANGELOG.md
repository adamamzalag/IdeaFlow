# IdeaFlow Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased]

### Changed
- **Voice capture architecture** - Switching from Web Speech API to MediaRecorder + Whisper API
  - Web Speech API had critical issues on Android Chrome (word duplication, aggressive auto-stop)
  - New approach: Record audio locally, send to server, transcribe via Whisper
  - Cost: $0.006/minute - negligible for personal use

### Reverted
- **Hold-to-record and pull-to-lock gestures** - Attempted but reverted due to:
  - Layout reflow caused false lock detection
  - Android Chrome long-press conflicts with text selection
  - Word duplication was not actually fixed by gesture changes
  - Simple tap-to-start/stop is more reliable on mobile web

### Added
- Debug panel for voice recording (temporary, for investigation)
- Recording pulse animation on mic button
- Initial project structure
- Design document (`docs/plans/2026-01-10-ideaflow-design.md`)
- Voice investigation notes (`docs/plans/piped-spinning-seahorse.md`)
- Project documentation:
  - CLAUDE.md (project context)
  - ARCHITECTURE.md
  - API_REFERENCE.md
  - GETTING_STARTED.md
  - SPECS_OVERVIEW.md
  - CHANGELOG.md
  - FUTURE_FEATURES.md

### Learned
- **Web Speech API on Android Chrome:**
  - Returns cumulative results (Result[3] includes Result[2]'s content)
  - Fires `onend` aggressively without waiting for silence
  - Auto-restart logic causes word duplication
  - Gesture interactions conflict with browser behaviors
- **Recommendation:** Use server-side transcription for reliable voice capture

### Development Workflow Established
- Claude Code for all development
- GitHub as source of truth
- Replit for hosting, database, auth, secrets
- Auto-deploy from GitHub to Replit

---

## Version History

### v0.1.0 - Project Initialization (January 10, 2026)

**Milestone:** Design Complete

- Completed brainstorming session
- Defined V1 scope
- Created comprehensive design document
- Set up project structure
- Established development workflow

**Next:** Phase 2 - Backend + Voice Fix

---

*Format based on [Keep a Changelog](https://keepachangelog.com/)*
