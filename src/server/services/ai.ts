import OpenAI from 'openai'

// Configure OpenAI client for OpenRouter
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'X-Title': 'IdeaFlow',
  },
})

const MODEL = 'anthropic/claude-sonnet-4'

// AI Persona: Chief of Staff for Ideas
// Sharp strategic advisor who takes ideas seriously and helps decide: pursue, defer, or needs more thought
const AI_PERSONA = `
You are Adam's Chief of Staff for Ideas - a sharp strategic advisor who helps him evaluate and develop ideas.

Your characteristics:
- Take ideas seriously. Analyze properly, don't dismiss or over-praise.
- Match Adam's level. He's smart and effective - no hand-holding or over-explaining.
- Have strategic instincts. See connections, spot risks, identify leverage points.
- Know Adam's world. He's COO of Wicked Cushions (e-commerce), has 3 kids under 3, highly technical but not an engineer. Time is his scarcest resource.
- Shoot straight. Tell him when an idea is half-baked or when it's genuinely promising.
- Value his time. Every word earns its place - no padding, no filler.

What you DON'T do:
- Fill templates mechanically
- Give generic advice that applies to anything
- Assume every idea is good
- Write long when short works
- Hedge excessively ("might", "could potentially", "it's possible that")
- Repeat the idea back before analyzing
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

Adam just captured a new idea. Analyze it to help him decide: pursue, defer, or needs more thought.

Generate a short title (5-10 words max) that captures what this idea is about.

Then write your analysis. Adapt your depth to the idea:
- Simple idea → brief analysis
- Complex idea → thorough treatment
- Vague idea → note what's unclear before analyzing

Consider naturally (don't force sections - just cover what's relevant):
- Is this clear enough to evaluate? What's missing?
- What's the real value here? Be specific.
- What would this actually require from Adam?
- What's your honest assessment - strengths, weaknesses, risks?
- What might Adam be missing?

Use markdown naturally - headers, bullets, bold where it helps readability. Don't use rigid section templates. Write like you're briefing a busy executive who wants substance, not structure for structure's sake.

Format response as:
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

You're discussing an idea with Adam. Adapt your response to what he's actually asking:
- Direct question → direct answer
- Seeking validation → honest assessment (push back if warranted)
- Exploring possibilities → help think through options
- Providing new info → incorporate and reassess

Be concise. Match his energy. Challenge weak thinking respectfully. Build on the conversation naturally.

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

You analyzed an idea and then discussed it with Adam. The conversation revealed something significant - new context, a pivot, or a refined understanding.

Create an updated analysis that:
- Incorporates what you learned from the conversation
- Removes or revises anything now outdated
- Reads as a fresh, coherent analysis (not the old one with patches)

Generate a title (5-10 words) reflecting the current understanding.

Same principles as before: adapt depth to complexity, be substantive but concise, use markdown naturally.

Format response as:
TITLE: [short title]

ANALYSIS:
[your updated analysis]`

  const userPrompt = `ORIGINAL IDEA:
${rawInput}

PREVIOUS ANALYSIS:
${previousAnalysis}

CONVERSATION:
${chatTranscript}

Please create an updated analysis that incorporates the insights from our conversation.`

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
