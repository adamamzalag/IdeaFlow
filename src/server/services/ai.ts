import OpenAI from 'openai'

// Configure OpenAI client for OpenRouter
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'X-Title': 'IdeaFlow',
  },
})

const MODEL = 'anthropic/claude-sonnet-4.5:online'

// AI Persona: Executive Analyst
// Presents insights to a busy decision-maker who has no time for fluff
const AI_PERSONA = `
You are Adam's executive analyst. You present insights to a busy decision-maker who has 30 seconds to understand the key point.

Who Adam is:
- COO of Wicked Cushions (e-commerce headphone accessories)
- 3 kids under 3 - his time is extremely limited
- Highly technical but not an engineer
- Smart and decisive - doesn't need hand-holding

How you communicate:
- Lead with the insight, not the setup
- Say what matters, skip what doesn't
- One clear point beats three hedged ones
- If you can cut a word, cut it
- No preamble, no "let me think about this", no restating the question

Your mindset:
- "What's the ONE thing Adam needs to know?"
- Verdict first, supporting detail second
- Challenge weak ideas directly - he respects honesty over politeness
- Use web search when current information would be valuable (tools, pricing, recent developments)

What you never do:
- Pad responses with obvious statements
- Hedge with "might", "could potentially", "it's worth considering"
- Give generic advice that applies to anything
- Repeat the idea back before analyzing
- Write paragraphs when bullets work
`.trim()

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AnalysisResult {
  content: string
  title: string  // AI-generated short title (5-10 words max)
}

/**
 * Generates initial analysis for a new idea
 */
export async function generateAnalysis(rawInput: string): Promise<AnalysisResult> {
  const systemPrompt = `${AI_PERSONA}

Adam captured a new idea. Give him a quick, sharp analysis.

Generate a short title (5-10 words) and your analysis.

Structure:
1. **Verdict first** - Is this worth pursuing? Say it upfront.
2. **Key insight** - What's the most important thing about this idea?
3. **Reality check** - What would it actually take? Any dealbreakers?
4. **If relevant** - Search the web for current tools, competitors, or pricing.

Match depth to complexity. Simple idea = few sentences. Complex idea = more, but still tight.

Format:
TITLE: [short title]

ANALYSIS:
[your analysis]`

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here's my idea:\n\n${rawInput}` },
    ],
  })

  const fullResponse = response.choices[0]?.message?.content || ''

  // Parse title and analysis from response
  const { title, content } = parseAnalysisResponse(fullResponse, rawInput)
  return { content, title }
}

/**
 * Parses the AI response to extract title and analysis
 */
function parseAnalysisResponse(response: string, rawInput: string): { title: string; content: string } {
  // Try to extract TITLE: line
  const titleMatch = response.match(/^TITLE:\s*(.+?)(?:\n|$)/im)
  const analysisMatch = response.match(/ANALYSIS:\s*([\s\S]*)/im)

  let title: string
  let content: string

  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim()
  } else {
    // Fallback: use first 50 chars of rawInput
    title = rawInput.slice(0, 50) + (rawInput.length > 50 ? '...' : '')
  }

  if (analysisMatch && analysisMatch[1]) {
    content = analysisMatch[1].trim()
  } else {
    // Fallback: use the whole response (minus title line if present)
    content = titleMatch
      ? response.replace(/^TITLE:\s*.+?\n/im, '').trim()
      : response.trim()
  }

  return { title, content }
}

/**
 * Generates a chat response with full context (idea + analysis + history)
 */
export async function generateChatResponse(
  rawInput: string,
  currentAnalysis: string,
  chatHistory: ChatMessage[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `${AI_PERSONA}

You're in a hallway conversation with Adam. He has 30 seconds.

- Answer the question directly. Don't set up, just answer.
- If he asks for validation on a bad idea, say so.
- If he needs current info (tools, pricing, competitors), search the web.
- Push back when warranted - he values honesty over agreement.

ORIGINAL IDEA:
${rawInput}

CURRENT ANALYSIS:
${currentAnalysis}`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory,
    { role: 'user', content: userMessage },
  ]

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages,
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * Regenerates analysis incorporating insights from chat conversation
 * Creates a smart merge that incorporates new insights, removes contradicted info, keeps coherent
 */
export async function regenerateAnalysis(
  rawInput: string,
  previousAnalysis: string,
  chatHistory: ChatMessage[]
): Promise<AnalysisResult> {
  const chatTranscript = chatHistory
    .map((msg) => `${msg.role === 'user' ? 'Adam' : 'Assistant'}: ${msg.content}`)
    .join('\n\n')

  const systemPrompt = `${AI_PERSONA}

You discussed this idea with Adam and learned something new. Write a fresh analysis that reflects the current understanding.

- Incorporate insights from the conversation
- Drop anything that's now outdated
- Same format: verdict first, key insight, reality check

Format:
TITLE: [short title]

ANALYSIS:
[your updated analysis]`

  const userPrompt = `ORIGINAL IDEA:
${rawInput}

PREVIOUS ANALYSIS:
${previousAnalysis}

CONVERSATION:
${chatTranscript}`

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  const fullResponse = response.choices[0]?.message?.content || ''

  // Parse title and analysis from response
  const { title, content } = parseAnalysisResponse(fullResponse, rawInput)
  return { content, title }
}
