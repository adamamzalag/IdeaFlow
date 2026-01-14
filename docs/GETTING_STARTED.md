# Getting Started with IdeaFlow

## Prerequisites

- GitHub account
- Replit account
- OpenRouter API key (for Claude Sonnet)

## Initial Setup

### 1. Import from GitHub to Replit

1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Select "Import from GitHub"
4. Paste the repository URL: `https://github.com/adamamzalag/IdeaFlow`
5. Replit will auto-detect it as a Node.js project

### 2. Configure Replit Secrets

In Replit, go to "Secrets" (lock icon) and add:

| Key | Value | Notes |
|-----|-------|-------|
| OPENROUTER_API_KEY | sk-or-... | Your OpenRouter API key (for Claude Sonnet) |
| DATABASE_URL | (auto-provided) | Replit provides this when you add PostgreSQL |

### 3. Add PostgreSQL Database

1. In Replit, click "Tools" → "Database"
2. Select PostgreSQL
3. Replit auto-provisions and sets DATABASE_URL

### 4. Run Database Migrations

In Replit shell:
```bash
npm run db:migrate
```

### 5. Start the App

Click "Run" in Replit, or:
```bash
npm run dev
```

The app will be available at your Replit URL.

---

## Local Development (Optional)

If you want to develop locally with Claude Code before pushing:

### 1. Clone the Repository

```bash
git clone https://github.com/adamamzalag/IdeaFlow.git
cd IdeaFlow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

Create `.env` file:
```
OPENROUTER_API_KEY=sk-or-...
DATABASE_URL=postgresql://localhost:5432/ideaflow
```

### 4. Run Locally

```bash
npm run dev
```

### 5. Push Changes

```bash
git add .
git commit -m "Description of changes"
git push origin main
```

Replit will auto-deploy.

---

## Development Workflow

1. **Claude Code** writes/modifies code
2. **Push to GitHub**
3. **Replit auto-deploys** from GitHub
4. **Test on Replit** using the live URL
5. **Iterate**

---

## Installing as PWA (Phone)

1. Open the app URL on your phone's browser
2. **iOS Safari:** Tap Share → "Add to Home Screen"
3. **Android Chrome:** Tap menu → "Add to Home Screen"

The app will appear as an icon and work offline for cached content.

---

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is set in Replit Secrets
- Ensure PostgreSQL is provisioned in Replit

### "OpenRouter API error"
- Verify OPENROUTER_API_KEY is correct in Secrets
- Check API key has sufficient credits

### "App not updating after push"
- Replit may need a manual refresh
- Try stopping and restarting the Repl

### PWA not installing
- Ensure you're using HTTPS (Replit provides this)
- Check manifest.json is properly configured

---

*See TROUBLESHOOTING.md for more detailed solutions*
