# IdeaFlow Troubleshooting

Common issues and solutions.

---

## Setup Issues

### Database Connection Failed

**Symptoms:** App crashes on start, "connection refused" errors

**Solutions:**
1. Verify DATABASE_URL is set in Replit Secrets
2. Ensure PostgreSQL is provisioned in Replit (Tools → Database)
3. Check if database migrations have run: `npm run db:migrate`
4. Restart the Repl

### API Key Errors

**Symptoms:** "Invalid API key", AI features not working

**Solutions:**
1. Check ANTHROPIC_API_KEY in Replit Secrets
2. Verify the key starts with `sk-ant-`
3. Ensure API key has credits/quota remaining
4. Try generating a new key at console.anthropic.com

### Build Failures

**Symptoms:** Replit shows build errors

**Solutions:**
1. Check for TypeScript errors: `npm run typecheck`
2. Ensure all dependencies installed: `npm install`
3. Check for syntax errors in recent changes
4. Review Replit console for specific error messages

---

## Voice Recording Issues

### Microphone Not Working

**Symptoms:** Voice button doesn't respond, no audio captured

**Solutions:**
1. Check browser permissions (allow microphone access)
2. On iOS: Use Safari (Chrome has limited Web Speech API support)
3. Ensure HTTPS (required for microphone access)
4. Test microphone in another app

### Poor Transcription Quality

**Symptoms:** Transcript doesn't match what you said

**Solutions:**
1. Speak clearly and at moderate pace
2. Reduce background noise
3. Check microphone quality
4. Web Speech API has limitations - this is a browser constraint

### Recording Stops Early

**Symptoms:** Recording ends before you finish speaking

**Solutions:**
1. Try tap-to-start/tap-to-stop mode instead of auto-stop
2. Speak without long pauses
3. Check browser isn't throttling in background

---

## PWA Issues

### App Won't Install

**Symptoms:** "Add to Home Screen" option not appearing

**Solutions:**
1. Ensure you're on HTTPS (Replit provides this)
2. Check manifest.json is valid
3. On iOS: Only Safari supports PWA install
4. Try clearing browser cache

### App Not Updating

**Symptoms:** Old version showing after deployment

**Solutions:**
1. Close and reopen the app
2. Clear PWA cache (Settings → Clear Data)
3. Uninstall and reinstall the PWA
4. Check service worker is updating

### Offline Not Working

**Symptoms:** App doesn't work without internet

**Solutions:**
1. V1 requires internet for AI features
2. Cached pages should load - check service worker
3. New idea capture requires network connection

---

## AI/Analysis Issues

### Ideas Stuck in "Processing"

**Symptoms:** Ideas never move to "Ready"

**Solutions:**
1. Check OpenRouter API key is valid
2. Check Replit logs for errors
3. Verify background job is running
4. Check API quota/credits

### Analysis Seems Generic

**Symptoms:** AI doesn't use your context/constraints

**Solutions:**
1. Check your profile is filled out (Settings)
2. Mention specific constraints in your idea
3. Use chat to tell AI more context

### Chat Not Updating Analysis

**Symptoms:** You discuss changes but analysis stays the same

**Solutions:**
1. Be explicit: "Update the analysis to reflect..."
2. Check for errors in Replit logs
3. Refresh the page to see latest analysis

---

## Performance Issues

### App Loads Slowly

**Symptoms:** Long load times, especially on phone

**Solutions:**
1. PWA should cache shell - ensure installed
2. Check network connection
3. Replit free tier may have cold starts
4. Large idea lists may need pagination

### Chat Responses Slow

**Symptoms:** AI takes long to respond

**Solutions:**
1. Claude API has natural latency (5-15 seconds typical)
2. Check Replit isn't throttled (free tier limits)
3. Simplify your message if it's very long

---

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Unauthorized" | Not logged in | Refresh page, log in again |
| "Idea not found" | Invalid ID or deleted | Return to ideas list |
| "Processing" | Idea still being analyzed | Wait a minute, refresh |
| "Rate limited" | Too many API calls | Wait a few minutes |
| "Network error" | No internet connection | Check connection |

---

## Getting Help

If issues persist:

1. Check Replit console for detailed error logs
2. Review recent changes that might have caused the issue
3. Check if the issue is browser-specific (try another browser)
4. For AI issues, check OpenRouter status page

---

*Last updated: January 10, 2026*
