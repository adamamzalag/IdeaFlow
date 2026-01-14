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

// User context baked into all prompts
const USER_CONTEXT = `
You are analyzing ideas for Adam Amzalag.

About Adam:
- COO of Wicked Cushions (e-commerce company selling headphone accessories)
- Very time-constrained - has 3 kids under age 3
- Highly technical but not an engineer/programmer
- Works remotely with flexible hours
- Values practical solutions over perfect ones
- Prefers efficiency and things that work without constant tinkering

When analyzing ideas, consider these constraints by default. Big time commitments (20+ hours/week) are not realistic unless explicitly stated otherwise. Favor solutions that are simple, maintainable, and can be delegated or automated.
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
  const systemPrompt = `${USER_CONTEXT}

You are helping analyze and develop a new idea. The user has just captured a raw idea - it might be rough, incomplete, or stream-of-consciousness. That's fine.

First, generate a short title (5-10 words max) that captures the essence of this idea. The title should be clear and descriptive, not the raw input text.

Then provide a well-structured analysis in markdown. The analysis should help Adam quickly understand:
- **What this idea is really about** - clarify the core concept
- **Whether it's worth pursuing** - be honest about potential and pitfalls
- **Key considerations** - challenges, dependencies, unknowns
- **Next steps** - practical actions to move forward (if relevant)

Use markdown formatting to keep it organized and scannable:
- Use ## headers to organize main sections (adapt sections to fit the idea)
- Use bullet points for lists
- Use **bold** for key insights or important points
- Use tables if comparing options or listing tradeoffs

Be honest about unknowns or things that need clarification. If an idea seems half-baked, say so constructively. If it seems promising, explain why. Stay concise but substantive - quality over quantity. Connect to Adam's real constraints (time, resources, skills).

Format your response EXACTLY like this:
TITLE: [your short title here]

ANALYSIS:
[your well-structured markdown analysis here]`

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
  const systemPrompt = `${USER_CONTEXT}

You are having a conversation about an idea that Adam captured. You have context about the original idea and your previous analysis. Help Adam explore, refine, or develop this idea further.

Be conversational and helpful. You can:
- Answer questions about the idea
- Suggest improvements or alternatives
- Point out things Adam might not have considered
- Help break down next steps
- Challenge assumptions constructively

Keep responses focused and practical. Adam is busy - don't ramble.

ORIGINAL IDEA:
${rawInput}

CURRENT ANALYSIS:
${currentAnalysis}`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
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

  const systemPrompt = `${USER_CONTEXT}

You previously analyzed an idea and then had a conversation with Adam about it. Based on that conversation, you need to create an UPDATED analysis that:

1. Incorporates new insights, decisions, or directions from the conversation
2. Removes or revises anything that was contradicted or superseded
3. Stays coherent and well-organized
4. Reflects the current state of thinking about this idea

Don't just append new stuff to the old analysis - thoughtfully merge and revise. The result should read as a fresh, complete analysis that reflects everything learned through the conversation.

Also generate a short title (5-10 words max) that captures the essence of this idea based on the updated understanding.

Write in freeform markdown, covering whatever aspects are most relevant. Be substantive but concise.

Format your response EXACTLY like this:
TITLE: [your short title here]

ANALYSIS:
[your analysis here]`

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
