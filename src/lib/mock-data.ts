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
      summary: 'Use AI to predict stock levels and automate reorder recommendations for the e-commerce business.',
      problemItSolves: 'Currently you manually track inventory across FBA, Shopify, and suppliers. This creates work and risks stockouts or overstock situations.',
      howItWouldWork: 'Pull sales data from all channels, analyze velocity trends, factor in supplier lead times (typically 4-6 weeks from China), and surface recommendations in a dashboard or automated alerts.',
      effortEstimate: 'Medium effort. Would need API integrations with Amazon SP-API, Shopify, and your supplier data. Core ML model could use existing forecasting libraries. 2-3 weeks of focused development.',
      potentialValue: 'High. Reduces stockout risk (lost sales), prevents overstock (tied-up capital), and saves 3-5 hours/week of manual inventory review.',
      challenges: 'Accuracy depends on data quality. New product launches won\'t have historical data. Supplier reliability varies and is hard to model.',
      howToAccomplish: 'Start with your top 20 SKUs by revenue. Build a simple model using moving averages, then iterate. Could integrate with existing WCAmz project.',
      nextSteps: 'Audit current data sources. Define what "success" looks like (e.g., reduce stockouts by 50%). Start with a prototype for top SKUs.',
      questionsForYou: [
        'How accurate are your current supplier lead time estimates?',
        'Do you want this integrated into WCAmz or as a standalone tool?'
      ]
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
      summary: 'Async standup collection with AI-powered summaries and blocker detection.',
      problemItSolves: 'Daily standups take 15 minutes and require everyone to be available at the same time. Information gets lost. Blockers don\'t surface fast enough.',
      howItWouldWork: 'Bot prompts team members at their preferred time. They respond with what they did, what they\'re doing, and blockers. AI summarizes, detects patterns, and surfaces blockers immediately.',
      effortEstimate: 'Medium-low. Teams/Slack bots are well-documented. AI summarization is straightforward. 1-2 weeks for MVP.',
      potentialValue: 'Saves ~5 hours/week of team meeting time. Better async work. Faster blocker resolution.',
      challenges: 'Team adoption - some people prefer live interaction. May miss nuance that comes from real-time conversation.',
      howToAccomplish: 'Start with Microsoft Teams since that\'s your primary tool. Use Power Automate or a custom bot. Claude API for summarization.',
      nextSteps: 'Survey team on standup preferences. Define the 3 questions to ask. Build prototype for one team first.',
      questionsForYou: [
        'How many people would use this?',
        'Is the goal to eliminate standups or supplement them?'
      ]
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
      summary: 'Monitor Amazon review sentiment trends with automated alerts and response suggestions.',
      problemItSolves: 'Reviews are scattered across products and marketplaces. Negative sentiment issues take time to surface. Responding is manual and slow.',
      howItWouldWork: 'Aggregate reviews via Amazon SP-API. Run sentiment analysis to score and categorize. Dashboard shows trends. Alerts trigger on negative spikes. AI drafts response templates.',
      effortEstimate: 'Medium. Review data is accessible via API. Sentiment analysis can use existing models. 2 weeks for core functionality.',
      potentialValue: 'Protect product ratings (critical for Amazon sales). Faster response improves customer perception. Early detection of product issues.',
      challenges: 'Amazon API rate limits. Response automation needs careful review - bad responses hurt more than no response.',
      howToAccomplish: 'Integrate with WCAmz since you already have Amazon API connection. Add sentiment layer. Start with alerting, then add response generation.',
      nextSteps: 'Define sentiment thresholds for alerts. Identify top 10 products to monitor first. Set up basic alerting.',
      questionsForYou: [
        'What response time are you targeting?',
        'Should this cover all marketplaces or start with US?'
      ]
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
      summary: 'Pre-built email templates for common supplier communications.',
      problemItSolves: 'Writing supplier emails is repetitive. Tone and format vary. New team members don\'t know what to say.',
      howItWouldWork: 'Library of templates for: order placement, quality issues, delivery delays, new product inquiries, pricing negotiations. Variables for customization.',
      effortEstimate: 'Low. This is mostly content work, not technical development. 2-3 hours to create templates.',
      potentialValue: 'Low-medium. Saves some time but not a major pain point.',
      challenges: 'Templates can feel impersonal. May not cover edge cases.',
      howToAccomplish: 'Document your 10 most common supplier email types. Create templates in Notion or Google Docs. Share with team.',
      nextSteps: 'List the email types you send most often. Draft one template as example.',
      questionsForYou: [
        'Is email the primary channel or do you use WeChat/other?',
        'Who else on the team communicates with suppliers?'
      ]
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
