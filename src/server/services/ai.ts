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

/**
 * Retry wrapper for network errors (connection drops, timeouts)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const isNetworkError = lastError.message.includes('terminated') ||
        lastError.message.includes('socket') ||
        lastError.message.includes('ECONNRESET')

      if (!isNetworkError || attempt === maxRetries) {
        throw lastError
      }
      console.warn(`Retry ${attempt + 1}/${maxRetries} after network error: ${lastError.message}`)
      await new Promise(r => setTimeout(r, delay * (attempt + 1)))
    }
  }
  throw lastError
}

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

Use this exact structure:

## Bottom Line
[1-2 sentences: pursue/defer/needs work + why. This is the only section many users read.]

## Key Points
- [Most important insight]
- [Second insight if needed]
- [Reality check - what it would actually take]

## Detail
[Optional: deeper analysis ONLY for complex ideas. Skip entirely for simple ones.]

Match depth to complexity. Simple idea = Bottom Line + 2-3 Key Points. No Detail section needed.

If current info helps (tools, pricing, competitors), search the web.

Format:
TITLE: [short title]

ANALYSIS:
[your analysis using structure above]`

  const response = await withRetry(() =>
    openrouter.chat.completions.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here's my idea:\n\n${rawInput}` },
      ],
    })
  )

  const fullResponse = response.choices[0]?.message?.content || ''

  // Parse title and analysis from response
  const { title, content } = parseAnalysisResponse(fullResponse, rawInput)
  return { content, title }
}

/**
 * Parses the AI response to extract title and analysis
 */
function parseAnalysisResponse(response: string, rawInput: string): { title: string; content: string } {
  const titleMatch = response.match(/^TITLE:\s*(.+?)(?:\n|$)/im)
  const analysisMatch = response.match(/ANALYSIS:\s*([\s\S]*)/im)

  const title = titleMatch?.[1]?.trim()
    || rawInput.slice(0, 50) + (rawInput.length > 50 ? '...' : '')

  const content = analysisMatch?.[1]?.trim()
    || (titleMatch ? response.replace(/^TITLE:\s*.+?\n/im, '').trim() : response.trim())

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

Hallway conversation. Adam asked a question. Answer it.

Rules:
- First sentence IS the answer. No setup, no "Great question", no restating.
- Add detail only if the question requires it.
- Use markdown (bold, bullets) for scannable responses.
- Search the web if current info helps.

ORIGINAL IDEA:
${rawInput}

CURRENT ANALYSIS:
${currentAnalysis}`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory,
    { role: 'user', content: userMessage },
  ]

  const response = await withRetry(() =>
    openrouter.chat.completions.create({
      model: MODEL,
      max_tokens: 1000,
      messages,
    })
  )

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

You discussed this idea with Adam. Write a fresh analysis reflecting current understanding.

Use this exact structure:

## Bottom Line
[1-2 sentences: pursue/defer/needs work + why]

## Key Points
- [Most important insight]
- [Second insight if needed]
- [Reality check]

## Detail
[Optional: only for complex ideas]

Incorporate conversation insights. Drop outdated info.

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

  const response = await withRetry(() =>
    openrouter.chat.completions.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
  )

  const fullResponse = response.choices[0]?.message?.content || ''

  // Parse title and analysis from response
  const { title, content } = parseAnalysisResponse(fullResponse, rawInput)
  return { content, title }
}
