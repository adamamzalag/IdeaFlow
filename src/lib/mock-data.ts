import { Idea, Message } from './types'

export const mockIdeas: Idea[] = [
  {
    id: '1',
    title: 'AI-powered inventory forecasting for Wicked Cushions',
    rawInput: "I've been thinking about how we could use AI to predict when we'll run out of stock. Like, looking at sales velocity, seasonality, and supplier lead times to automatically suggest reorder points. Could save a lot of manual work.",
    status: 'ready',
    createdAt: new Date('2026-01-10T08:30:00'),
    updatedAt: new Date('2026-01-10T08:35:00'),
    analysis: {
      version: 1,
      content: `## Summary

Use AI to predict stock levels and automate reorder recommendations for the e-commerce business.

## The Problem

Currently you manually track inventory across FBA, Shopify, and suppliers. This creates work and risks stockouts or overstock situations.

## How It Would Work

1. Pull sales data from all channels
2. Analyze velocity trends and seasonality patterns
3. Factor in supplier lead times (typically 4-6 weeks from China)
4. Surface recommendations in a dashboard or automated alerts

## Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Effort | Medium | 2-3 weeks of focused development |
| Value | High | Saves 3-5 hrs/week, reduces stockouts |
| Risk | Low | Can start small with top SKUs |

## Challenges

- **Data quality** - Accuracy depends on having clean historical data
- **New products** - Won't have history for launches
- **Supplier variability** - Lead times aren't always consistent

## Recommended Approach

Start with your **top 20 SKUs by revenue**. Build a simple model using moving averages, then iterate. Could integrate with existing WCAmz project since you already have the Amazon data there.

## Next Steps

1. Audit current data sources
2. Define success criteria (e.g., reduce stockouts by 50%)
3. Build prototype for top SKUs

> **Questions for you:**
> - How accurate are your current supplier lead time estimates?
> - Do you want this integrated into WCAmz or as a standalone tool?`
    }
  },
  {
    id: '2',
    title: 'Voice memo app for capturing ideas on the go',
    rawInput: 'Voice memo app idea - something where I can just speak into my phone and it automatically processes what I said',
    status: 'processing',
    createdAt: new Date('2026-01-10T10:15:00'),
    updatedAt: new Date('2026-01-10T10:15:00')
  },
  {
    id: '3',
    title: 'Team standup automation with AI summaries',
    rawInput: "What if we had a bot that collected async standups from the team via Slack or Teams, then summarized them and flagged blockers? Would save the 15-minute daily call.",
    status: 'ready',
    createdAt: new Date('2026-01-09T14:20:00'),
    updatedAt: new Date('2026-01-09T14:28:00'),
    analysis: {
      version: 1,
      content: `## Summary

Async standup collection with AI-powered summaries and blocker detection.

## The Problem

Daily standups take 15 minutes and require everyone to be available at the same time. Information gets lost. Blockers don't surface fast enough.

## How It Would Work

Bot prompts team members at their preferred time. They respond with:
- What they did yesterday
- What they're doing today
- Any blockers

AI summarizes everything, detects patterns, and surfaces blockers immediately to the right people.

## Quick Assessment

**Effort:** Medium-low (1-2 weeks for MVP)
**Value:** Saves ~5 hours/week of meeting time
**Risk:** Team adoption - some prefer live interaction

## Challenges

- Some people prefer live interaction and may resist
- May miss nuance that comes from real-time conversation
- Need buy-in from the whole team to be effective

## Recommended Approach

Start with **Microsoft Teams** since that's your primary tool. Use Power Automate or a custom bot. Claude API for summarization.

## Next Steps

1. Survey team on standup preferences
2. Define the 3 questions to ask
3. Build prototype for one team first

> **Questions for you:**
> - How many people would use this?
> - Is the goal to eliminate standups or supplement them?`
    }
  },
  {
    id: '4',
    title: 'Customer review sentiment tracker',
    rawInput: 'Track Amazon reviews sentiment over time, alert when negative reviews spike, maybe even auto-generate response templates',
    status: 'pursuing',
    createdAt: new Date('2026-01-08T09:45:00'),
    updatedAt: new Date('2026-01-09T11:00:00'),
    analysis: {
      version: 2,
      content: `## Summary

Monitor Amazon review sentiment trends with automated alerts and response suggestions.

## The Problem

Reviews are scattered across products and marketplaces. Negative sentiment issues take time to surface. Responding is manual and slow.

## How It Would Work

1. Aggregate reviews via Amazon SP-API
2. Run sentiment analysis to score and categorize
3. Dashboard shows trends over time
4. Alerts trigger on negative spikes
5. AI drafts response templates

## Why This Matters

- **Protect ratings** - Critical for Amazon sales algorithm
- **Faster response** - Improves customer perception
- **Early warning** - Catch product issues before they escalate

## Challenges

- **API rate limits** - Amazon restricts how often you can pull data
- **Response quality** - Bad auto-responses hurt more than no response

## Recommended Approach

Integrate with **WCAmz** since you already have the Amazon API connection. Add a sentiment analysis layer. Start with alerting, then add response generation once that's solid.

## Next Steps

1. Define sentiment thresholds for alerts
2. Identify top 10 products to monitor first
3. Set up basic alerting

> **Questions for you:**
> - What response time are you targeting?
> - Should this cover all marketplaces or start with US?`
    }
  },
  {
    id: '5',
    title: 'Automated supplier communication templates',
    rawInput: 'templates for supplier emails',
    status: 'deferred',
    createdAt: new Date('2026-01-05T16:30:00'),
    updatedAt: new Date('2026-01-06T10:00:00'),
    analysis: {
      version: 1,
      content: `## Summary

Pre-built email templates for common supplier communications.

## The Problem

Writing supplier emails is repetitive. Tone and format vary between team members. New team members don't know what to say.

## How It Would Work

Library of templates for common scenarios:
- Order placement
- Quality issues
- Delivery delays
- New product inquiries
- Pricing negotiations

Each template has variables for easy customization.

## Quick Assessment

**Effort:** Low (2-3 hours of content work)
**Value:** Low-medium
**Priority:** Deferred - not a major pain point right now

## Challenges

- Templates can feel impersonal
- May not cover edge cases
- Suppliers may respond better to personalized messages

## If You Decide to Pursue

1. Document your 10 most common supplier email types
2. Create templates in Notion or Google Docs
3. Share with team

> **Questions for you:**
> - Is email the primary channel or do you use WeChat/other?
> - Who else on the team communicates with suppliers?`
    }
  }
]

export const mockMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "I've analyzed your idea for AI-powered inventory forecasting. I have a few questions to help refine this further. First, how accurate are your current supplier lead time estimates? And would you want this integrated into WCAmz or as a standalone tool?",
    timestamp: new Date('2026-01-10T08:35:00')
  },
  {
    id: '2',
    role: 'user',
    content: "Lead times are usually accurate within a week. Definitely want it in WCAmz - that's where all the data already is.",
    timestamp: new Date('2026-01-10T09:15:00')
  },
  {
    id: '3',
    role: 'assistant',
    content: "Good - a one-week variance is workable, we can build in buffer days. Since this will integrate with WCAmz, you already have the Amazon sales data and SKU mappings. The main new piece would be connecting your supplier/inventory data. Do you track supplier lead times somewhere structured, or is it more institutional knowledge right now?",
    timestamp: new Date('2026-01-10T09:16:00')
  }
]
