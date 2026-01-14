import OpenAI from 'openai'

// Configure OpenAI client for OpenRouter
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
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
}

/**
 * Generates initial analysis for a new idea
 */
export async function generateAnalysis(rawInput: string): Promise<AnalysisResult> {
  const systemPrompt = `${USER_CONTEXT}

You are helping analyze and develop a new idea. The user has just captured a raw idea - it might be rough, incomplete, or stream-of-consciousness. That's fine.

Your job is to write a thoughtful analysis in freeform markdown. Don't use rigid sections or templates - write naturally, covering whatever aspects are most relevant to THIS specific idea. You might touch on:
- What the core concept seems to be
- Why it might be valuable or interesting
- Potential challenges or considerations
- Questions worth exploring
- Connections to Adam's context (e-commerce, limited time, etc.)
- Rough sense of effort/complexity if relevant

Write conversationally but substantively. Be honest - if an idea seems half-baked, say so constructively. If it seems promising, explain why. The goal is to help Adam think through the idea, not to fill out a form.`

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here's my idea:\n\n${rawInput}` },
    ],
  })

  const content = response.choices[0]?.message?.content || ''
  return { content }
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

Write in freeform markdown, covering whatever aspects are most relevant. Be substantive but concise.`

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

  const content = response.choices[0]?.message?.content || ''
  return { content }
}
